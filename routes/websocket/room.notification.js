const moment = require('moment');
const querystring = require('querystring');
const Activity = require("../../models/Activity");

exports.handleRoomNotification = function (websocket, query) {
  const {roomSid, sinceTime} = querystring.parse(query);

  console.log(roomSid, sinceTime);
  const today = moment().startOf("day");

  const intervalID = setInterval(() => {
    Activity.find({
      roomSid: roomSid,
      date: {
        $gte: moment.unix(Number(sinceTime)).toDate(),
        $lte: moment(today)
            .endOf("day")
            .toDate()
      }
    })
        .then(result => {
          console.log(result);
          websocket.send(JSON.stringify({success: true, cause: "", newActivity: result}));
        })
        .catch(function (err) {
          websocket.send(JSON.stringify({success: false, cause: err}));
        });

  }, 4000);

  websocket.on('close', () => clearInterval(intervalID));
};