const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const showSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  cover: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: false
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  }
}, {timestamps: true});

module.exports = mongoose.model("show", showSchema);
