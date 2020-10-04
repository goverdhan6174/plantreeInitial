const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectID } = require("mongodb");
const db = require("../db/db");
const validator = require("../model/registerUserSchema");

//@TODO: seperate the auth and user

router.post("/register", async (req, res) => {
  let { AuthCollection, UsersCollection, client } = await db();
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const rePassword = req.body.repassword;

  let validationError = validator.UsersValidation({ username, password, email });
  if (validationError) return res.status(400).send(validationError.details[0].message);

  try {
    let user = await AuthCollection.findOne({ username });
    if (user) return res.status(400).send(`username is not available`);

    if (password !== rePassword) return res.status(400).send(`Passwords doesnt match`);

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let savedUser = await UsersCollection.insertOne({ username });
    await AuthCollection.insertOne({ o_id: savedUser.ops[0]._id, username, email, password: hashedPassword });

    const token = jwt.sign({ id: savedUser.ops[0]._id }, process.env.JWT_TOKEN_SECRET);
    res.header('jwt-auth-token', token).status(201).send(savedUser.ops[0]);
  }
  catch (error) {
    res.status(400).send(error);
  }
  finally {
    console.log("db connection closes")
    client.close()
  }
});

router.get("/login", async (req, res) => {
  let { AuthCollection, UsersCollection, TreesCollection, client } = await db();

  let username = req.body.username;
  let password = req.body.password;

  try {
    let user = await AuthCollection.findOne({ username });
    if (!user) return res.status(400).send(`userName or password is not correct.`);

    let isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) return res.status(400).send(`userName or password is not correct`);


    const token = jwt.sign({ id: user.o_id }, process.env.JWT_TOKEN_SECRET);

    let treeArray = [];

    const run = async () => {
      let userProfile = await UsersCollection.findOne({ "_id": ObjectID(user.o_id) });
      if (!userProfile) return res.status(500).send(`Server Error : Sorry User isn't available in our database`);
      const promises = [];
      userProfile.trees.forEach((treeId) => {
        promises.push(TreesCollection.findOne({ "_id": ObjectID(treeId) }));
      });

      const logs = await Promise.all(promises);
      treeArray.push(...logs);
    };

    await run();
    res.status(200).header('jwt-auth-token', token).send(treeArray);
  }
  catch (error) {
    res.status(400).send(error);
  }
  finally {
    console.log("db connection closes")
    await client.close()
  }
});




module.exports = router;
