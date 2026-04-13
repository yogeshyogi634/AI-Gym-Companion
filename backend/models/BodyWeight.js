import mongoose from 'mongoose';

const bodyWeightSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },  // "2026-04-10"
  weight: { type: Number, required: true },               // in kg
  unit: { type: String, default: 'kg' },
}, { timestamps: true });

export default mongoose.model('BodyWeight', bodyWeightSchema);
