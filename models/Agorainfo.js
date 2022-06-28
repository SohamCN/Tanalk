const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const AgoraSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  appID: {
    type: String,
    required: true
  },
  appCertificate: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  rtcToken: {
    type: String,
    required: true
  },
  rtmToken: {
    type: String,
    required: true
  }
}, {timestamps: true});

module.exports = Room = mongoose.model("agora", AgoraSchema);
