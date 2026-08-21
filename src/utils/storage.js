const PROGRESS_KEY = 'fsm-progress';
const THEME_KEY = 'fsm-theme';
const ONBOARD_KEY = 'fsm-onboard-track';

// localStorage can throw (private browsing, quota exceeded, disabled) — every write
// goes through here so a blocked storage backend degrades silently instead of crashing.
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch { return {}; }
}

export function markComplete(day, session) {
  const progress = getProgress();
  const key = `${day}-${session}`;
  progress[key] = Date.now();
  safeSetItem(PROGRESS_KEY, JSON.stringify(progress));
  return progress;
}

export function unmarkComplete(day, session) {
  const progress = getProgress();
  delete progress[`${day}-${session}`];
  safeSetItem(PROGRESS_KEY, JSON.stringify(progress));
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
  safeSetItem(THEME_KEY, theme);
}

export function getOnboardedTrack() {
  try {
    return localStorage.getItem(ONBOARD_KEY) || null;
  } catch { return null; }
}

export function setOnboardedTrack(trackId) {
  safeSetItem(ONBOARD_KEY, trackId);
}

export function clearOnboardedTrack() {
  safeRemoveItem(ONBOARD_KEY);
}
