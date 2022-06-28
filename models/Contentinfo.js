const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create comment Schema
const CommentSchema = new Schema({
  author : {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  comment : {
    type: String,
    required : false,
    maxlength : 300
  }
});

// Create Schema
const ContentSchema = new Schema({
  gathering: {
    type: Schema.Types.ObjectId,
    ref: 'gathering'
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  text: {
    type: String,
    required: false,
  },
  imageURL: {
    type: String,
    required: false,
  },
  audioFileURL: {
    type: String,
    required: false
  },
  linkURL: {
    type: String,
    required: false
  },
  like: {
    type: Number,
    min: 0,
    default: 0
  }
  // comment : [CommentSchema]
}, {timestamps: true});

module.exports = mongoose.model("content", ContentSchema);
