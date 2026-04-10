import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
  date: { type: String, required: true },       // "2026-04-10"
  slot: { type: String, required: true },        // "morning" | "afternoon" | "night" | "postworkout"
  text: { type: String, required: true },
  macros: {
    calories: { type: Number, default: 0 },
    protein:  { type: Number, default: 0 },
    carbs:    { type: Number, default: 0 },
    fat:      { type: Number, default: 0 },
    fiber:    { type: Number, default: 0 },
  },
  items: [
    {
      name:    String,
      qty:     String,
      cal:     Number,
      protein: Number,
      carbs:   Number,
      fat:     Number,
    }
  ],
}, { timestamps: true });

mealSchema.index({ date: 1, slot: 1 }, { unique: true });

export default mongoose.model('Meal', mealSchema);
