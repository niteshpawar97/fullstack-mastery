// Flutter track content loader. Single session per day (2 hrs/day = 1 hr concept + 1 hr practice in same file).
// Auto-discovers all markdown files under content/flutter/day-*.md
const flutterContent = import.meta.glob('./content/flutter/day-*.md', { eager: true, query: '?raw', import: 'default' });

export function getFlutterContent(day) {
  const padded = String(day).padStart(3, '0');
  const key = `./content/flutter/day-${padded}.md`;
  return flutterContent[key] || `# Day ${day} — Coming Soon\n\nIs din ka detailed content jaldi aane wala hai. Roadmap me topic already define hai — content writing in progress.`;
}

// Single session per day — 2 hours total (1 hr concept + 1 hr practice in one flow).
export const flutterDays = [
  // Phase 1: Basic — Dart + Flutter Setup (Day 1-10)
  { day: 1, phase: 'flutter-phase-1', title: 'Dart Variables, Types & Print' },
  { day: 2, phase: 'flutter-phase-1', title: 'Operators, Conditions & Loops' },
  { day: 3, phase: 'flutter-phase-1', title: 'Functions, Closures & Arrow Syntax' },
  { day: 4, phase: 'flutter-phase-1', title: 'OOP — Classes, Inheritance & Mixins' },
  { day: 5, phase: 'flutter-phase-1', title: 'Null Safety, Collections, Generics & Async' },
  { day: 6, phase: 'flutter-phase-1', title: 'Flutter SDK Setup, First App & Hot Reload' },
  { day: 7, phase: 'flutter-phase-1', title: 'StatelessWidget, MaterialApp & Scaffold' },
  { day: 8, phase: 'flutter-phase-1', title: 'Layouts — Row, Column, Container, Padding' },
  { day: 9, phase: 'flutter-phase-1', title: 'ListView, GridView, Images & Icons' },
  { day: 10, phase: 'flutter-phase-1', title: 'Mini Project — Profile Card / Calculator' },

  // Phase 2: Mid — State + Navigation + APIs (Day 11-20)
  { day: 11, phase: 'flutter-phase-2', title: 'StatefulWidget, setState & Lifecycle' },
  { day: 12, phase: 'flutter-phase-2', title: 'Forms, TextFields & Validation' },
  { day: 13, phase: 'flutter-phase-2', title: 'Buttons, Themes & Custom Styling' },
  { day: 14, phase: 'flutter-phase-2', title: 'Navigation, Named Routes & Pass Data' },
  { day: 15, phase: 'flutter-phase-2', title: 'Provider — State Management Basics' },
  { day: 16, phase: 'flutter-phase-2', title: 'HTTP Package + REST API Calls' },
  { day: 17, phase: 'flutter-phase-2', title: 'JSON Parsing, Models & fromJson/toJson' },
  { day: 18, phase: 'flutter-phase-2', title: 'SharedPreferences (Local Key-Value Storage)' },
  { day: 19, phase: 'flutter-phase-2', title: 'Animations Basics — AnimatedContainer & Hero' },
  { day: 20, phase: 'flutter-phase-2', title: 'Mini Project — Weather/Todo App with API' },

  // Phase 3: Advanced — Firebase + Production (Day 21-30)
  { day: 21, phase: 'flutter-phase-3', title: 'Riverpod Deep Dive — Modern State Management' },
  { day: 22, phase: 'flutter-phase-3', title: 'Firebase Setup + Authentication' },
  { day: 23, phase: 'flutter-phase-3', title: 'Cloud Firestore — CRUD + Real-time Streams' },
  { day: 24, phase: 'flutter-phase-3', title: 'Firebase Storage + Native Plugins (Camera, Location)' },
  { day: 25, phase: 'flutter-phase-3', title: 'Push Notifications (FCM) + Local Notifications' },
  { day: 26, phase: 'flutter-phase-3', title: 'Capstone Day 1 — Setup, Models, Auth Flow' },
  { day: 27, phase: 'flutter-phase-3', title: 'Capstone Day 2 — UI Build (Lists, Cart, Forms)' },
  { day: 28, phase: 'flutter-phase-3', title: 'Capstone Day 3 — Firestore + FCM Integration' },
  { day: 29, phase: 'flutter-phase-3', title: 'Capstone Day 4 — Animations, Testing & Polish' },
  { day: 30, phase: 'flutter-phase-3', title: 'Capstone Day 5 — Sign APK + Play Store Deploy' },

  // Phase 4: BONUS — Senior Pro Level (Day 31-50)
  { day: 31, phase: 'flutter-phase-4', title: 'Bloc Pattern — Cubit Basics' },
  { day: 32, phase: 'flutter-phase-4', title: 'Bloc — Events, States & BlocBuilder' },
  { day: 33, phase: 'flutter-phase-4', title: 'BlocProvider, BlocListener & MultiBlocProvider' },
  { day: 34, phase: 'flutter-phase-4', title: 'Clean Architecture — Domain/Data/Presentation' },
  { day: 35, phase: 'flutter-phase-4', title: 'Repository Pattern + DI (get_it)' },
  { day: 36, phase: 'flutter-phase-4', title: 'Custom Painter — Charts & Custom Shapes' },
  { day: 37, phase: 'flutter-phase-4', title: 'Advanced Animations — Tween, Curves, AnimatedBuilder' },
  { day: 38, phase: 'flutter-phase-4', title: 'Method Channels — Calling Native Kotlin/Swift' },
  { day: 39, phase: 'flutter-phase-4', title: 'Custom Plugin Development' },
  { day: 40, phase: 'flutter-phase-4', title: 'Background Services + WorkManager' },
  { day: 41, phase: 'flutter-phase-4', title: 'Isolates — Heavy Computation Off UI Thread' },
  { day: 42, phase: 'flutter-phase-4', title: 'Flutter Web — Responsive + Vercel Deploy' },
  { day: 43, phase: 'flutter-phase-4', title: 'Flutter Desktop (Windows/macOS/Linux)' },
  { day: 44, phase: 'flutter-phase-4', title: 'Internationalization (i18n) + Accessibility (a11y)' },
  { day: 45, phase: 'flutter-phase-4', title: 'Testing Pro — Golden Tests & Mocktail' },
  { day: 46, phase: 'flutter-phase-4', title: 'CI/CD with Codemagic / GitHub Actions' },
  { day: 47, phase: 'flutter-phase-4', title: 'iOS App Store Deploy + TestFlight' },
  { day: 48, phase: 'flutter-phase-4', title: 'Pro Capstone Day 1 — Multi-platform Setup' },
  { day: 49, phase: 'flutter-phase-4', title: 'Pro Capstone Day 2 — Bloc + Clean Architecture' },
  { day: 50, phase: 'flutter-phase-4', title: 'Pro Capstone Day 3 — Web + iOS + Play Store Deploy' },
];

export function getFlutterDay(dayNum) {
  return flutterDays.find(d => d.day === dayNum);
}
