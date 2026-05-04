import mongoose from "mongoose";

const timerLogSchema = new mongoose.Schema(
  {
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const TimerLog = mongoose.model("TimerLog", timerLogSchema);

export default TimerLog;