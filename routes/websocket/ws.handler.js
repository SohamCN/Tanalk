const url = require('url');
const {handleRoomNotification} = require('./room.notification');
exports.handleWebsocket = function (websocket, request) {
  const {pathname, query} = url.parse(request.url);
  switch (pathname) {
    case '/room-notification':
      return handleRoomNotification(websocket, query);
    default:
      return;
  }
};