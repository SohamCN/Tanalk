const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
const friendSchema = new Schema({
      name: {
        type:ObjectID,
        ref: 'user'
      },
      Econtertimes: {
        type:Number,
        required: true,
        default: 0
      }
});

const showSchema = new Schema({
      showname : {
        type: String,
        required: false,
        maxlength: 30
      },
      rating : {
        type: Number,
        required: true,
        default: 0
      }
});
*/

const userSchema = new Schema({
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: false
  },
  points: {
    type: Number,
    default: 0,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: true,
  }
  // channel: [channelSchema],
  // friends: [friendSchema]
}, {timestamps: true});

module.exports = mongoose.model("user", userSchema);
