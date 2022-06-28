const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const passport = require("passport");
const mongoose = require('mongoose');
const {RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole} = require('agora-access-token')
const User = require("../../models/Userinfo");
const Show = require("../../models/Showinfo");
const Content = require("../../models/Contentinfo");
const Gathering = require("../../models/Gatheringinfo");
const validateLoginInput = require("../../validation/login");
const Room = require("../../models/Roominfo");
require("../../middleware/auth")
const url = require('url');
const { DateTime } = require('luxon');

/**
@route   GET api/gatherings/test
@desc    Test gatherings route
@access  Public
*/
router.get("/test", (req, res) => res.json({ msg: "Gatherings works" }));

/**
@route   POST api/gatherings
@desc    Create gatherings route
@access  Private
*/
router.post(
  "/",
  //passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    const {showId, eventTitle, eventDescription, eventTime, eventRepeat, eventRepeatFrequency, userId} = req.body;

    //const userId = req.user.id;
		//const showId = show;

    console.log("Event api is called");
    try {
      // check if the user exists 
      let user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }

      // check if the show exists 
      const show = await Show.findById(showId);
      if (!show) {
        return res
          .status(404)
          .json({error: [{msg: "Show not found"}]});
      }
      const description = eventDescription;
      const title = eventTitle;
      const imageURL = "";
      const repeat = eventRepeat;
      const repeatFrequency = eventRepeatFrequency;
      const raisingHandList = [];
        
      let gathering = new Gathering({
        user,
				show,
        description,
        imageURL,
        title,
				eventTime,
				repeat,
				repeatFrequency,
        raisingHandList
        });
      console.log(`gethering object: \n ${JSON.stringify(gathering)}`);
      await gathering.save();

      return res.json({eventId: gathering.id, eventTitle: eventTitle, eventTime: DateTime.fromISO(eventTime).toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
  }
);

/**
@route   GET api/events?showId=
@desc    Get all events under this show
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

      // check if the showId or eventId exists 
      const queryObject = url.parse(req.url, true).query;
      const showId = queryObject['showId'];
      const eventId = queryObject['eventId'];
      if (showId) {
        const show = await Show.findById(showId);
        if (!show) {
          return res
            .status(404)
            .json({error: [{msg: "Show not found"}]});
        }
        
        // find all contents under this gathering
        const result = await Gathering.find({show: showId});
        let events = [];
        result.forEach((value) => {
          let event = {};
          event.eventId = value.id;
          event.eventTitle = value.title;
          event.eventDescription = value.description;
          event.eventTime = DateTime.fromJSDate(value.eventTime).toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);
          event.eventRepeat = value.repeat;
          event.eventRepeatFrequency = value.repeatFrequency;
          let hosts = [];
          hosts.push(value.user);
          event.eventHost = hosts;
          event.showCategory = show.category;
          events.push(event);
        });

        return res.json({events: events});
      } else if (eventId) {
        const event = await Gathering.findById(eventId);
        if (!event) {
          return res
            .status(404)
            .json({error: [{msg: "Event not found"}]});
        }
        
        // find all contents under this gathering
        const result = await Gathering.findById(eventId);
        let eventdetail = {};
        eventdetail.eventTitle = result.title;
        eventdetail.eventDescription = result.description;
        eventdetail.eventTime = DateTime.fromJSDate(result.eventTime).toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);
        eventdetail.eventRepeat = result.repeat;
        eventdetail.eventRepeatFrequency = result.repeatFrequency;
        let hosts = [];
        hosts.push(result.user);
        eventdetail.eventHost = hosts;
        const show = await Show.findById(result.show);
        if (!show) {
          return res
            .status(404)
            .json({error: [{msg: "Show not found"}]});
        }
        eventdetail.showCategory = show.category;
        eventdetail.showCover = show.cover;
        return res.json({eventDetail: eventdetail});
      }
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
  }
);

/**
@route   GET api/gatherings/raisinghandlist
@desc    Get the raising hand list under a gathering
@access  Private
*/
router.get(
  "/raisinghandlist",
  passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    const {gatheringId} = req.body;

    const userId = req.user.id;
    try {
      // check if the user exists 
      let user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }

      // check if the gathering exists 
      let gathering = await Gathering.findById(gatheringId);
      if (!gathering) {
        return res
          .status(404)
          .json({error: [{msg: "Gathering not found"}]});
      }

      return res.json({gatheringId: gatheringId, raisingHandList: gathering.raisingHandList});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
  }
);

/**
@route   PUT api/gatherings/raisinghandlist
@desc    Add or remove a user to gathering raising hand list
@access  Private
*/
router.put(
  "/raisinghandlist",
  passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    const {gatheringId, userId, raisingHand} = req.body;

    try {
      // check if the user exists 
      let user = await User.findById(req.user.id);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }

      // check if the raising hand user exists 
      let userR = await User.findById(userId);
      if (!userR) {
        return res
          .status(404)
          .json({error: [{msg: "Raising hand user not found"}]});
      }

      // check if the gathering exists 
      let gathering = await Gathering.findById(gatheringId);
      if (!gathering) {
        return res
          .status(404)
          .json({error: [{msg: "Gathering not found"}]});
      }

      let found = false;
      let users = gathering.raisingHandList;
      if (raisingHand) { // add user
        users.forEach(function(item, index) {
          if (item == userId) {
            found = true;
            // TODO: break out once found to speed up
          }
        })
        if (!found) {
          gathering.raisingHandList.push(userId);
          await gathering.save(gathering);
        } else {
          return res.status(400).json({errors: [{msg: "Raising hand user was added before"}]});
        }
      } else { // remove user
        let newUsers = []
        users.forEach(function(item, index) {
          if (item == userId) {
            found = true;
            // TODO: break out once found to speed up
          } else {
            newUsers.push(item);
          }
        })
        if (found) {
          gathering.raisingHandList = newUsers;
          await gathering.save(gathering);
        } else {
          return res.status(400).json({errors: [{msg: "Raising hand user was not in the list at all"}]});
        }
      }

      return res.json({gatheringId: gatheringId, raisingHandList: gathering.raisingHandList});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
  }
);

/**
@route   PUT api/gatherings/mainroom
@desc    Add or remove a raising hand user to gathering main room
@access  Private
*/
router.put(
  "/mainroom",
  passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    const {gatheringId, roomId, userId, addToMainRoom} = req.body;

    try {
      // check if the user exists 
      let user = await User.findById(req.user.id);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }

      // check if the raising hand user exists 
      let userR = await User.findById(userId);
      if (!userR) {
        return res
          .status(404)
          .json({error: [{msg: "Raising hand user not found"}]});
      }

      // check if the gathering exists 
      let gathering = await Gathering.findById(gatheringId);
      if (!gathering) {
        return res
          .status(404)
          .json({error: [{msg: "Gathering not found"}]});
      }

      // TODO: check and make sure userR presence in raising hand list
      
      // check room is the main audio room of the gathering
      let mainRoom = await Room.findById(roomId);
      if (!(mainRoom.isMainRoom && mainRoom.gathering == gatheringId)) {
        return res
        .status(404)
        .json({error: [{msg: "Given room is not the main audio room"}]});
      }
      
      if (addToMainRoom) {
        // make sure no more than 4 in the room
        if (mainRoom.audience.length >= 4) {
          return res
          .status(404)
          .json({error: [{msg: "Too many peopl in the main audio room"}]});        
        }
        mainRoom.audience.push(userR);  
      } else {
        let found = false;
        let newAudience = [];
        mainRoom.audience.forEach(function(item, index) {
          if (item == userId) {
            found = true;
            // TODO: break out once found to speed up
          } else {
            newAudience.push(item);
          }
        })
        // make sure the given user is already in main audio room
        if (!found) {
          return res
          .status(404)
          .json({error: [{msg: "Given user not in the main audio room"}]});        
        }
        mainRoom.audience = newAudience;
      }
      await mainRoom.save();

      return res.json({gatheringId: gatheringId, roomId: roomId, audience: mainRoom.audience});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
  }
);

/**
@route   GET api/gatherings/mainroom
@desc    Get all current users in current gathering main room
@access  Private
*/
router.get(
  "/mainroom",
  passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    const {gatheringId} = req.body;

    try {
      // check if the user exists 
      let user = await User.findById(req.user.id);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }

      // check if the gathering exists 
      let gathering = await Gathering.findById(gatheringId);
      if (!gathering) {
        return res
          .status(404)
          .json({error: [{msg: "Gathering not found"}]});
      }

      let mainRoom = await Room.findOne({$and:
        [{gathering: gatheringId}, {isMainRoom: true}]});
      if (!mainRoom) {
        return res
        .status(404)
        .json({error: [{msg: "No main audio room found for this gathering"}]});
      }
      return res.json({gatheringId: gatheringId, audience: mainRoom.audience});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
  }
);

/**
@route   PUT api/gatherings
@desc    Create a chat room under the gatherings
@access  Private
*/
router.put(
  "/",
  passport.authenticate("jwt", {session: false}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    const {gatheringId, isMainRoom} = req.body;

    const userId = req.user.id;
    try {
      // check if the user exists 
      let user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }

      // check if the gathering exists 
      let gathering = await Gathering.findById(gatheringId);
      if (!gathering) {
        return res
          .status(404)
          .json({error: [{msg: "Channel not found"}]});
      }

      const topic = 'data';
      let audience = [];
      audience.push(user);
      let room = new Room({
        gathering,
        audience,
        topic,
        isMainRoom
      });
      await room.save();

      return res.json({gatheringId: gathering.id, roomId: room._id});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
  }
);

module.exports = router;
