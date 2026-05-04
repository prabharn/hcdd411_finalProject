import TimerLog from "../models/TimerLog.js";

function startOfDay() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

function startOfWeek() {
  const date = new Date();
  const day = date.getDay();

  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);

  return date;
}

function startOfMonth() {
  const date = new Date();

  date.setDate(1);
  date.setHours(0, 0, 0, 0);

  return date;
}

async function totalMinutesSince(date) {
  const result = await TimerLog.aggregate([
    {
      $match: {
        completedAt: {
          $gte: date
        }
      }
    },
    {
      $group: {
        _id: null,
        totalMinutes: {
          $sum: "$duration"
        }
      }
    }
  ]);

  return result[0]?.totalMinutes || 0;
}

export async function createTimerLog(req, res) {
  const duration = Number(req.body.duration);

  if (!duration || duration < 1) {
    return res.status(400).json({
      error: "Duration must be a positive number"
    });
  }

  const log = await TimerLog.create({
    duration
  });

  res.json({
    message: "Session logged",
    log
  });
}

export async function getDayStats(req, res) {
  const totalMinutes = await totalMinutesSince(startOfDay());

  res.json({
    totalMinutes
  });
}

export async function getWeekStats(req, res) {
  const totalMinutes = await totalMinutesSince(startOfWeek());

  res.json({
    totalMinutes
  });
}

export async function getMonthStats(req, res) {
  const totalMinutes = await totalMinutesSince(startOfMonth());

  res.json({
    totalMinutes
  });
}

export async function updateTimerLog(req, res) {
  const duration = Number(req.body.duration);

  if (!duration || duration < 1) {
    return res.status(400).json({
      error: "Duration must be a positive number"
    });
  }

  const log = await TimerLog.findByIdAndUpdate(
    req.params.id,
    {
      duration
    },
    {
      new: true
    }
  );

  if (!log) {
    return res.status(404).json({
      error: "Timer log not found"
    });
  }

  res.json(log);
}

export async function deleteTimerLog(req, res) {
  const log = await TimerLog.findByIdAndDelete(req.params.id);

  if (!log) {
    return res.status(404).json({
      error: "Timer log not found"
    });
  }

  res.json({
    message: "Timer log deleted"
  });
}