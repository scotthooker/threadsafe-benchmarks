import { pbkdf2Sync } from 'crypto';

let sharedCounter = 0;

function simulateWork() {
    // Simulate CPU-intensive work
    pbkdf2Sync('password', 'salt', 100000, 64, 'sha512');
}

function incrementCounter() {
    simulateWork();
    sharedCounter++;
}

async function runBenchmark(numThreads) {
    sharedCounter = 0;
    const startTime = performance.now();

    const promises = Array(numThreads).fill(undefined, undefined, undefined).map(() => {
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

    console.log(`Bun - Threads: ${numThreads}, Time: ${duration.toFixed(4)}s, Counter: ${sharedCounter}`);
}

async function main() {
    for (const numThreads of [10, 100, 1000]) {
        await runBenchmark(numThreads);
    }
}

main();
