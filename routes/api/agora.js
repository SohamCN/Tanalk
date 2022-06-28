const express = require("express");
const config = require("config");
const router = express.Router();
const mongoose = require('mongoose')
const passport = require("passport");
const moment = require("moment");
const {RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole} = require('agora-access-token')
const User = require("../../models/Userinfo");
const Event = require("../../models/Gatheringinfo");
const Room = require("../../models/Roominfo");
const Agora = require("../../models/Agorainfo");
const { check, validationResult } = require("express-validator");

require("../../middleware/auth");

router.get("/test", (req, res) => res.json({ msg: "Agora api works" }));

/**
@route   POST api/agora
@desc    create a new agora rtc & rtm access token by channel name, role, uid. default role publisher
@access  private
*/
router.post(
  "/",
  //passport.authenticate("jwt", {session: false}),
  async (req, resp) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    // set response header
    resp.header('Acess-Control-Allow-Origin', '*');
    
    let {channel, userId, publisher, eventId} = req.body;

    //get eventData
    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({error: [{msg: "Event not found"}]});
    }

    let host = true;
    if(event.user != userId){
      host = false;
      console.log("I am not host");
    }else{
      console.log("I am host");
    }

    let role = publisher && publisher === true? "publisher":"audience";
    //let tokentype = publisher && publisher === true ? "uid" : "userAccount";
    let tokentype = "uid";

    // get channel name
    if (!channel) {
      return resp.status(500).json({ 'error': 'channel is required' });
    }

    if (role === 'publisher') {
      role = RtcRole.PUBLISHER;
    } else if (role === 'audience') {
      role = RtcRole.SUBSCRIBER
    } else {
      return resp.status(500).json({ 'error': 'role is incorrect' });
    }
    let user;
    try {
      if(!userId || userId === '') {
        return resp.status(500).json({ 'error': 'userId is required' });
      }else{
         // check if the user exists 
        user = await User.findById(userId);
        console.log(user);
        if (!user) {
          return res
            .status(404)
            .json({error: [{msg: "User not found"}]});
        }
      }
    } catch (error) {
      return resp.status(500).json({errors: [{msg: error.message}]});
    }

    // get the expire time
    const expirationTimeInSeconds = 3600 * 24
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    //let uid = publisher ? Math.floor(Math.random() * 100000) : user.name; 
    //console.log(`uid: ${uid}`);
    //let uid = userId;
    let uid = Math.floor(Math.random() * 100000);
    const appID = "1e9310dd3fb843bd8664905af9003cab";
    const appCertificate = "1f79fb74082d477682e77714c845bab2";

    // build the token
    let rtcToken;
    if (tokentype === 'userAccount') {
      rtcToken = RtcTokenBuilder.buildTokenWithAccount(appID, appCertificate, channel, uid, role, privilegeExpiredTs);
    } else if (tokentype === 'uid') {
      //uid will be of type integer
      rtcToken = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channel, uid, role, privilegeExpiredTs);
    } else {
      return resp.status(500).json({ 'error': 'token type is invalid' });
    }
    const rtmToken = RtmTokenBuilder.buildToken(appID, appCertificate, userId, role, privilegeExpiredTs);
    let channelName = channel;
    try {
      let agora = new Agora({
        appID,
        appCertificate,
        channelName,
        rtcToken,
        rtmToken
      });
      console.log(`agora object: \n ${JSON.stringify(agora)}`);
      await agora.save();    
    } catch (error) {
      return resp.status(500).json({errors: [{msg: error.message}]});
    }
    let roomId = "";
    if(!host){
      console.log("at line 126");
      let gathering = eventId;
      let topic = "Test room";
      let audience = [];
      let existingEventData = {};
      /**
       * check for event id related latest record and it's data
       */
      try {
        /**
         * Tweet.findOne({}, {}, { sort: { 'created_at' : -1 } }, function(err, post) {
  console.log( post );
});
         */
        await Room.findOne({gathering : eventId}, {}, { sort: { 'created_at' : -1 } }, function(err, data) {
          console.log( data );
          existingEventData = data;
        });;
        console.log("inside exitsing data");
        console.log(existingEventData);
      } catch (error) {
        console.log("fetching gathering data error at line 136: "+error);
      }
      let isNewRoom = true;
      let userExists = false;
      if(existingEventData && existingEventData.audience.length <4 ){
        isNewRoom = false;
        audience = existingEventData.audience;
        console.log("in existing data");
        console.log(existingEventData.audience.includes(userId));
        if(!existingEventData.audience.includes(userId)){
          userExists = false;
          audience.push(userId);
        }else if(existingEventData.audience.includes(userId)){
          userExists = true;
        }
      }else{
        audience.push(userId)
      }
      
      try {
        if(isNewRoom){
          let room = new Room({
            gathering,
            audience,
            topic
          });
          console.log("room object", room);
          await room.save((err,room)=>{
            roomId = room._id;
            // return the token
            return resp.status(200).json({
              'uid': uid,
              'channel' : channel, 
              'rtcToken': rtcToken,
              'rtmToken' : rtmToken,
              'roomId' : roomId,
              'message' : "Token created"
            });
          });
        }else{
          roomId = existingEventData._id;
          if(!userExists){
            await Room.updateOne({gathering : event},{$set : {
              audience : audience
            }},{},(err,data)=>{
              console.log("updating existing room record")
              return resp.status(200).json({
                'uid': uid,
                'channel' : channel, 
                'rtcToken': rtcToken,
                'rtmToken' : rtmToken,
                'roomId' : roomId,
                'message' : "Token created"
              });
              
            })
          }else{
            return resp.status(200).json({
              'uid': uid,
              'channel' : channel, 
              'rtcToken': rtcToken,
              'rtmToken' : rtmToken,
              'roomId' : roomId,
              'message' : "Token created"
            });
          }
          
        }
        
      } catch (error) {
        console.log("error--"+error);
      }
    }else{
       // return the token
      return resp.status(200).json({
        'uid': uid,
        'channel' : channel, 
        'rtcToken': rtcToken,
        'rtmToken' : rtmToken,
        'roomId' : roomId,
        'message' : "Token created"
      });
    }

   
    
});

router.post(
  "/rtmToken",
  passport.authenticate("jwt", {session: false}),
  async (req, resp) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    // set response header
    resp.header('Acess-Control-Allow-Origin', '*');
    
    let {channel, userId, publisher} = req.body
    let role = publisher && publisher === true? "publisher":"audience";
    //let tokentype = publisher && publisher === true ? "uid" : "userAccount";
    let tokentype = "uid";

    // get channel name
    if (!channel) {
      return resp.status(500).json({ 'error': 'channel is required' });
    }

    if (role === 'publisher') {
      role = RtcRole.PUBLISHER;
    } else if (role === 'audience') {
      role = RtcRole.SUBSCRIBER
    } else {
      return resp.status(500).json({ 'error': 'role is incorrect' });
    }
    let user;
    try {
      if(!userId || userId === '') {
        return resp.status(500).json({ 'error': 'userId is required' });
      }else{
         // check if the user exists 
        user = await User.findById(userId);
        console.log(user);
        if (!user) {
          return res
            .status(404)
            .json({error: [{msg: "User not found"}]});
        }
      }
    } catch (error) {
      return resp.status(500).json({errors: [{msg: error.message}]});
    }

    // get the expire time
    const expirationTimeInSeconds = 3600 * 24
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    //let uid = publisher ? Math.floor(Math.random() * 100000) : user.name; 
    //console.log(`uid: ${uid}`);
    //let uid = userId;
    let uid = Math.floor(Math.random() * 100000);
    const appID = "1e9310dd3fb843bd8664905af9003cab";
    const appCertificate = "1f79fb74082d477682e77714c845bab2";

    // build the token
    let rtcToken;
    if (tokentype === 'userAccount') {
      rtcToken = RtcTokenBuilder.buildTokenWithAccount(appID, appCertificate, channel, uid, role, privilegeExpiredTs);
    } else if (tokentype === 'uid') {
      //uid will be of type integer
      rtcToken = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channel, uid, role, privilegeExpiredTs);
    } else {
      return resp.status(500).json({ 'error': 'token type is invalid' });
    }
    const rtmToken = RtmTokenBuilder.buildToken(appID, appCertificate, userId, role, privilegeExpiredTs);
    let channelName = channel;
    try {
      let agora = new Agora({
        appID,
        appCertificate,
        channelName,
        rtcToken,
        rtmToken
      });
      console.log(`agora object: \n ${JSON.stringify(agora)}`);
      await agora.save();      
    } catch (error) {
      return resp.status(500).json({errors: [{msg: error.message}]});
    }
    // return the token
    return resp.status(200).json({
      'uid': uid,
      'channel' : channel, 
      'rtcToken': rtcToken,
      'rtmToken' : rtmToken,
      'message' : "Token created"
    });
    
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
