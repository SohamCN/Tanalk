const express = require("express");
const config = require("config");
const router = express.Router();
const mongoose = require('mongoose')
const moment = require("moment");
const passport = require("passport");
const User = require("../../models/Userinfo");
const Show = require("../../models/Showinfo");
const {validationResult} = require("express-validator");

/**
@route   POST api/shows
@desc    Create show for a user
@access  Private
*/
router.post(
  "/",
  passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    
    const {name, description, cover, category} = req.body;
    const userId = req.user.id;
    try {
      // check if the user exists 
      let user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }

      let show = new Show({
        name,
        description,
        cover,
        category,
        user
        });
      await show.save();
      return res.json({userId: userId, showId: show.id});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
});

/**
@route   GET api/shows
@desc    Get all shows for a user
@access  Private
*/
router.get(
  "/",
  passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    
    const userId = req.user.id;
    try {
      // check if the user exists 
      let user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }

      const result = await Show.find({user: user});
      let shows = [];
      result.forEach((value) => {
        let show = {};
        show.showId = value.id;
        show.showName = value.name;
        show.showCover = value.cover;
        show.showDescription = value.description;
        show.showCategory = value.category;
        show.showHost = user.id;
        shows.push(show);
      });
      return res.json({shows: shows});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
});

/** TODO: uncomment for future usage
router.post("/by-room", (req, res) => {
  const { roomSid } = req.body;
  Room.findOne({ sid: roomSid })
    .then(result => {
      console.log(result);
      Topic.findById(result.topicId)
        .then(resultTopic => {
          res.json({ success: true, cause: "", topics: resultTopic });
        })
        .catch(function(err) {
          res.json({ success: false, cause: err });
        });
    })
    .catch(function(err) {
      res.json({ success: false, cause: err });
    });
});

router.get("/by-id", (req, res) => {
  const { topicId } = req.body;
  Topic.findById(topicId)
    .then(result => {
      console.log(result);
      res.json({ success: true, cause: "", topics: result });
    })
    .catch(function(err) {
      res.json({ success: false, cause: err });
    });
});

// @route   POST api/rooms/create
// @desc    create a new group room
// @access  public
router.post("/create", (req, res) => {
  const { name, description, imageURL, category } = req.body;
  let topic = new Topic({ name, description, imageURL, category });
  topic
    .save()
    .then(result => {
      res.json({ success: true, cause: "", topics: result });
    })
    .catch(function(err) {
      return { success: false, cause: err };
    });
});
*/

module.exports = router;
