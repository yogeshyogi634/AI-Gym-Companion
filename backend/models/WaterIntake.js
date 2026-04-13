import mongoose from 'mongoose';

const waterIntakeSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },  // "2026-04-10"
  glasses: { type: Number, default: 0 },                  // each glass = 250ml
}, { timestamps: true });

export default mongoose.model('WaterIntake', waterIntakeSchema);
