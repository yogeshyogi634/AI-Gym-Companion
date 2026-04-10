// Push / Pull / Legs split — Mon-Sat, Sunday rest
// Schedule: Mon=Push, Tue=Pull, Wed=Legs, Thu=Push, Fri=Pull, Sat=Legs, Sun=Rest

const push = [
  { name: "Flat Barbell Bench Press", detail: "4 sets × 8-10 reps · 90s rest", muscle: "Chest" },
  { name: "Incline Dumbbell Press", detail: "3 sets × 10-12 reps · 75s rest", muscle: "Upper Chest" },
  { name: "Overhead Press", detail: "4 sets × 8-10 reps · 90s rest", muscle: "Shoulders" },
  { name: "Dumbbell Lateral Raises", detail: "3 sets × 12-15 reps · 60s rest", muscle: "Side Delts" },
  { name: "Cable Flyes", detail: "3 sets × 12-15 reps · 60s rest", muscle: "Chest" },
  { name: "Tricep Rope Pushdowns", detail: "3 sets × 12-15 reps · 60s rest", muscle: "Triceps" },
  { name: "Overhead Tricep Extension", detail: "3 sets × 10-12 reps · 60s rest", muscle: "Triceps" },
];

const pull = [
  { name: "Barbell Deadlift", detail: "4 sets × 6-8 reps · 120s rest", muscle: "Back" },
  { name: "Weighted Pull-Ups", detail: "4 sets × 8-10 reps · 90s rest", muscle: "Lats" },
  { name: "Barbell Rows", detail: "4 sets × 8-10 reps · 90s rest", muscle: "Back" },
  { name: "Seated Cable Rows", detail: "3 sets × 10-12 reps · 75s rest", muscle: "Mid Back" },
  { name: "Face Pulls", detail: "3 sets × 15-20 reps · 60s rest", muscle: "Rear Delts" },
  { name: "Barbell Curls", detail: "3 sets × 10-12 reps · 60s rest", muscle: "Biceps" },
  { name: "Hammer Curls", detail: "3 sets × 10-12 reps · 60s rest", muscle: "Biceps" },
];

const legs = [
  { name: "Barbell Back Squat", detail: "4 sets × 8-10 reps · 120s rest", muscle: "Quads" },
  { name: "Romanian Deadlift", detail: "4 sets × 8-10 reps · 90s rest", muscle: "Hamstrings" },
  { name: "Leg Press", detail: "3 sets × 10-12 reps · 90s rest", muscle: "Quads" },
  { name: "Walking Lunges", detail: "3 sets × 12 each leg · 75s rest", muscle: "Quads/Glutes" },
  { name: "Leg Curl Machine", detail: "3 sets × 12-15 reps · 60s rest", muscle: "Hamstrings" },
  { name: "Calf Raises", detail: "4 sets × 15-20 reps · 60s rest", muscle: "Calves" },
  { name: "Leg Extensions", detail: "3 sets × 12-15 reps · 60s rest", muscle: "Quads" },
];

const push2 = [
  { name: "Dumbbell Flat Bench Press", detail: "4 sets × 10-12 reps · 90s rest", muscle: "Chest" },
  { name: "Incline Barbell Press", detail: "3 sets × 8-10 reps · 90s rest", muscle: "Upper Chest" },
  { name: "Seated Dumbbell Shoulder Press", detail: "4 sets × 10-12 reps · 75s rest", muscle: "Shoulders" },
  { name: "Cable Lateral Raises", detail: "3 sets × 12-15 reps · 60s rest", muscle: "Side Delts" },
  { name: "Pec Deck Machine", detail: "3 sets × 12-15 reps · 60s rest", muscle: "Chest" },
  { name: "Skull Crushers", detail: "3 sets × 10-12 reps · 60s rest", muscle: "Triceps" },
  { name: "Diamond Push-Ups", detail: "2 sets × to failure · 60s rest", muscle: "Triceps" },
];

const pull2 = [
  { name: "Rack Pulls", detail: "4 sets × 6-8 reps · 120s rest", muscle: "Back" },
  { name: "Lat Pulldown", detail: "4 sets × 10-12 reps · 75s rest", muscle: "Lats" },
  { name: "Dumbbell Rows", detail: "4 sets × 10-12 each arm · 75s rest", muscle: "Back" },
  { name: "T-Bar Rows", detail: "3 sets × 8-10 reps · 90s rest", muscle: "Mid Back" },
  { name: "Reverse Pec Deck", detail: "3 sets × 12-15 reps · 60s rest", muscle: "Rear Delts" },
  { name: "Incline Dumbbell Curls", detail: "3 sets × 10-12 reps · 60s rest", muscle: "Biceps" },
  { name: "Cable Curls", detail: "3 sets × 12-15 reps · 60s rest", muscle: "Biceps" },
];

const legs2 = [
  { name: "Front Squat", detail: "4 sets × 8-10 reps · 120s rest", muscle: "Quads" },
  { name: "Stiff-Leg Deadlift", detail: "4 sets × 10-12 reps · 90s rest", muscle: "Hamstrings" },
  { name: "Hack Squat", detail: "3 sets × 10-12 reps · 90s rest", muscle: "Quads" },
  { name: "Bulgarian Split Squat", detail: "3 sets × 10 each leg · 75s rest", muscle: "Quads/Glutes" },
  { name: "Seated Leg Curl", detail: "3 sets × 12-15 reps · 60s rest", muscle: "Hamstrings" },
  { name: "Seated Calf Raises", detail: "4 sets × 15-20 reps · 60s rest", muscle: "Calves" },
  { name: "Hip Thrusts", detail: "3 sets × 10-12 reps · 75s rest", muscle: "Glutes" },
];

// Mon(0)=Push, Tue(1)=Pull, Wed(2)=Legs, Thu(3)=Push2, Fri(4)=Pull2, Sat(5)=Legs2, Sun(6)=Rest
const schedule = [
  { type: "Push", label: "Push Day", exercises: push },
  { type: "Pull", label: "Pull Day", exercises: pull },
  { type: "Legs", label: "Leg Day", exercises: legs },
  { type: "Push", label: "Push Day (B)", exercises: push2 },
  { type: "Pull", label: "Pull Day (B)", exercises: pull2 },
  { type: "Legs", label: "Leg Day (B)", exercises: legs2 },
  { type: "Rest", label: "Rest Day", exercises: [] },
];

export function getWorkoutForDate(date) {
  const day = date.getDay(); // 0=Sun ... 6=Sat
  // Map: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  const idx = day === 0 ? 6 : day - 1;
  const s = schedule[idx];
  return {
    ...s,
    exercises: s.exercises.map(e => ({ ...e, done: false })),
  };
}
