import mongoose from 'mongoose';

const userGoalsSchema = new mongoose.Schema({
  userId: { type: String, default: 'default', unique: true },
  calories: { type: Number, default: 2500 },
  protein: { type: Number, default: 150 },
  carbs: { type: Number, default: 300 },
  fat: { type: Number, default: 80 },
  fiber: { type: Number, default: 35 },
  waterGlasses: { type: Number, default: 16 },  // daily water goal in glasses (250ml each = 4L)
}, { timestamps: true });

export default mongoose.model('UserGoals', userGoalsSchema);
