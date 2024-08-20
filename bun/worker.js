import { pbkdf2Sync } from 'crypto';

const sharedBuffer = new SharedArrayBuffer(4);
const sharedCounter = new Int32Array(sharedBuffer);

function simulateWork() {
    pbkdf2Sync('password', 'salt', 100000, 64, 'sha512');
}

function incrementCounter() {
    simulateWork();
    Atomics.add(sharedCounter, 0, 1);
}

async function runBenchmark(numThreads) {
    sharedCounter.fill(0);
    const startTime = performance.now();

    const promises = Array(numThreads).fill().map(() => {
        return new Promise((resolve) => {
            Bun.spawn({
                cmd: ['bun', 'run', '--silent', 'worker.js'],
                onExit: () => resolve()
            });
        });
    });

    await Promise.all(promises);

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds

    console.log(`Bun - Threads: ${numThreads}, Time: ${duration.toFixed(4)}s, Counter: ${sharedCounter[0]}`);
}

async function main() {
    for (const numThreads of [10, 100, 1000]) {
        await runBenchmark(numThreads);
    }
}

main();