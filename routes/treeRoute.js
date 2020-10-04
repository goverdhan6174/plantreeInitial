const router = require("express").Router();
const { ObjectId } = require('mongodb');
const generateId = require("../services/randomStringID");
const jwtParseToken = require("../services/jwtParseToke");
const moment = require('moment');

const db = require("../db/db");
const validator = require("../model/treeSchema");

router.post("/createtree", async (req, res) => {

  let { UsersCollection, TreesCollection, client } = await db();
  let tree = {
    treename: req.body.treename,
    investment: req.body.investment,
    admins: req.body.admins.map(id => ObjectId(id)),
    principal: req.body.principal,
    returnValue: req.body.returnValue,
    days: req.body.days,
    createTime: moment().toISOString(),
    netBalance: req.body.investment,
  }
  //@TODO: fixed to 2 digit for unitCollection and unitFine
  tree.unitCollection = tree.returnValue / tree.days;
  tree.unitFine = tree.unitCollection * 0.1;

  let currentUserId = ObjectId(jwtParseToken(req.header("jwt-auth-token")).id);
  tree.createdBy = currentUserId;

  try {
    let validationError = validator.createTreeValidation(tree);
    if (validationError) return res.status(400).send(validationError.details[0].message);

    tree.admins.push(currentUserId);

    let savedTree = await TreesCollection.insertOne(tree);
    const run = async () => {
      const promises = [];
      tree.admins.forEach((adminId) => {
        promises.push(UsersCollection.updateOne({ "_id": adminId }, { $push: { trees: { $each: [savedTree.ops[0]._id] } } }));
      });

      await Promise.all(promises);
    };
    await run();

    res.send({ "tree": savedTree });
  }
  catch (error) {
    console.log("try catch , catch an errors", error)
    res.status(400).send(error);
  }
  finally {
    console.log("db connection closes")
    client.close()

  }

});

//@TODO: add member only when there isnet balance 
router.patch("/addmember", async (req, res) => {
  const { TreesCollection, client } = await db();
  const memberId = generateId();
  const treeId = req.body.treeId;

  const currentUserId = jwtParseToken(req.header("jwt-auth-token")).userId;

  let member = {
    memberId,
    name: req.body.name,
    noOfPackages: req.body.noOfPackages,
    joinedAt: moment().toISOString(),
    lastPaymentwrtJoin: moment().toISOString(),
    addBy: ObjectId(currentUserId),
  }

  try {
    //@TODO: check wherher person who add member is a admin or not

    let tree = await TreesCollection.findOne({ "_id": ObjectId(treeId) });
    if (!tree) res.status(400).send({ "error": "tree doesn't exist" });

    let validationError = validator.addMemberValidation(member);
    if (validationError) return res.status(400).send(validationError.details[0].message);

    member.totalDues = { total: 0, dues: [] }


    let updatedNetBalance = tree.netBalance - (tree.principal * member.noOfPackages);
    if (updatedNetBalance < 0) return res.status(400).send({ "error": "don't have enough balance" })

    let treeCollection = await TreesCollection.updateOne(
      { "_id": ObjectId(treeId) },
      { $push: { members: { $each: [member] } }, $set: { "netBalance": updatedNetBalance } }
    )

    res.send(treeCollection);
  } catch (error) {
    res.status(400).send({ error })
  } finally {
    console.log("db closed")
    client.close()

  }
})

//@TODO: add due functionality 
router.patch("/pay", async (req, res) => {
  let { TreesCollection, client } = await db();

  let treeId = req.body.treeId;
  let memberId = req.body.memberId;
  let payment = req.body.payment;
  let transactionId = generateId();

  let validationError = validator.paymentValidation({ memberId, payment });
  if (validationError) res.status(400).send(validationError.details[0].message);

  try {
    let fine = 0;
    let prevTree = await TreesCollection.findOne({ "_id": ObjectId(treeId) });

    let { netBalance, unitCollection, unitFine, members } = prevTree;
    let member = members.filter(mem => mem.memberId === memberId);
    let { noOfPackages, lastPaymentwrtJoin } = member[0];

    if (netBalance === undefined || unitCollection === undefined || unitFine === undefined || noOfPackages === undefined || lastPaymentwrtJoin === undefined)
      return res.status(400).send({ "error": "params are undefined" });

    let now = moment();
    let days = now.diff(moment(lastPaymentwrtJoin), "days");
    let collection = (unitCollection * noOfPackages * (days + 1));
    if (days > 2) {
      fine = (days - 2) * unitFine * noOfPackages;
    }

    let updatedLastPaymentDate = moment(lastPaymentwrtJoin).add(days + 1, "days").toISOString();
    netBalance = netBalance + payment;

    let transaction = { transactionId, memberId, "totalPayment": payment, fine, "transactedAt": moment().toISOString() };
    await TreesCollection.updateOne({ "_id": ObjectId(treeId) }, { $push: { "transactions": { $each: [transaction] } }, $set: { "netBalance": netBalance } })

    let tree = await TreesCollection.updateOne(
      { "_id": ObjectId(treeId), "members.memberId": memberId },
      { $push: { "members.$.transactions": { $each: [transactionId] } }, $set: { "members.$.lastPaymentwrtJoin": updatedLastPaymentDate } }
    )


    if (!tree) res.status(400).send({ "error": "tree isn't available " });

    res.send({ tree })

  } catch (error) {

  } finally {
    client.close();
  }
})


module.exports = router;