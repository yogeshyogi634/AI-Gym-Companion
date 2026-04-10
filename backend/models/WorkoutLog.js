import mongoose from 'mongoose';

const workoutLogSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },  // "2026-04-10"
  done: { type: Map, of: Boolean, default: {} },          // { "0": true, "2": true, ... }
}, { timestamps: true });

export default mongoose.model('WorkoutLog', workoutLogSchema);
