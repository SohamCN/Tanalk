const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const passport = require("passport");
const mongoose = require('mongoose')
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
@route   GET api/allgatherings
@desc    Get all gatherings without authorizing caller
@access  Public
*/
router.get(
  "/",
  async (req, res) => {
    try {
      const result = await Gathering.find();
      let events = [];
      // forEach does not work here https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
      for (const value of result) {
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
        const show = await Show.findById(value.show._id);
        if (!show) {
          event.showCategory = "";
          event.showCover = "";
        } else {
          event.showCategory = show.category;
          event.showCover = show.cover;
        }
        events.push(event);
      };
      return res.json({events: events});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
  }
);

module.exports = router;
