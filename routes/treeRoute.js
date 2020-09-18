const router = require("express").Router();
const generateId = require("../services/randomStringID");
const jwtParseToken = require("../services/jwtParseToke");

const db = require("../db/db");
const validator = require("../model/treeSchema");

router.post("/createtree", async (req, res) => {
  let { UsersCollection, TreesCollection, client } = await db();

  const treeId = generateId();
  let tree = {
    treeId,
    treename: req.body.treename,
    investment: req.body.investment,
    admins: req.body.admins,
    principal: req.body.principal,
    returnValue: req.body.returnValue,
    days: req.body.days,
    createTime: Date(),
    netMoney: req.body.investment,
  }
  //@TODO: fixed to 2 digit for unitCollection and unitFine
  tree.unitCollection = tree.returnValue / tree.days;
  tree.unitFine = tree.unitCollection * 0.1;

  let currentUserId = jwtParseToken(req.header("jwt-auth-token")).userId;
  tree.createdBy = currentUserId;

  try {
    let validationError = validator.createTreeValidation(tree);
    if (validationError) return res.status(400).send(validationError.details[0].message);

    tree.admins.push(currentUserId);

    let savedTree = await TreesCollection.insertOne(tree);
    const run = async () => {
      const promises = [];
      tree.admins.forEach((adminId) => {
        promises.push(UsersCollection.updateOne({ "userId": adminId }, { $push: { trees: { $each: [savedTree.ops[0].treeId] } } }));
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

router.patch("/addmember", async (req, res) => {
  const { UsersCollection, TreesCollection, client } = await db();
  const memberId = generateId();
  const treeId = req.body.treeId;

  const currentUserId = jwtParseToken(req.header("jwt-auth-token")).userId;

  let member = {
    memberId,
    name: req.body.name,
    noOfPackage: req.body.noOfPackage,
    joinedAt: Date(),
    lastPaymentwrtJoin: Date(),
    addBy: currentUserId,
  }

  try {

    let tree = await TreesCollection.findOne({ "treeId": treeId });
    if (!tree) res.status(400).send({ "error": "tree doesn't exist" });

    let validationError = validator.addMemberValidation(member);
    if (validationError) return res.status(400).send(validationError.details[0].message);

    member.totalDues = {total : 0 , dues : []} 

    let treeCollection = await TreesCollection.updateOne({ "treeId": treeId }, { $push: { members: { $each: [member] } } })

    res.send(treeCollection);
  } catch (error) {
    res.status(400).send({ error })
  } finally {
    console.log("db closed")
    client.close()

  }
})

router.patch("/pay", async (req, res) => {
  let { TreesCollection, client } = await db();

  let treeId = req.body.treeId;
  let memberId = req.body.memberId;
  let payment = req.body.payment;
  let transactionId = generateId();


  let validationError = validator.paymentValidation({treeId , memberId , payment});
  if (validationError) res.status(400).send(validationError.details[0].message);

  try {
let fine = 0 ;
    
    let transaction = { transactionId , memberId ,"totalPayment": payment , fine, "transactedAt": Date()};
     await TreesCollection.updateOne({ "treeId": treeId }, { $push: { "transaction": { $each: [{ transaction }] } } })
     let tree = await TreesCollection.updateOne({ "treeId": treeId, "members.memberId": memberId }, { $push: { "members.$.transactions": { $each: [transactionId] } } })
    console.log(tree);
    if (!tree) res.status(400).send({ "error": "tree isn't available " });

    res.send({ tree })

  } catch (error) {

  } finally {
    client.close();
  }
})


module.exports = router;