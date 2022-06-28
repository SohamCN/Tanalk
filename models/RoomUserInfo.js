const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const RoomUserSchema = new Schema({
  room : {
    type: Schema.Types.ObjectId,
    ref: 'gathering'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  activeInRoom: {
    type: String,
    required: false
  }
}, {timestamps: true});

module.exports = Room = mongoose.model("roomuser", RoomSchema);
