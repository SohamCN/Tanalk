const express = require("express");
const config = require("config");
const router = express.Router();
const mongoose = require('mongoose')
const passport = require("passport");
const moment = require("moment");
const User = require("../../models/Userinfo");
const Activity = require("../../models/Activity");
const Room = require("../../models/Roominfo");
const { check, validationResult } = require("express-validator");
require("../../middleware/auth")

// @route   GET api/rooms
// @desc    get all chat rooms
// @access  public
router.get("/", (req, res) => {
  client.video.rooms
    .list({ status: "completed", limit: 100 })
    .then(rooms => res.send(rooms));
});

router.get("/id", (req, res) => {
  const { roomId } = req.body;
  Room.findById(roomId)
    .populate("topic")
    .then(result => {
      console.log(result);
      res.json({ success: true, cause: "", newActivity: result });
    })
    .catch(function(err) {
      res.json({ success: false, cause: err });
    });
});

/**
@route   POST api/rooms
@desc    create a new chat room
@access  private
*/
router.post(
  "/",
  passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
  
    const {gathering, audience, topic, isMainRoom} = req.body;
    const userId = req.user.id;
    try {
      // check if the user exists 
      let user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }
      
      let room = new Room({
        gathering,
        audience,
        topic,
        isMainRoom
      });
      await room.save();
      return res.json({roomId: room.id});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
});

/**
@route   PUT api/rooms
@desc    update audience for a room
@access  private
*/
router.put(
  "/",
  passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
  
    const {roomId, audience} = req.body;
    const userId = req.user.id;
    try {
      // check if the user exists 
      let user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }
      
      await Room.findByIdAndUpdate(roomId, {audience: audience});
      return res.json({roomId: roomId});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
});

// @route   POST api/rooms/complete
// @desc    create a new group room
// @access  public
router.post("/complete", (req, res) => {
  const { sid } = req.body;
  client.video
    .rooms(sid)
    .update({ status: "completed" })
    .then(room => res.send(room));
});

router.post("/set-topic", (req, res) => {
  const { roomSid, topicId } = req.body;
  Room.findOneAndUpdate(
    { sid: roomSid },
    { $set: { topicId: topicId } },
    { upsert: true, returnNewDocument: true }
  )
    .then(result => {
      console.log(result);
      res.json({ success: true, cause: "", newActivity: result });
    })
    .catch(function(err) {
      res.json({ success: false, cause: err });
    });
});

// @route   POST api/rooms/search
// @desc    create a new group room
// @access  public
router.post("/search", (req, res) => {
  const { name } = req.body;
  client.video.rooms
    .list({ uniqueName: name, limit: 200 })
    .then(rooms => res.send(rooms));
});

// @route   POST api/rooms/access
// @desc    get access code to join the room
// @access  public
router.post("/access", (req, res) => {
  const { userId, room } = req.body;
  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  const token = new AccessToken(
    config.get("twilioSid"),
    config.get("twilioToken"),
    config.get("twilioSecret")
  );
  token.identity = userId;

  // Create a Video grant which enables a client to use Video
  // and limits access to the specified Room (DailyStandup)
  const videoGrant = new VideoGrant({
    room: room
  });

  // Add the grant to the token
  token.addGrant(videoGrant);

  // Serialize the token to a JWT string
  console.log(token.toJwt());

  res.send(token.toJwt());
});

router.post("/notifications", (req, res) => {
  const { sinceTime, roomSid } = req.body;

  const today = moment().startOf("day");

  Activity.find({
    roomSid: roomSid,
    date: {
      $gte: moment.unix(sinceTime).toDate(),
      $lte: moment(today)
        .endOf("day")
        .toDate()
    }
  })
    .then(result => {
      console.log(result);
      res.json({ success: true, cause: "", newActivity: result });
    })
    .catch(function(err) {
      res.json({ success: false, cause: err });
    });
});

module.exports = router;
