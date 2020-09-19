const router = require("express").Router();
const {ObjectId} = require("mongodb");
const jwtParseToken = require("../services/jwtParseToke");
const db = require("../db/db");

router.get("/userfromdb", async (req, res) => {
  let { UsersCollection, client } = await db();
  let username = req.body.username;

  try {
    let user = await UsersCollection.findOne({ "username": username });
    if(!user) return res.status(400).send({"error" : `No user present`});

    res.send({user});
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

router.get('/treesfromuser' , async(req,res) => {
  let { UsersCollection, TreesCollection ,client } = await db();
  try {
  let currentUserId = jwtParseToken(req.header("jwt-auth-token")).id;
    let user = await UsersCollection.findOne({"_id" : ObjectId(currentUserId)});
    if(!user) return res.status(400).send({"error" : `No user present`});
    let treeArray = [];

    const run = async () => {
      if(user.trees === undefined) return ;
      const promises = [];
      user.trees.forEach((treeId) => {
        promises.push(TreesCollection.findOne({ "treeId": treeId }));
      });

     const logs = await Promise.all(promises);
      treeArray.push(logs);
    };

    await run();

    res.send({"treeArray" : treeArray});
  }
  catch (error) {
    console.log("try catch , catch an errors", error)
    res.status(400).send(error);
  }
  finally {
    console.log("db connection closes")
    client.close()

  }
})

router.get("/treefromdb", async (req, res) => {
  let { TreesCollection, client } = await db();
  let treeId = req.body.treeId;

  try {
    let tree = await TreesCollection.findOne({ "_id": ObjectId(treeId) });
    if(!tree)return res.status(400).send({"error" : `No tree present`});

    res.send({tree});
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

module.exports = router;