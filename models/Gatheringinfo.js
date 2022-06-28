const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create gathering schema
const gatheringSchema = mongoose.Schema({
/**
  show: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
*/
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  show: {
    type: Schema.Types.ObjectId,
    ref: 'show'
  },
  description: {
    type: String,
    required: false
  },
  imageURL: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: false
  },
	eventTime: {
		type: Date,
		required: true
	},
	repeat: {
		type: Boolean,
		required: false,
		default: false 
	},
	repeatFrequency: {
		type: String,
		required: false,
		default: "none"
	},
  raisingHandList: [{
    type: Schema.Types.ObjectId,
    ref: 'user'
  }]
}, {timestamps: true});

module.exports = mongoose.model("gathering", gatheringSchema);
