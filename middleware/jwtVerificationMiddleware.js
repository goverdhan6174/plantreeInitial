const jwtParseToken = require("../services/jwtParseToke");

module.exports = function authMiddleware(req, res, next) {
  const token = req.header("jwt-auth-token");
  try {
    if (!token) {
      console.log("Access Denied : Redirect to Login Page ");
      res.status(401).send("Access Denied ");
    }
    const verified = jwtParseToken(token);
    if (verified) next();
    else console.log("auth-token-isn't verified", req);
  } catch (error) {
    res.status(408).send("Invalid Token");
  }
};
