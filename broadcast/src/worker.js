/** 
Create worker module 
@module worker
**/

const Mediasoup = require('mediasoup');
const config = require('../broadcastconfig');



/** 
Initialized Mediasoup workers
@method
@async
**/
let workers = [];
module.exports.initializeWorkers = async() => {
    console.log('initializaWorkers() [num:%d]', config.numWokers);

    if (workers.length > 0) {
        throw new Error ('worker already initializaed');
    }
    for (let i = 0; i < config.numWorkers; ++i) {
        const worker = await Mediasoup.createWorker(config.worker);
        worker.once('died', () => {
            console.error('worker::died [pid:%d] exiting in 2 seconds...', worker.pid);
            setTimeout(() => process.exit(1), 2000);
          });
      
          workers.push(worker);
    }

};

/**
 * Gets the next Mediasoup worker
 * @returns {Object} Mediasoup worker object
 */
module.exports.getNextWorker = () => {
  const worker = workers[nextWorkerIndex];

  if (++nextWorkerIndex === workers.length) {
    nextWorkerIndex = 0;
  }

  return worker;
};


/** 
close worker and empty the workers array
**/

module.exports.releaseWorkers = () => {
    for (const worker of workers) {
      worker.close();
    }
  
    workers.length = 0;
  };

/**
 * @returns {Number} number of mediasoup workers
 */
module.exports.size = () => workers.length;