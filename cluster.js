const cluster = require('cluster');
const os = require('os');
const path = require('path');

const numCPUs = os.cpus().length;
const totalMem = os.totalmem();
const MEM_LIMIT_PERCENT = 0.60;
const MEM_LIMIT = totalMem * MEM_LIMIT_PERCENT;
const MEM_LIMIT_GB = (MEM_LIMIT / (1024 * 1024 * 1024)).toFixed(2);

if (cluster.isMaster) {
  console.log(`🚀 System Information:`);
  console.log(`   CPUs: ${numCPUs}`);
  console.log(`   Total RAM: ${(totalMem / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`   Auto-Kill Limit: ${MEM_LIMIT_GB} GB (60%)`);
  console.log(`🛡️  Master process ${process.pid} is starting workers...`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    if (signal) {
      console.log(`❌ Worker ${worker.process.pid} was killed by signal: ${signal}`);
    } else if (code !== 0) {
      console.log(`❌ Worker ${worker.process.pid} exited with error code: ${code}`);
    } else {
      console.log(`✅ Worker ${worker.process.pid} exited normally`);
    }
    console.log(`🔄 Restarting worker...`);
    cluster.fork();
  });

  // Handle worker messages (memory reports)
  cluster.on('message', (worker, message) => {
    if (message.type === 'memoryUsage') {
      const { rss } = message.data;
      const rssGB = (rss / (1024 * 1024 * 1024)).toFixed(2);
      
      if (rss > MEM_LIMIT) {
        console.warn(`🚨 [CRITICAL] Worker ${worker.process.pid} memory usage (${rssGB} GB) exceeded 60% threshold (${MEM_LIMIT_GB} GB).`);
        console.warn(`💀 Killing worker ${worker.process.pid} to prevent system crash.`);
        worker.kill();
      }
    }
  });

} else {
  console.log(`👷 Worker ${process.pid} started`);

  // Import and run the server
  try {
    require(path.join(__dirname, './server/index.js'));
  } catch (error) {
    console.error(`❌ Worker ${process.pid} failed to load server:`, error.message);
    process.exit(1);
  }

  // Monitor memory usage and report to master
  setInterval(() => {
    const mem = process.memoryUsage();
    process.send({ 
      type: 'memoryUsage', 
      data: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed
      } 
    });
  }, 5000);
}
