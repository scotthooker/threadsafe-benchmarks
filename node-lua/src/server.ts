import express from 'express';
import Redis from 'ioredis';
import { holdSeatScript, reserveSeatScript, releaseSeatScript } from './luaScripts';

const app = express();

const redis = new Redis(process.env.REDIS_URL);

app.use(express.json());

app.post('/events/:eventId/seats/:seatId/hold', async function (req, res) {
  const {eventId, seatId} = req.params;
  const {userId} = req.body;

  try {
    const result = await redis.eval(holdSeatScript, 1, eventId, seatId, userId);
    if (result === 'OK') {
      res.json({message: 'Seat held successfully'});
    } else {
      res.status(400).json({error: 'Unable to hold seat'});
    }
  } catch (error) {
    res.status(500).json({error: 'Internal server error'});
  }
});

app.post('/events/:eventId/seats/:seatId/reserve', async (req, res) => {
  const { eventId, seatId } = req.params;
  const { userId } = req.body;

  try {
    const result = await redis.eval(reserveSeatScript, 1, eventId, seatId, userId);
    if (result === 'OK') {
      res.json({ message: 'Seat reserved successfully' });
    } else {
      res.status(400).json({ error: 'Unable to reserve seat' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/events/:eventId/seats/:seatId/release', async function (req, res) {
  const {eventId, seatId} = req.params;

  try {
    const result = await redis.eval(releaseSeatScript, 1, eventId, seatId);
    if (result === 'OK') {
      res.json({message: 'Seat released successfully'});
    } else {
      res.status(400).json({error: 'Unable to release seat'});
    }
  } catch (error) {
    res.status(500).json({error: 'Internal server error'});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Node.js Lua service listening at http://localhost:${port}`);
});

