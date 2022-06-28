const http = require('http');
const express = require('express');
const ws = require('ws');
const connectDB = require('./config/db');
const handleWebsocket = require("./routes/websocket/ws.handler");
const passport = require('passport');

const app = express();
const PORT = normalizePort(process.env.PORT|| "5000");
app.set('port', PORT);
app.use(passport.initialize());
connectDB();

const server = http.createServer(app);
// const io = require('socket.io')(server);
// const { setupBroadcast, broadcast } = require('./broadcast/broadcast');

app.use(express.json({ extended: false }));

app.get('/', (req, res) => {
  res.send(`all is good`);
});

app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/rooms', require('./routes/api/rooms'));
app.use('/api/shows', require('./routes/api/shows'));
app.use('/api/contents', require('./routes/api/contents'));
app.use('/api/events', require('./routes/api/gatherings'));
app.use('/api/allevents', require('./routes/api/allgatherings'));
app.use('/api/agora', require('./routes/api/agora'));

// wss.on('connection', (websocket, req) => {
//   handleWebsocket(websocket, req);
// });

server.listen(PORT, () => {
  console.log(`server started on ${PORT}`);
});

/*
setupBroadcast()
  .then(() => broadcast(io))
  .catch(console.log);
*/
  function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;
  }
  