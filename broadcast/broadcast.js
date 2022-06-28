const  {networkInterfaces} = require('os');
const mediasoup = require('mediasoup');
const ip = getIp();
console.log(ip);


let worker, router;

// let producer, producerTransport, producerSocketId;
// const consumerTransports = {};
// const consumers = {};

const gatherings = {};

exports.setupBroadcast = async function () {
  const { mediaCodecs } = mediasoupOptions.router;
  worker = await mediasoup.createWorker();
  router = await worker.createRouter({ mediaCodecs });
  console.log('-- mediasoup worker start. --');
};

exports.broadcast = function (io) {
  io.on('connection', (socket) => {
    const { gatheringId } = socket.handshake.query;
    socket.join(gatheringId);
    console.log(
      `client connected. socket id=${socket.id}  , total clients=${io.eio.clientsCount}`
    );

    socket.on('disconnect', () => {
      console.log(
        `client disconnected. socket id=${socket.id}, total clients=${io.eio.clientsCount}`
      );
      cleanUp(socket, gatheringId);
    });
    
    socket.on('getRouterRtpCapabilities', (data, callback) => {
      console.log('getRouterRtpCapabilities');
      if (router) {
        sendResponse(router.rtpCapabilities, callback);
      } else {
        sendReject({ error: 'router not ready' }, callback);
      }
    });

    socket.on('createProducerTransport', async (data, callback) => {
      console.log('createProducerTransport');
      const { transport, params } = await createTransport();
      gatherings[gatheringId] = {
        producerTransport: transport,
        producerSocketId: socket.id,
      };
      sendResponse(params, callback);

      gatherings[gatheringId].producerTransport.observer.on('close', () => {
        if (gatherings[gatheringId].producer) {
          gatherings[gatheringId].producer.close();
          gatherings[gatheringId].producer = null;
        }
        gatherings[gatheringId].producerTransport = null;
        gatherings[gatheringId].producerSocketId = null;
      });
    });

    socket.on('connectProducerTransport', async (data, callback) => {
      console.log('connectProducerTransport');
      if (gatherings[gatheringId].producerTransport) {
        await gatherings[gatheringId].producerTransport.connect(data);
      } else {
        console.error(`producer not ready for socket: ${socket.id}`);
      }
      sendResponse({}, callback);
    });

    socket.on('createConsumerTransport', async (data, callback) => {
      console.log('createConsumerTransport');
      const { transport, params } = await createTransport();
      gatherings[gatheringId].consumerTransports[socket.id] = transport;
      sendResponse(params, callback);

      gatherings[gatheringId].consumerTransports[socket.id].observer.on(
        'close',
        () => {
          if (gatherings[gatheringId].consumers[socket.id]) {
            gatherings[gatheringId].consumers[socket.id].close();
            delete gatherings[gatheringId].consumers[socket.id];
          }
          delete gatherings[gatheringId].consumerTransports[socket.id];
        }
      );
    });

    socket.on('connectConsumerTransport', async (data, callback) => {
      console.log('connectConsumerTransport');
      const socketId = socket.id;
      const consumerTransport =
        gatherings[gatheringId].consumerTransports[socketId];
      if (consumerTransport) {
        await consumerTransport.connect(data);
      } else {
        console.error(`producer not ready for socket: ${socketId}`);
      }
      sendResponse({}, callback);

      gatherings[gatheringId].consumerTransports[socketId].observer.on(
        'close',
        () => {
          if (gatherings[gatheringId].consumers[socketId]) {
            gatherings[gatheringId].consumers[socketId].close();
            delete gatherings[gatheringId].consumers[socketId];
          }
          delete gatherings[gatheringId].consumerTransports[socketId];
        }
      );
    });

    socket.on('produce', async (data, callback) => {
      console.log('produce');
      if (gatherings[gatheringId].producerTransport) {
        gatherings[gatheringId].producer = await gatherings[
          gatheringId
        ].producerTransport.produce({
          kind: data.kind,
          rtpParameters: data.rtpParameters,
        });
        sendResponse({ id: gatherings[gatheringId].producer.id }, callback);
        socket.broadcast.emit('newProducer');
      }
    });

    socket.on('createConsumer', async (data, callback) => {
      console.log('createConsumer');
      if (!gatherings[gatheringId].producer) {
        return sendReject({ error: 'Producer is not ready yet' }, callback);
      }
      const { rtpCapabilities } = data;
      const producerId = gatherings[gatheringId].producer.id;
      if (router.canConsume({ producerId, rtpCapabilities })) {
        const consumer = await gatherings[gatheringId].consumerTransports[
          socket.id
        ].consume({
          producerId,
          rtpCapabilities,
          // paused: true,
        });
        gatherings[gatheringId].consumers[socket.id] = consumer;
        sendResponse(
          {
            id: consumer.id,
            producerId: consumer.producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
          },
          callback
        );
        gatherings[gatheringId].consumers[socket.id].on('producerclose', () => {
          gatherings[gatheringId].consumers[socket.id].close();
          delete gatherings[gatheringId].consumers[socket.id];
          socket.emit('producerClosed');
        });
      }
    });
  });
};

function getIp() {
  const nets = networkInterfaces();
  const results = Object.create(null); // or just '{}', an empty object
  let key;

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }

        results[name].push(net.address);
        key = name;
      }
    }
  }

  return results[key][0];
}

function cleanUp(socket) {
  const socketId = socket.id;
  const { gatheringId } = socket.handshake.query;
  const gathering = gatherings[gatheringId];
  const consumerTransport = gathering.consumerTransports[socketId];
  const consumer = gathering.consumers[socketId];

  if (consumer) {
    consumer.close();
    delete gathering.consumers[socketId];
  }

  if (consumerTransport) {
    consumerTransport.close();
    delete consumerTransport[socketId];
  }

  if (gathering.producerSocketId === socketId) {
    if (gathering.producer) {
      gathering.producer.close();
      gathering.producer = null;
    }
    if (gathering.producerTransport) {
      gathering.producerTransport.close();
      gathering.producerTransport = null;
    }
    gathering.producerSocketId = null;
  }
}

async function createTransport() {
  const transport = await router.createWebRtcTransport(
    mediasoupOptions.webRtcTransport
  );
  const {
    id,
    iceCandidates,
    iceParameters,
    dtlsParameters,
    sctpParameters,
  } = transport;
  return {
    transport,
    params: {
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
      sctpParameters,
    },
  };
}

function sendResponse(response, callback) {
  callback(response);
}

function sendReject(err, callback) {
  callback(err);
}
