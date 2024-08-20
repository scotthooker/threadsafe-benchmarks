const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const crypto = require('crypto');

let sharedCounter = 0;

function simulateWork() {
    // Simulate CPU-intensive work
    crypto.pbkdf2Sync('password', 'salt', 100000, 64, 'sha512');
}

function incrementCounter() {
    simulateWork();
    sharedCounter++;
    parentPort.postMessage('done');
}

function runBenchmark(numThreads) {
    return new Promise((resolve) => {
        sharedCounter = 0;
        const startTime = process.hrtime.bigint();
        let completedThreads = 0;

        for (let i = 0; i < numThreads; i++) {
            const worker = new Worker(__filename, { workerData: { threadId: i } });
            worker.on('message', () => {
                completedThreads++;
                if (completedThreads === numThreads) {
                    const endTime = process.hrtime.bigint();
                    const duration = Number(endTime - startTime) / 1e9; // Convert to seconds
                    console.log(`Node.js - Threads: ${numThreads}, Time: ${duration.toFixed(4)}s, Counter: ${sharedCounter}`);
                    resolve();
                }
            });
        }
    });
}

if (isMainThread) {
    (async () => {
        for (const numThreads of [10, 100, 1000]) {
            await runBenchmark(numThreads);
        }
    })();
} else {
    incrementCounter();
} 