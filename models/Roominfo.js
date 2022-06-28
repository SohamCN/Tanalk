const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const RoomSchema = new Schema({
  gathering : {
    type: Schema.Types.ObjectId,
    ref: 'gathering'
  },
  audience: [{
    type: Schema.Types.ObjectId,
    ref: 'user'
  }],
  topic: {
    type: String,
    required: false
  }
}, {timestamps: true});

module.exports = Room = mongoose.model("room", RoomSchema);
