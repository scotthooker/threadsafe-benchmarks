// @@filename: server.jsconst express = require('express');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const app = express();
const redis = new Redis(process.env.REDIS_URL);

app.use(express.json());

const HOLD_DURATION = 60; // seconds

function runBenchmark(numOperations) {
  const startTime = process.hrtime.bigint();

  for (let i = 0; i < numOperations; i++) {
    crypto.pbkdf2Sync('password', 'salt', 100000, 64, 'sha512');
  }

  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1e9; // Convert to seconds

  console.log(`Benchmark Results:`);
  console.log(`Operations: ${numOperations}`);
  console.log(`Total Time: ${duration.toFixed(4)}s`);
  console.log(`Operations per Second: ${(numOperations / duration).toFixed(2)}`);
}

// Create an event
app.post('/events', async (req, res) => {
  const { totalSeats } = req.body;
  if (totalSeats < 10 || totalSeats > 1000) {
    return res.status(400).json({ error: 'Total seats must be between 10 and 1000' });
  }

  const eventId = uuidv4();
  const seats = Array.from({ length: totalSeats }, (_, i) => `SEAT:${i}`);

  await redis.sadd(`event:${eventId}:availableSeats`, seats);
  await redis.set(`event:${eventId}:totalSeats`, totalSeats);

  res.json({ eventId, totalSeats });
});

// List available seats
app.get('/events/:eventId/seats', async (req, res) => {
  const { eventId } = req.params;
  const availableSeats = await redis.smembers(`event:${eventId}:availableSeats`);
  res.json({ availableSeats });
});

// Hold a seat
app.post('/events/:eventId/seats/:seatId/hold', async (req, res) => {
  const { eventId, seatId } = req.params;
  const { userId } = req.body;

  const isAvailable = await redis.sismember(`event:${eventId}:availableSeats`, seatId);
  if (!isAvailable) {
    return res.status(400).json({ error: 'Seat is not available' });
  }

  await redis.multi()
      .srem(`event:${eventId}:availableSeats`, seatId)
      .set(`event:${eventId}:seat:${seatId}`, JSON.stringify({ status: 'held', userId }), 'EX', HOLD_DURATION)
      .exec();

  const expiresAt = Date.now() + HOLD_DURATION * 1000;
  res.json({ message: 'Seat held successfully', expiresAt });
});

// Reserve a seat
app.post('/events/:eventId/seats/:seatId/reserve', async (req, res) => {
  const { eventId, seatId } = req.params;
  const { userId } = req.body;

  const seatData = await redis.get(`event:${eventId}:seat:${seatId}`);
  if (!seatData) {
    return res.status(400).json({ error: 'Seat is not held' });
  }

  const { status, userId: holdUserId } = JSON.parse(seatData);
  if (status !== 'held' || holdUserId !== userId) {
    return res.status(400).json({ error: 'Seat is not held by this user' });
  }

  await redis.set(`event:${eventId}:seat:${seatId}`, JSON.stringify({ status: 'reserved', userId }));
  res.json({ message: 'Seat reserved successfully' });
});

// Bonus: Refresh hold
app.post('/events/:eventId/seats/:seatId/refresh-hold', async (req, res) => {
  const { eventId, seatId } = req.params;
  const { userId } = req.body;

  const seatData = await redis.get(`event:${eventId}:seat:${seatId}`);
  if (!seatData) {
    return res.status(400).json({ error: 'Seat is not held' });
  }

  const { status, userId: holdUserId } = JSON.parse(seatData);
  if (status !== 'held' || holdUserId !== userId) {x
    return res.status(400).json({ error: 'Seat is not held by this user' });
  }

  await redis.expire(`event:${eventId}:seat:${seatId}`, HOLD_DURATION);

  const expiresAt = Date.now() + HOLD_DURATION * 1000;
  res.json({ message: 'Hold refreshed', expiresAt });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Run benchmark after server starts
  runBenchmark(10000); // Adjust the number of operations as needed
});
