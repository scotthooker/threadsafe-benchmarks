export const holdSeatScript = `
local eventId = KEYS[1]
local seatId = ARGV[1]
local userId = ARGV[2]

local seatKey = "event:" .. eventId .. ":seat:" .. seatId
local seatStatus = redis.call("GET", seatKey)

if seatStatus == false or seatStatus == "available" then
  redis.call("SET", seatKey, "held:" .. userId, "EX", 60)
  return "OK"
else
  return "FAIL"
end
`;

export const reserveSeatScript = `
local eventId = KEYS[1]
local seatId = ARGV[1]
local userId = ARGV[2]

local seatKey = "event:" .. eventId .. ":seat:" .. seatId
local seatStatus = redis.call("GET", seatKey)

if seatStatus == "held:" .. userId then
  redis.call("SET", seatKey, "reserved:" .. userId)
  return "OK"
else
  return "FAIL"
end
`;

export const releaseSeatScript = `
local eventId = KEYS[1]
local seatId = ARGV[1]

local seatKey = "event:" .. eventId .. ":seat:" .. seatId
local seatStatus = redis.call("GET", seatKey)

if seatStatus ~= false and seatStatus ~= "available" then
  redis.call("SET", seatKey, "available")
  return "OK"
else
  return "FAIL"
end
`;
