const router = require("express").Router();
const jwtParseToken = require("../services/jwtParseToke");
const db = require("../db/db");

router.get("/user", async (req, res) => {
  let { UsersCollection, client } = await db();
  let username = req.body.username;

  try {
    let user = await UsersCollection.findOne({ "username": username });
    if(!user) res.status(400).send({"error" : `No user present`});

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

router.get('/tree' , async(req,res) => {
  let { UsersCollection, TreesCollection ,client } = await db();
  try {
  let currentUserId = jwtParseToken(req.header("jwt-auth-token")).userId;

    let user = await UsersCollection.findOne({ "userId": currentUserId });
    if(!user) res.status(400).send({"error" : `No user present`});

    let treeArray = [];

    const run = async () => {
      const promises = [];
      user.trees.forEach((treeId) => {
        promises.push(TreesCollection.findOne({ "treeId": treeId }));
      });

     const logs = await Promise.all(promises);
      treeArray.push(logs);
    };

    await run();

    res.send(treeArray);
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


module.exports = router;