// Available learning tracks. Full Stack is the active program (lives in course.js).
// Other tracks are previewed here as syllabus/roadmap until full content is built.

export const tracks = [
  {
    id: 'fullstack',
    title: 'Full Stack Mastery',
    titleHi: 'फुल स्टैक मास्टरी',
    icon: '🚀',
    color: '#6366f1',
    status: 'active', // active = currently learning, available = full roadmap, soon = coming soon
    tagline: {
      en: 'Backend-Focused Full Stack — Node.js, Express, MongoDB, React, Docker, AWS',
      hi: 'बैकेंड-फोकस्ड फुल स्टैक — Node.js, Express, MongoDB, React, Docker, AWS'
    },
    duration: { days: 120, hours: 480 },
    sessions: 240,
    topics: 34,
    audience: {
      en: 'Zero-to-job-ready backend developer in 90-120 days',
      hi: '90-120 दिन में zero से job-ready backend developer'
    }
  },
  {
    id: 'flutter',
    title: 'Flutter with Dart',
    titleHi: 'फ्लटर विद डार्ट',
    icon: '💙',
    color: '#02569B',
    status: 'available',
    tagline: {
      en: '30-Day fast-track + 20-Day Bonus — only 2 hrs/day. Dart, Flutter, Firebase, Play Store + iOS deploy',
      hi: '30-दिन फास्ट-ट्रैक + 20-दिन Bonus — सिर्फ 2 घंटे/दिन। Dart, Flutter, Firebase, Play Store + iOS deploy'
    },
    duration: { days: 50, hours: 100, hoursPerDay: 2 },
    sessions: 50,
    topics: 32,
    audience: {
      en: 'Become a Flutter developer in 30 days at 2 hrs/day — perfect for working professionals or alongside the Full Stack track',
      hi: '30 दिन में Flutter developer बनो सिर्फ 2 घंटे/दिन में — working professionals या Full Stack ke साथ parallel चलाने के लिए perfect'
    },
    phases: [
      {
        id: 'flutter-phase-1',
        title: 'Phase 1: Basic — Dart + Flutter Setup',
        titleHi: 'फेज 1: Basic — Dart + Flutter Setup',
        icon: '🌱',
        color: '#4FC3F7',
        dayRange: [1, 10],
        description: {
          en: 'Dart language fundamentals, OOP, async basics, then Flutter SDK setup with first widgets and layouts. By Day 10 you build your first mini-app.',
          hi: 'Dart language की नींव, OOP, async basics, फिर Flutter SDK setup के साथ पहले widgets और layouts। Day 10 पे तुम्हारा पहला mini-app।'
        },
        topics: [
          'Day 1: Dart Variables, Types, Print',
          'Day 2: Operators, Conditions, Loops',
          'Day 3: Functions, Closures, Arrow Syntax',
          'Day 4: OOP — Classes, Inheritance, Mixins',
          'Day 5: Null Safety, Collections, Generics, Async/Future Intro',
          'Day 6: Flutter SDK Setup, First App, Hot Reload',
          'Day 7: StatelessWidget, MaterialApp, Scaffold',
          'Day 8: Layouts — Row, Column, Container, Padding',
          'Day 9: ListView, GridView, Images, Icons',
          'Day 10: Mini Project — Profile Card / Calculator App'
        ]
      },
      {
        id: 'flutter-phase-2',
        title: 'Phase 2: Mid — State + Navigation + APIs',
        titleHi: 'फेज 2: Mid — State + Navigation + APIs',
        icon: '⚙️',
        color: '#1E88E5',
        dayRange: [11, 20],
        description: {
          en: 'StatefulWidget, forms, navigation, Provider state management, REST API integration, local storage. Real apps that talk to the internet.',
          hi: 'StatefulWidget, forms, navigation, Provider state management, REST API integration, local storage। असली apps जो internet से बात करते हैं।'
        },
        topics: [
          'Day 11: StatefulWidget, setState, Lifecycle',
          'Day 12: Forms, TextFields, Validation',
          'Day 13: Buttons, Themes, Custom Styling',
          'Day 14: Navigation, Named Routes, Pass Data',
          'Day 15: Provider — State Management Basics',
          'Day 16: HTTP Package + REST API Calls',
          'Day 17: JSON Parsing, Models, fromJson/toJson',
          'Day 18: SharedPreferences (Local Key-Value Storage)',
          'Day 19: Animations Basics — AnimatedContainer, Hero',
          'Day 20: Mini Project — Weather App / Todo App with API'
        ]
      },
      {
        id: 'flutter-phase-3',
        title: 'Phase 3: Advanced — Firebase + Production',
        titleHi: 'फेज 3: Advanced — Firebase + Production',
        icon: '🚀',
        color: '#0D47A1',
        dayRange: [21, 30],
        description: {
          en: 'Riverpod, Firebase (Auth + Firestore + Storage + FCM), native plugins in 5 days — then 5-day Capstone (Day 26-30) building Food Ordering App and deploying to Play Store.',
          hi: 'Riverpod, Firebase (Auth + Firestore + Storage + FCM), native plugins 5 दिन में — फिर 5-day Capstone (Day 26-30) Food Ordering App बनाना और Play Store पे deploy करना।'
        },
        topics: [
          'Day 21: Riverpod Deep Dive — Modern State Management',
          'Day 22: Firebase Setup + Authentication (Email + Google)',
          'Day 23: Cloud Firestore — CRUD + Real-time Streams',
          'Day 24: Firebase Storage + Native Plugins (camera, location)',
          'Day 25: Push Notifications (FCM) + Local Notifications',
          'Day 26: Capstone Day 1 — Project Setup, Models, Auth Flow',
          'Day 27: Capstone Day 2 — UI Build (Lists, Details, Cart/Form)',
          'Day 28: Capstone Day 3 — Backend Integration (Firestore + FCM)',
          'Day 29: Capstone Day 4 — Animations, Testing Essentials, Polish',
          'Day 30: Capstone Day 5 — Sign APK + Play Store Deploy'
        ]
      },
      {
        id: 'flutter-phase-4',
        title: 'Phase 4: BONUS — Senior Pro Level',
        titleHi: 'फेज 4: BONUS — Senior Pro लेवल',
        icon: '💎',
        color: '#7C3AED',
        dayRange: [31, 50],
        isOptional: true,
        description: {
          en: 'Senior-level architecture and skills — Bloc, Clean Architecture, native interop, Flutter Web + Desktop, CI/CD, iOS App Store. After this you compete with 2-3 year Flutter devs.',
          hi: 'Senior-level architecture और skills — Bloc, Clean Architecture, native interop, Flutter Web + Desktop, CI/CD, iOS App Store. इसके बाद 2-3 साल वाले Flutter devs से compete कर सकते हो।'
        },
        topics: [
          'Day 31: Bloc Pattern — Cubit Basics',
          'Day 32: Bloc — Events, States, BlocBuilder',
          'Day 33: BlocProvider, BlocListener, MultiBlocProvider',
          'Day 34: Clean Architecture — Domain/Data/Presentation Layers',
          'Day 35: Repository Pattern + Dependency Injection (get_it)',
          'Day 36: Custom Painter — Charts, Custom Shapes',
          'Day 37: Advanced Animations — Tween, Curves, Implicit/Explicit',
          'Day 38: Method Channels — Calling Native Kotlin/Swift Code',
          'Day 39: Custom Plugin Development',
          'Day 40: Background Services + WorkManager',
          'Day 41: Isolates — Heavy Computation Off UI Thread',
          'Day 42: Flutter Web — Responsive Layout + Deploy to Vercel',
          'Day 43: Flutter Desktop (Windows/macOS/Linux)',
          'Day 44: Internationalization (i18n) + Accessibility (a11y)',
          'Day 45: Testing Pro — Golden Tests, Mocktail, Integration',
          'Day 46: CI/CD with Codemagic / GitHub Actions',
          'Day 47: iOS App Store Deploy + TestFlight',
          'Day 48: Pro Capstone Day 1 — Multi-platform App Setup (Mobile + Web)',
          'Day 49: Pro Capstone Day 2 — Bloc + Clean Architecture Implementation',
          'Day 50: Pro Capstone Day 3 — Web Deploy + iOS TestFlight + Play Store'
        ]
      }
    ],
    projects: [
      {
        icon: '💸',
        title: 'Expense Tracker (UI + Logic)',
        phase: 'Phase 1 — Basic (Day 10)',
        desc: 'Categorized expense list with date filters, summary cards, custom theme. Sikhoge: Dart models, ListView.builder, custom reusable widgets, MediaQuery, theme switching — pure UI/logic without backend.'
      },
      {
        icon: '📰',
        title: 'News Reader Pro',
        phase: 'Phase 2 — Mid (Day 15-17)',
        desc: 'Real NewsAPI integration with category filters, search, bookmarks, pull-to-refresh, share intent. Sikhoge: HTTP package, async error handling, Provider state, JSON model classes, infinite scroll pagination, deep links.'
      },
      {
        icon: '🎬',
        title: 'Movie Discovery App',
        phase: 'Phase 2 — Mid (Day 20)',
        desc: 'TMDB API se trending movies, hero animations, watchlist persistence (SharedPreferences), trailer embed, genre filters. Sikhoge: hero transitions, image caching (cached_network_image), API key security, offline-first reads.'
      },
      {
        icon: '📝',
        title: 'Notes App — Cloud Sync',
        phase: 'Phase 3 — Advanced (Day 22-24)',
        desc: 'Multi-device sync notes — Firebase Auth (Google + Email), Firestore real-time updates, rich text, tags, offline-first with conflict handling. Sikhoge: Riverpod providers, Firestore streams, optimistic UI, auth flow + protected routes.'
      },
      {
        icon: '📸',
        title: 'Photo Memories — with Maps',
        phase: 'Phase 3 — Advanced (Day 25-26)',
        desc: 'Camera capture + GPS location + Firebase Storage upload with image compression + map markers showing photos. Sikhoge: native plugins (camera, geolocator, permission_handler), Firebase Storage rules, image_picker compression, Google Maps integration.'
      },
      {
        icon: '🍔',
        title: 'Capstone — Food Ordering App',
        phase: 'Phase 3 — Advanced (Day 26-30, 5 days)',
        desc: 'Realistic 5-day build — restaurant list (Firestore), menu + cart, Cash-on-Delivery order placement, real-time order status tracking via FCM push, signed APK + Play Store internal testing. Sikhoge: complete Firebase stack integration, FCM push notifications, app signing keystore, versioning, Play Store deploy. BONUS (optional): Razorpay payment gateway agar time bache.'
      },
      {
        icon: '🏛️',
        title: 'Bloc Architecture Demo',
        phase: 'Phase 4 — BONUS (Day 33-35)',
        desc: 'E-commerce product listing rebuilt with Bloc + Clean Architecture — separate Domain/Data/Presentation layers, Repository pattern, get_it dependency injection. Sikhoge: senior-level code organization, testable architecture, separation of concerns, scalable folder structure jo team projects me chalti hai.'
      },
      {
        icon: '🔋',
        title: 'Native Battery Monitor',
        phase: 'Phase 4 — BONUS (Day 38-39)',
        desc: 'Method Channels se native Kotlin/Swift code call karke device ka battery level + charging status read karna, fir custom plugin bana ke publish karna pub.dev style. Sikhoge: platform channels, native interop, plugin development, FFI basics.'
      },
      {
        icon: '🌐',
        title: 'Pro Capstone — Multi-platform App',
        phase: 'Phase 4 — BONUS (Day 48-50)',
        desc: 'Ek codebase, teen targets — Mobile (Android+iOS), Web (Vercel deploy), Desktop (Windows). Bloc + Clean Architecture + Firestore + responsive layouts + i18n. Sikhoge: cross-platform deployment, responsive breakpoints, CI/CD pipeline, iOS TestFlight, Play Store + Web hosting — senior portfolio piece.'
      }
    ],
    outcomes: [
      { icon: '📱', text: { en: 'Build cross-platform Android + iOS apps from a single codebase', hi: 'एक codebase से Android + iOS apps बना सकोगे' } },
      { icon: '🎨', text: { en: 'Master Flutter widgets, layouts, animations, custom UI', hi: 'Flutter widgets, layouts, animations, custom UI में expert' } },
      { icon: '⚡', text: { en: 'Implement state management with Provider and Riverpod', hi: 'Provider और Riverpod से state management' } },
      { icon: '🔥', text: { en: 'Integrate Firebase — Auth, Firestore, Storage, FCM', hi: 'Firebase integrate — Auth, Firestore, Storage, FCM' } },
      { icon: '🔌', text: { en: 'Connect to REST APIs, parse JSON, handle errors gracefully', hi: 'REST APIs से connect, JSON parse, error handling' } },
      { icon: '🚢', text: { en: 'Deploy apps to Google Play Store with signing & versioning', hi: 'Play Store पे apps deploy कर सकोगे signing + versioning के साथ' } },
      { icon: '🏛️', text: { en: 'BONUS — Architect apps with Bloc + Clean Architecture (senior-level code)', hi: 'BONUS — Bloc + Clean Architecture से apps architect करना (senior-level code)' } },
      { icon: '🔌', text: { en: 'BONUS — Write native Kotlin/Swift code via Method Channels + custom plugins', hi: 'BONUS — Method Channels + custom plugins से native Kotlin/Swift code लिखना' } },
      { icon: '🌐', text: { en: 'BONUS — Ship to Web, Desktop and iOS App Store from one codebase', hi: 'BONUS — एक codebase से Web, Desktop और iOS App Store पे ship करना' } }
    ]
  },
  {
    id: 'javascript',
    title: 'JavaScript Mastery',
    titleHi: 'जावास्क्रिप्ट मास्टरी',
    icon: '🟨',
    color: '#f7df1e',
    status: 'soon',
    tagline: {
      en: 'Pure JavaScript deep dive — ES6+, async, closures, prototypes, browser APIs',
      hi: 'Pure JavaScript deep dive — ES6+, async, closures, prototypes, browser APIs'
    },
    duration: { days: 60, hours: 240 },
    audience: {
      en: 'Become a JavaScript expert before touching any framework',
      hi: 'किसी भी framework से पहले JavaScript expert बनो'
    }
  },
  {
    id: 'python',
    title: 'Python Mastery',
    titleHi: 'पायथन मास्टरी',
    icon: '🐍',
    color: '#3776AB',
    status: 'soon',
    tagline: {
      en: 'Python from basics to backend — Django, FastAPI, automation, data scripts',
      hi: 'Python बेसिक्स से backend तक — Django, FastAPI, automation, data scripts'
    },
    duration: { days: 90, hours: 360 },
    audience: {
      en: 'Build Python backends, automation scripts, and data tools',
      hi: 'Python backends, automation scripts और data tools बनाओ'
    }
  },
  {
    id: 'react-native',
    title: 'React Native',
    titleHi: 'रिएक्ट नेटिव',
    icon: '⚛️',
    color: '#61dafb',
    status: 'soon',
    tagline: {
      en: 'Cross-platform mobile apps using React — alternative path to Flutter',
      hi: 'React से mobile apps — Flutter का alternative path'
    },
    duration: { days: 75, hours: 300 }
  },
  {
    id: 'devops',
    title: 'DevOps Mastery',
    titleHi: 'DevOps मास्टरी',
    icon: '⚙️',
    color: '#EE0000',
    status: 'soon',
    tagline: {
      en: 'Linux, Docker, Kubernetes, CI/CD, AWS, Terraform, Monitoring',
      hi: 'Linux, Docker, Kubernetes, CI/CD, AWS, Terraform, Monitoring'
    },
    duration: { days: 90, hours: 360 }
  }
];

export function getTrackById(id) {
  return tracks.find(t => t.id === id);
}
