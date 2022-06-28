const {RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole} = require('agora-access-token')



const agora = (req, res, next) => {
    res.json({message: "I am agora controller"}); // dummy function for now
};

module.exports = {agora};