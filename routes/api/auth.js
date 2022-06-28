const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const mongoose = require('mongoose');

// @route   GET api/auth
// @desc    description
// @access  protected
router.get("/", auth, (req, res) => {
  res.send("auth route");
});

module.exports = router;
