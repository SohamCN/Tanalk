const express = require("express");
const config = require("config");
const router = express.Router();
const mongoose = require('mongoose')
const User = require("../../models/Userinfo");
const Content = require("../../models/Contentinfo");
const Gathering = require("../../models/Gatheringinfo");
const passport = require("passport");
require("../../middleware/auth")
const {check, validationResult} = require("express-validator");

/**
@route   POST api/contents
@desc    Create content under a gathering
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
    
    const {gatheringId, authorId, text, imageURL, audioFileURL, linkURL, like} = req.body;
    const userId = req.user.id;
    try {
      // check if the user exists 
      let user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({error: [{msg: "User not found"}]});
      }

      // check if the author exists 
      let author = await User.findById(authorId);
      if (!author) {
        return res
          .status(404)
          .json({error: [{msg: "Author not found"}]});
      }

      // check if the gathering exists 
      let gathering = await Gathering.findById(gatheringId);
      if (!gathering) {
        return res
          .status(404)
          .json({error: [{msg: "Gathering not found"}]});
      }

      // TODO transaction
      let content = new Content({
        gathering,
				author,
        text,
        imageURL,
        audioFileURL,
        linkURL,
        like
        });
      await content.save();

      return res.json({gatheringId: gatheringId, contentId: content.id});
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
  }
);

// @route   GET api/contents
// @desc    get a content based upon id
// @access  private
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

      const {contentId} = req.body;
      let content = await Content.findById(contentId);
      if (!content) {
        return res
          .status(404)
          .json({error: [{msg: "Content not found"}]});
      }

      return res.json({gatheringId: content.gatheringId,
        author: content.author,
        text: content.text,
        imageURL: content.imageURL,
        audioFileURL: content.audioFileURL,
        linkURL: content.linkURL,
        like: content.like,
        createdAt: content.createdAt
      });
    } catch (error) {
      return res.status(500).json({errors: [{msg: error.message}]});
    }
  }
);

router.post("/by-topic", (req, res) => {
  const { topicId } = req.body;
  Post.find({ topicId: topicId })
    .then((result) => {
      console.log(result);
      res.json({ success: true, cause: "", posts: result });
    })
    .catch(function (err) {
      res.json({ success: false, cause: err });
    });
});

router.post("/feed", (req, res) => {
  const { userId } = req.body;
  console.log(userId);
  User.findById(userId)
    .then((user) => {
      console.log(user);
      Post.find({
        topicId: {
          $in: user.topics,
        },
      })
        .then((result) => {
          console.log(result);
          res.json({ success: true, cause: "", posts: result });
        })
        .catch(function (err) {
          res.json({ success: false, cause: err });
        });
    })
    .catch(function (err) {
      res.json({ success: false, cause: err });
    });
});

// @route   POST api/posts/create
// @desc    create a new group room
// @access  public
router.post("/create", (req, res) => {
  const { userId, headline, description, imageURL, topicId } = req.body;

  let post = new Post({ userId, headline, description, imageURL, topicId });
  console.log(req.body);
  post
    .save()
    .then((result) => {
      console.log(result);
      res.json({ success: true, cause: "", posts: result });
    })
    .catch(function (err) {
      return { success: false, cause: err };
    });
});

module.exports = router;
