// Android (Java) track content loader. Single full-day session per day (7 days total, ~8 hrs/day).
const androidContent = import.meta.glob('./content/android/day-*.md', { eager: true, query: '?raw', import: 'default' });

export function getAndroidContent(day) {
  const padded = String(day).padStart(3, '0');
  const key = `./content/android/day-${padded}.md`;
  return androidContent[key] || `# Day ${day} — Coming Soon\n\nIs din ka detailed content jaldi aane wala hai. Roadmap me topics already define hain — content writing in progress.`;
}

export function hasAndroidContent(day) {
  const padded = String(day).padStart(3, '0');
  return `./content/android/day-${padded}.md` in androidContent;
}

export const androidDays = [
  { day: 1, phase: 'android-day-1', title: 'Java + OOPs Foundations' },
  { day: 2, phase: 'android-day-2', title: 'Android Core + UI' },
  { day: 3, phase: 'android-day-3', title: 'RecyclerView + Fragment' },
  { day: 4, phase: 'android-day-4', title: 'HTTP + Retrofit + OkHttp' },
  { day: 5, phase: 'android-day-5', title: 'JWT + Local Database' },
  { day: 6, phase: 'android-day-6', title: 'Smart Meter + Offline/Online Sync' },
  { day: 7, phase: 'android-day-7', title: 'Architecture + Final Interview' },
  { day: 8, phase: 'android-day-8', title: 'BONUS — Capstone Build Guide (Scratch to Finish)' },
  { day: 9, phase: 'android-day-9', title: 'BONUS — PHP + MySQL Backend API' },
];

export function getAndroidDay(dayNum) {
  return androidDays.find(d => d.day === dayNum);
}
