const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const ActivitySchema = new Schema({
  user: {
    type: String,
    required: true
  },
  roomSid: [{
    type: Schema.Types.ObjectId,
    ref: 'room'
  }], 
  type: {
    type: String,
    required: true
  },
  data: {
    type: Boolean
  }
}, {timestamps: true});

module.exports = Room = mongoose.model("activity", ActivitySchema);
