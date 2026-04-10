export const fmtKey = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const fmtNice = d => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export const fmtMonth = d => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

export const same = (a, b) => fmtKey(a) === fmtKey(b);

export const calDays = (year, month) => {
  const days = [];
  const first = new Date(year, month, 1);
  const pad = first.getDay();
  for (let i = pad - 1; i >= 0; i--) days.push({ d: new Date(year, month, -i), out: true });
  const last = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= last; i++) days.push({ d: new Date(year, month, i), out: false });
  while (days.length < 42) days.push({ d: new Date(year, month + 1, days.length - pad - last + 1), out: true });
  return days;
};
