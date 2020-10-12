const jwtParseToken = require("../services/jwtParseToke");

// parse the token then jump to next router else return Error 

module.exports = function authMiddleware(req, res, next) {
  const token = req.header("jwt-auth-token");
  try {
    if (!token) {
      console.log("TODO :: " ,"Access Denied : Redirect to Login Page ");
      res.status(401).send("Access Denied ");
    }
    const verified = jwtParseToken(token);
    if (verified) next();
    else console.log("auth-token-isn't verified", req);
  } catch (error) {
    res.status(408).send("Invalid Token");
  }
};
