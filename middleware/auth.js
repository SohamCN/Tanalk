const config = require("config");
const passport = require("passport");
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

passport.use(
  new JwtStrategy(
    {
      secretOrKey: config.get("jwtSecret"),
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
    },
    async function(jwtPayload, done) {
      console.log("To be removed: ");
      console.log(jwtPayload);
      if (jwtPayload.id) {
        return done(null, jwtPayload);
      } else {
        return done(null, false);
      }
    }
  )
);


module.exports = function(req, res, next) {
/**

  // get token from header
  const token = req.header("x-auth-token");
  // check if no token
  if (!token) {
    return res.status(401).json({ msg: "Authorization denied. No token." });
  }
  // decode 
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    req.user = decoded.user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ msg: "Authorization denied. Token is invalid." });
  }
*/
};