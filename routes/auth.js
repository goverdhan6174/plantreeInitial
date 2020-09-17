const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/db");
const generateId = require('../services/randomStringID');
const validator = require("../model/registerUserSchema");


//@TODO: seperate the auth and user

router.post("/register", async (req, res) => {
  let { UsersCollection, client } = await db();

  const userId = generateId();
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const rePassword = req.body.repassword;

  let validationError = validator.UsersValidation({ userId , username, password , email });
  if (validationError) return res.status(400).send(validationError.details[0].message);

  try {
    let user = await UsersCollection.findOne({ username});
    if (user) return res.status(400).send(`userName is not available`);
    if(password !== rePassword)return res.status(400).send(`Passwords doesnt match`);

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(password , salt);
     
    let userObj = { userId , username, email, password : hashedPassword };

    let savedUser = await UsersCollection.insertOne(userObj);
    const token = jwt.sign({id : savedUser.id} , process.env.JWT_TOKEN_SECRET);
    res.header('jwt-auth-token',token).send({token : token , savedUser : savedUser});
  }
  catch (error) {
    res.status(400).send(error);
  }
  finally {
    console.log("db connection closes")
    client.close()

  }
});

router.post("/login", async (req, res) => {
  let { UsersCollection, client } = await db();

  let username = req.body.username;
  let password = req.body.password;
  
  try {
    let user = await UsersCollection.findOne({username});
    if (!user ) return res.status(400).send(`userName or password is not correct.`);

    let isPasswordMatched = await bcrypt.compare(password ,user.password);
    if (!isPasswordMatched ) return res.status(400).send(`userName or password is not correct`);


    const token = jwt.sign({userId : user.userId} , process.env.JWT_TOKEN_SECRET);

    res.header('jwt-auth-token',token).send({ "jwt-auth-token":token});
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
