const PROGRESS_KEY = 'fsm-progress';
const THEME_KEY = 'fsm-theme';
const ONBOARD_KEY = 'fsm-onboard-track';

export function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch { return {}; }
}

export function markComplete(day, session) {
  const progress = getProgress();
  const key = `${day}-${session}`;
  progress[key] = Date.now();
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return progress;
}

export function unmarkComplete(day, session) {
  const progress = getProgress();
  delete progress[`${day}-${session}`];
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return progress;
}

export function isComplete(progress, day, session) {
  return !!progress[`${day}-${session}`];
}

export function isDayComplete(progress, day) {
  return isComplete(progress, day, 'morning') && isComplete(progress, day, 'evening');
}

export function getCompletedCount(progress) {
  return Object.keys(progress).length;
}

export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'light';
  } catch { return 'light'; }
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function getOnboardedTrack() {
  try {
    return localStorage.getItem(ONBOARD_KEY) || null;
  } catch { return null; }
}

export function setOnboardedTrack(trackId) {
  localStorage.setItem(ONBOARD_KEY, trackId);
}

export function clearOnboardedTrack() {
  localStorage.removeItem(ONBOARD_KEY);
}
