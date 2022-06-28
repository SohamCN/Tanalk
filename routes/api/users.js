const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const config = require("config");
const {check, validationResult} = require("express-validator");
const passport = require("passport");
const mongoose = require('mongoose')
const User = require("../../models/Userinfo");
const Activity = require("../../models/Activity");
const validateLoginInput = require("../../validation/login");
require("../../middleware/auth")

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get("/test", (req, res) => res.json({ msg: "Users works" }));

// @route   POST api/users/applesign
// @desc    Apple sign in user / Returning JWT Token
// @access  Public
router.post("/applesign", (req, res) => {
  const name = req.body.name;
  const token = req.body.token;
  var email = "";
  var password = "";

  const client = jwksClient({
    cache: true,
    jwksUri: "https://appleid.apple.com/auth/keys"
  });
  const jwt_header = JSON.parse(new Buffer.from(token.split('.')[0], 'base64').toString());
  client.getSigningKey(jwt_header.kid, async (error, key) => {
    if (error) {
      return res.status(500).json({ errors: "Apple keys not found" });
    }

    var signingKey = key.publicKey || key.rsaPublicKey;
    jwt.verify(token, signingKey, function (err, userInfo) {
      if(err) {
        return res.status(500).json({ errors: "Apple identity token error" });
      }
      console.log(userInfo);
      if (!(userInfo["iss"] == "https://appleid.apple.com" &&
        userInfo["aud"] == "com.tanalk.tanalk" &&
        userInfo["email_verified"] == "true")) {
        return res.status(500).json({ errors: "Apple identity token invalidated" });
      };
      email = userInfo["email"];
      password = userInfo["sub"];
    });

    // Find user by email
    User.findOne({email}).then(async (user) => {
      // Check for user
      if (!user) {
        // add new user
        const avatar = gravatar.url(email, {
          s: "200",
          r: "pg",
          d: "mm",
        });

        user = new User({
          name,
          email,
          avatar,
          password
        });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
      }

      // sign token
      const payload = {id:user.id, email: email}; // Create JWT Payload
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {expiresIn: 14400},
        (err, mytoken) => {
          if (err) {
            throw err;
          }
          // console.log(user);
          return res.json({ user: user, token: mytoken, userid:user._id });
        }
      );
    });
  });
});

// @route   POST api/users/applesign
// @desc    Apple sign in user / Returning JWT Token
// @access  Public
router.post("/applesignsimulator", (req, res) => {
  const name = req.body.name;
  let token = req.body.token;
  var email = "pranay@capitalnumbers.com";
  var password = "";

  const client = jwksClient({
    cache: true,
    jwksUri: "https://appleid.apple.com/auth/keys"
  });
  const jwt_header = JSON.parse(new Buffer.from(token.split('.')[0], 'base64').toString());
  // client.getSigningKey(jwt_header.kid, async (error, key) => {
  //   if (error) {
  //     return res.status(500).json({ errors: "Apple keys not found" });
  //   }

  //   var signingKey = key.publicKey || key.rsaPublicKey;
  //   // jwt.verify(token, signingKey, function (err, userInfo) {
  //   //   if(err) {
  //   //     return res.status(500).json({ errors: "Apple identity token error" });
  //   //   }
  //   //   console.log(userInfo);
  //   //   if (!(userInfo["iss"] == "https://appleid.apple.com" &&
  //   //     userInfo["aud"] == "com.tanalk.tanalk" &&
  //   //     userInfo["email_verified"] == "true")) {
  //   //     return res.status(500).json({ errors: "Apple identity token invalidated" });
  //   //   };
  //   //   email = userInfo["email"];
  //   //   password = userInfo["sub"];
  //   // });

    
  // });
  // Find user by email
  User.findOne({email}).then(async (user) => {
    // Check for user
    if (!user) {
      // add new user
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      user = new User({
        name,
        email,
        avatar,
        password
      });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
    }

    // sign token
    const payload = {id:user.id, email: email}; // Create JWT Payload
    jwt.sign(
      payload,
      config.get("jwtSecret"),
      {expiresIn: 14400},
      (err, mytoken) => {
        if (err) {
          throw err;
        }
        // console.log(user);
        return res.json({ user: user, token: mytoken, userid: user._id });
      }
    );
  });
});

// @route   POST api/users
// @desc    register user
// @access  public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Email is required").isEmail(),
    check("password", "Password is required").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {name, email, password} = req.body;
    try {
      // check if the user exists
      let user = await User.findOne({email});
      if (user) {
        return res
          .status(400)
          .json({ error: [{ msg: "User already exists" }] });
      }

      // get gravatar
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      // create a token
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {expiresIn: 14400},
        (err, token) => {
          if (err) {
            throw err;
          }
          console.log(user);
          return res.json({ user: user, token: token });
        }
      );
    } catch (error) {
      return res.status(500).json({ errors: [{ msg: error.message }] });
    }
  }
);

// @route   POST api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post("/login", (req, res) => {
  const {errors, isValid} = validateLoginInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({email}).then((user) => {
    // Check for user
    if (!user) {
      errors.email = "User not found";
      return res.status(404).json(errors);
    }

    // Check Password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // User Matched
        const payload = { id: user.id, name: user.name, avatar: user.avatar }; // Create JWT Payload

        // Sign Token
        jwt.sign(
          payload,
          config.get("jwtSecret"),
          {expiresIn: 14400},
          (err, token) => {
            if (err) {
              throw err;
            }
            console.log(user);
            return res.json({ user: user, token: token });
          }
        );
      } else {
        errors.password = "Password incorrect";
        return res.status(400).json(errors);
      }
    });
  });
});

// @route   GET api/users
// @desc    Return current user specified with x-auth-token in header
// @access  Private
router.get(
  "/",
  passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    let user = await User.findById(req.user.id);
    return res.json({user: user});
  }
);

router.post("/profile", (req, res) => {
  const {userId} = req.body;

  User.findById(userId)
    .then((userResult) => {
      console.log(result); // this will be the new created ObjectId
      res.json({ user: userResult });
    })
    .catch(function (err) {
      res.json({ success: false, cause: err });
    });
});

router.post("/praise", (req, res) => {
  const { user, roomSid, data } = req.body;
  res.json(createActivity(user, roomSid, data, "praise"));
});

router.post("/report", (req, res) => {
  const {user, roomSid, data} = req.body;
  res.json(createActivity(user, roomSid, data, "report"));
});

router.post("/disagree", (req, res) => {
  const {user, roomSid, data} = req.body;
  res.json(createActivity(user, roomSid, data, "disagree"));
});

function createActivity(user, roomSid, data, activityType) {
  const activity = new Activity({
    user: user,
    roomSid: roomSid,
    data: data,
    type: activityType,
  });
  activity
    .save()
    .then((result) => {
      User.findById(result.user)
        .then((userResult) => {
          console.log(result); // this will be the new created ObjectId
          return { user: userResult, activity: result };
        })
        .catch(function (err) {
          return {success: false, cause: err};
        });
    })
    .catch(function (err) {
      return {success: false, cause: err};
    });
}

router.post("/change-topics", (req, res) => {
  console.log(req.body);
  const { userId, topics } = req.body;

  User.findByIdAndUpdate(
    userId,
    { topics: topics },
    { safe: true, upsert: true, new: true }
  )
    .then((userResult) => {
      console.log(userResult); // this will be the new created ObjectId
      res.json({ success: true, cause: "", user: userResult });
    })
    .catch(function (err) {
      res.json({ success: false, cause: err });
    });
});

module.exports = router;
