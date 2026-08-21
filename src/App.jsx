import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Content from './components/Content';
import TeachingPlan from './components/TeachingPlan';
import Downloads from './components/Downloads';
import Tracks from './components/Tracks';
import Onboarding from './components/Onboarding';
import { phases, days, allSessions, getPhaseForDay } from './data/course';
import { topics } from './data/topics';
import { tracks } from './data/tracks';
import { getProgress, markComplete, unmarkComplete, getTheme, setTheme as saveTheme, getCompletedCount, isDayComplete, getOnboardedTrack, setOnboardedTrack, clearOnboardedTrack } from './utils/storage';

function App() {
  const [onboardedTrack, setOnboardedTrackState] = useState(() => getOnboardedTrack());
  const [activeView, setActiveView] = useState(() => (getOnboardedTrack() ? 'welcome' : 'onboarding'));
  const [initialTrackId, setInitialTrackId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [lang, setLang] = useState('both');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [dark, setDark] = useState(() => getTheme() === 'dark');
  const [progress, setProgress] = useState(() => getProgress());

  // Apply dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    saveTheme(dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentSessionIndex = useMemo(() => {
    if (!selectedDay || !selectedSession) return -1;
    return allSessions.findIndex(s => s.day === selectedDay && s.session === selectedSession);
  }, [selectedDay, selectedSession]);

  const handleSelectSession = (day, session) => {
    setSelectedDay(day);
    setSelectedSession(session);
    setActiveView('content');
    if (isMobile) setSidebarOpen(false);
  };

  const handleNavigate = (direction) => {
    const newIndex = currentSessionIndex + direction;
    if (newIndex >= 0 && newIndex < allSessions.length) {
      const next = allSessions[newIndex];
      setSelectedDay(next.day);
      setSelectedSession(next.session);
      window.scrollTo(0, 0);
    }
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setSelectedDay(null);
    setSelectedSession(null);
    if (isMobile) setSidebarOpen(false);
  };

  const handleSelectTrack = (trackId) => {
    setOnboardedTrack(trackId);
    setOnboardedTrackState(trackId);
    if (trackId === 'fullstack') {
      handleViewChange('welcome');
    } else {
      setInitialTrackId(trackId);
      handleViewChange('tracks');
    }
  };

  const handleChangeTrack = () => {
    clearOnboardedTrack();
    setOnboardedTrackState(null);
    setInitialTrackId(null);
    setActiveView('onboarding');
    setSelectedDay(null);
    setSelectedSession(null);
    if (isMobile) setSidebarOpen(false);
  };

  const handleToggleComplete = (day, session) => {
    const key = `${day}-${session}`;
    if (progress[key]) {
      setProgress(unmarkComplete(day, session));
    } else {
      setProgress(markComplete(day, session));
    }
  };

  const currentContent = useMemo(() => {
    if (currentSessionIndex === -1) return null;
    return allSessions[currentSessionIndex];
  }, [currentSessionIndex]);

  const completedDays = useMemo(() => {
    return days.filter(d => isDayComplete(progress, d.day)).length;
  }, [progress]);

  const renderContent = () => {
    switch (activeView) {
      case 'onboarding':
        return (
          <Onboarding
            lang={lang}
            dark={dark}
            setLang={setLang}
            onSelectTrack={handleSelectTrack}
          />
        );
      case 'content':
        return currentContent ? (
          <Content
            content={currentContent}
            phase={getPhaseForDay(selectedDay)}
            lang={lang}
            dark={dark}
            onNavigate={handleNavigate}
            hasPrev={currentSessionIndex > 0}
            hasNext={currentSessionIndex < allSessions.length - 1}
            progress={progress}
            onToggleComplete={handleToggleComplete}
          />
        ) : null;
      case 'plan':
        return <TeachingPlan phases={phases} days={days} lang={lang} dark={dark} progress={progress} />;
      case 'downloads':
        return <Downloads phases={phases} days={days} lang={lang} dark={dark} />;
      case 'tracks':
        return (
          <Tracks
            lang={lang}
            dark={dark}
            initialTrackId={initialTrackId}
            onSwitchToFullStack={() => handleViewChange('welcome')}
          />
        );
      default:
        return (
          <WelcomePage
            lang={lang}
            dark={dark}
            onSelectSession={handleSelectSession}
            onViewChange={handleViewChange}
            completedDays={completedDays}
            completedSessions={getCompletedCount(progress)}
          />
        );
    }
  };

  if (activeView === 'onboarding') {
    return renderContent();
  }

  return (
    <>
      <Sidebar
        phases={phases}
        days={days}
        lang={lang}
        setLang={setLang}
        dark={dark}
        setDark={setDark}
        selectedDay={selectedDay}
        selectedSession={selectedSession}
        onSelectSession={handleSelectSession}
        onViewChange={handleViewChange}
        onChangeTrack={handleChangeTrack}
        currentTrackId={onboardedTrack}
        activeView={activeView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        progress={progress}
      />
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-90" onClick={() => setSidebarOpen(false)} />
      )}
      <main className={`min-h-screen transition-colors ${!isMobile ? 'lg:pl-80' : ''} ${dark ? 'bg-[#0c1222] text-slate-100' : 'bg-[#f0f2f5] text-slate-800'}`}>
        {isMobile && !sidebarOpen && (
          <button
            className="fixed top-4 left-4 z-80 w-11 h-11 rounded-xl bg-sidebar flex flex-col justify-center items-center gap-1.5 shadow-lg border-0 cursor-pointer"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span className="block w-5.5 h-0.5 bg-slate-200 rounded-sm"></span>
            <span className="block w-5.5 h-0.5 bg-slate-200 rounded-sm"></span>
            <span className="block w-5.5 h-0.5 bg-slate-200 rounded-sm"></span>
          </button>
        )}
        {renderContent()}
      </main>
    </>
  );
}

function WelcomePage({ lang, dark, onSelectSession, onViewChange, completedDays, completedSessions }) {
  const showEn = lang === 'both' || lang === 'en';
  const showHi = lang === 'both' || lang === 'hi';
  const cardBg = dark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200';
  const textMuted = dark ? 'text-slate-300' : 'text-slate-500';
  const textPrimary = dark ? 'text-white' : 'text-slate-800';
  const sectionTitle = `text-lg font-bold mb-3 ${textPrimary}`;

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 max-md:pt-18">

      {/* Hero Header */}
      <div className="text-center mb-5">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
          {showEn ? 'Backend-Focused Full Stack Program' : 'बैकेंड-फोकस्ड फुल स्टैक प्रोग्राम'}
        </div>
        <h1 className={`text-3xl sm:text-4xl font-extrabold mb-2 ${textPrimary}`}>
          🚀 {showEn && 'Full Stack Mastery'}
          {lang === 'both' && ' / '}
          {showHi && 'फुल स्टैक मास्टरी'}
        </h1>
        <p className={`text-sm sm:text-base max-w-xl mx-auto leading-relaxed ${textMuted}`}>
          {showEn && '90 days mein zero se job-ready backend developer bano. Hinglish mein classroom-style teaching — concepts morning mein, practice evening mein.'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          { num: '120', label: showEn ? 'Days' : 'दिन', icon: '📅' },
          { num: '34', label: showEn ? 'Topics' : 'विषय', icon: '📚' },
          { num: '240', label: showEn ? 'Sessions' : 'सेशन', icon: '🎯' },
          { num: '480h', label: showEn ? 'Total Hours' : 'कुल घंटे', icon: '⏱️' },
        ].map((s, i) => (
          <div key={i} className={`rounded-lg p-3 text-center border shadow-sm ${cardBg}`}>
            <span className="text-base">{s.icon}</span>
            <span className="block text-xl font-extrabold text-indigo-500">{s.num}</span>
            <span className={`text-xs font-medium uppercase tracking-wider ${textMuted}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Your Progress */}
      {completedSessions > 0 && (
        <div className={`rounded-lg border p-4 mb-5 ${cardBg}`}>
          <div className="flex justify-between text-sm mb-2">
            <span className={`font-semibold ${textPrimary}`}>{showEn ? 'Your Progress' : 'तुम्हारी प्रगति'}</span>
            <span className={textMuted}>{completedDays}/90 days | {completedSessions}/180 sessions | {Math.round(completedSessions / 180 * 100)}%</span>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <div className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(completedSessions / 180) * 100}%` }} />
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex gap-2 justify-center flex-col sm:flex-row mb-6">
        <button
          className="px-6 py-3 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer border-0"
          onClick={() => onSelectSession(1, 'morning')}
        >
          ▶ {showEn ? 'Start Day 1' : 'Day 1 शुरू करो'}
        </button>
        <button
          className={`px-6 py-3 rounded-lg text-sm font-semibold border-2 transition-all cursor-pointer hover:border-indigo-500 hover:text-indigo-500 ${dark ? 'bg-slate-800 text-slate-200 border-slate-600' : 'bg-white text-slate-800 border-slate-200'}`}
          onClick={() => onViewChange('plan')}
        >
          📅 {showEn ? 'View Teaching Plan' : 'Teaching Plan देखो'}
        </button>
        <button
          className={`px-6 py-3 rounded-lg text-sm font-semibold border-2 transition-all cursor-pointer hover:border-indigo-500 hover:text-indigo-500 ${dark ? 'bg-slate-800 text-slate-200 border-slate-600' : 'bg-white text-slate-800 border-slate-200'}`}
          onClick={() => onViewChange('downloads')}
        >
          📥 {showEn ? 'Download PDFs' : 'PDF डाउनलोड'}
        </button>
      </div>

      {/* Daily Schedule */}
      <div className="mb-6">
        <h2 className={sectionTitle}>⏱️ {showEn ? 'Daily Schedule' : 'रोज़ का शेड्यूल'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`rounded-lg border p-4 ${cardBg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌅</span>
              <div>
                <h3 className={`font-bold ${textPrimary}`}>{showEn ? 'Morning Session' : 'मॉर्निंग सेशन'}</h3>
                <p className={`text-sm ${textMuted}`}>2 {showEn ? 'hours' : 'घंटे'}</p>
              </div>
            </div>
            <ul className={`text-sm space-y-1 ${textMuted}`}>
              <li>📖 {showEn ? 'Concept explanation with real-life examples' : 'कॉन्सेप्ट + real-life examples'}</li>
              <li>💻 {showEn ? 'Code walkthrough with Hindi comments' : 'कोड walkthrough Hindi comments के साथ'}</li>
              <li>📋 {showEn ? 'Quick revision table & interview tips' : 'Quick revision + interview tips'}</li>
            </ul>
          </div>
          <div className={`rounded-lg border p-4 ${cardBg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌆</span>
              <div>
                <h3 className={`font-bold ${textPrimary}`}>{showEn ? 'Evening Session' : 'इवनिंग सेशन'}</h3>
                <p className={`text-sm ${textMuted}`}>2 {showEn ? 'hours' : 'घंटे'}</p>
              </div>
            </div>
            <ul className={`text-sm space-y-1 ${textMuted}`}>
              <li>🛠️ {showEn ? 'Hands-on practice tasks' : 'Hands-on practice tasks'}</li>
              <li>🏗️ {showEn ? 'Mini projects & assignments' : 'Mini projects & assignments'}</li>
              <li>✅ {showEn ? 'Git commit after every session' : 'हर session के बाद Git commit'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4 Phase Cards */}
      <div className="mb-6">
        <h2 className={sectionTitle}>📅 {showEn ? '4-Phase Learning Path' : '4 फेज लर्निंग पाथ'}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {phases.map(phase => {
            const phaseDaysList = Array.from({ length: phase.dayRange[1] - phase.dayRange[0] + 1 }, (_, i) => phase.dayRange[0] + i);
            const phaseCompleted = phaseDaysList.filter(d => isDayComplete(getProgress(), d)).length;
            const phaseTotal = phaseDaysList.length;

            return (
              <div
                key={phase.id}
                className={`rounded-xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-150 border-2 ${dark ? 'bg-slate-800 border-slate-600' : 'bg-white'}`}
                style={{ borderColor: phase.color }}
              >
                <div className="p-3 sm:p-4 text-white flex flex-col gap-0.5" style={{ background: phase.color }}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{phase.icon}</span>
                    {phase.isOptional && <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-white/20 font-bold uppercase tracking-wider">Bonus</span>}
                  </div>
                  <h3 className="text-sm font-bold">{showEn ? phase.title : phase.titleHi}</h3>
                  <span className="text-xs opacity-85">Day {phase.dayRange[0]}-{phase.dayRange[1]} | {phaseCompleted}/{phaseTotal} days</span>
                </div>
                <div className="px-5 py-3">
                  <div className={`h-1.5 rounded-full overflow-hidden mb-2 ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(phaseCompleted / phaseTotal) * 100}%`, background: phase.color }} />
                  </div>
                  <p className={`text-sm leading-relaxed ${textMuted}`}>
                    {showEn ? phase.description.en : phase.description.hi}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Other Learning Tracks */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className={sectionTitle.replace('mb-3', 'mb-0')}>📚 {showEn ? 'Other Learning Tracks' : 'अन्य लर्निंग ट्रैक्स'}</h2>
          <button
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 cursor-pointer border-0 bg-transparent"
            onClick={() => onViewChange('tracks')}
          >
            {showEn ? 'View All →' : 'सब देखो →'}
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {tracks.filter(t => t.id !== 'fullstack').slice(0, 4).map(track => {
            const isSoon = track.status === 'soon';
            const isAvailable = track.status === 'available';
            return (
              <div
                key={track.id}
                className={`rounded-lg border-2 p-3 transition-all ${cardBg} ${isSoon ? 'opacity-60' : 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer'}`}
                style={{ borderColor: isSoon ? undefined : track.color }}
                onClick={isSoon ? undefined : () => onViewChange('tracks')}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-2xl">{track.icon}</span>
                  {isAvailable ? (
                    <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold uppercase tracking-wider">
                      {showEn ? 'New' : 'नया'}
                    </span>
                  ) : (
                    <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 font-bold uppercase tracking-wider">
                      {showEn ? 'Soon' : 'जल्द'}
                    </span>
                  )}
                </div>
                <h4 className={`font-bold text-sm ${textPrimary}`}>{showEn ? track.title : track.titleHi}</h4>
                <p className={`text-[0.7rem] mt-1 line-clamp-2 ${textMuted}`}>{showEn ? track.tagline.en : track.tagline.hi}</p>
                {track.duration && (
                  <p className="text-[0.65rem] mt-2 font-semibold" style={{ color: track.color }}>
                    📅 {track.duration.days} {showEn ? 'days' : 'दिन'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* What You'll Build */}
      <div className="mb-6">
        <h2 className={sectionTitle}>🏗️ {showEn ? 'What You\'ll Build' : 'क्या बनाओगे'}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { icon: '🖥️', title: showEn ? 'CLI Task Manager' : 'CLI Task Manager', phase: 'Phase 1', color: '#6366f1', desc: showEn ? 'Node.js + File System + JSON storage' : 'Node.js + File System + JSON storage' },
            { icon: '🔌', title: showEn ? 'REST API System' : 'REST API System', phase: 'Phase 2', color: '#059669', desc: showEn ? 'Express + MongoDB + JWT Auth + Validation' : 'Express + MongoDB + JWT Auth + Validation' },
            { icon: '💬', title: showEn ? 'Real-time Chat App' : 'Real-time Chat App', phase: 'Phase 2', color: '#059669', desc: showEn ? 'WebSocket + Socket.IO + Rooms' : 'WebSocket + Socket.IO + Rooms' },
            { icon: '📡', title: showEn ? 'IoT Sensor Dashboard' : 'IoT Sensor Dashboard', phase: 'Phase 2', color: '#059669', desc: showEn ? 'MQTT + MongoDB + Real-time updates' : 'MQTT + MongoDB + Real-time updates' },
            { icon: '🛒', title: showEn ? 'E-Commerce API' : 'E-Commerce API', phase: 'Phase 2', color: '#059669', desc: showEn ? 'Full CRUD + Auth + Pagination + File Upload' : 'Full CRUD + Auth + Pagination + File Upload' },
            { icon: '🚀', title: showEn ? 'Full Stack Deployed App' : 'Full Stack Deployed App', phase: 'Phase 3', color: '#d97706', desc: showEn ? 'React + Express + Docker + AWS + CI/CD' : 'React + Express + Docker + AWS + CI/CD' },
            { icon: '🔷', title: showEn ? 'TypeScript API' : 'TypeScript API', phase: 'Phase 4 BONUS', color: '#7c3aed', desc: showEn ? 'Express + TS + Mongoose + Zod typed' : 'Express + TS + Mongoose + Zod typed' },
            { icon: '◈', title: showEn ? 'GraphQL API' : 'GraphQL API', phase: 'Phase 4 BONUS', color: '#7c3aed', desc: showEn ? 'Apollo Server + Subscriptions + Auth' : 'Apollo Server + Subscriptions + Auth' },
            { icon: '🔗', title: showEn ? 'Microservices System' : 'Microservices System', phase: 'Phase 4 BONUS', color: '#7c3aed', desc: showEn ? 'RabbitMQ/Kafka + K8s + API Gateway' : 'RabbitMQ/Kafka + K8s + API Gateway' },
          ].map((p, i) => (
            <div key={i} className={`rounded-lg border p-3 ${cardBg}`}>
              <div className="flex items-start gap-2">
                <span className="text-xl">{p.icon}</span>
                <div>
                  <h4 className={`font-bold text-sm ${textPrimary}`}>{p.title}</h4>
                  <span className="text-[0.65rem] font-semibold" style={{ color: p.color }}>{p.phase}</span>
                  <p className={`text-xs mt-1 ${textMuted}`}>{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* After 90 Days - Outcome */}
      <div className="mb-6">
        <h2 className={sectionTitle}>🎯 {showEn ? 'After 90 Days You Can' : '90 दिन बाद तुम ये कर सकोगे'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: '🔌', text: showEn ? 'Build production-level REST APIs with Auth, Validation, Pagination' : 'Production-level REST APIs बना सकोगे' },
            { icon: '🗄️', text: showEn ? 'Design databases (SQL + MongoDB) with proper relations & indexing' : 'SQL + MongoDB databases design कर सकोगे' },
            { icon: '🔐', text: showEn ? 'Implement JWT authentication, role-based access, security hardening' : 'JWT Auth + RBAC + Security implement कर सकोगे' },
            { icon: '📡', text: showEn ? 'Build real-time systems with WebSocket & MQTT (IoT ready)' : 'WebSocket + MQTT से real-time systems बना सकोगे' },
            { icon: '🐳', text: showEn ? 'Dockerize apps & deploy on AWS EC2 with Nginx + CI/CD' : 'Docker + AWS + Nginx + CI/CD से deploy कर सकोगे' },
            { icon: '🏗️', text: showEn ? 'Understand System Design — Monolith, Modular, Microservices' : 'System Design — Monolith, Modular, Microservices समझोगे' },
            { icon: '🧪', text: showEn ? 'Write tests (Jest + Supertest), logging (Winston), debugging' : 'Tests + Logging + Debugging कर सकोगे' },
            { icon: '⚛️', text: showEn ? 'Build React admin dashboard connected to your backend' : 'React Admin Dashboard बना सकोगे backend से connected' },
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-lg border p-2.5 ${cardBg}`}>
              <span className="text-lg shrink-0">{item.icon}</span>
              <p className={`text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* After 120 Days BONUS - Outcome */}
      <div className={`mb-6 rounded-lg border-2 p-4 ${dark ? 'bg-purple-900/10 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
        <h2 className={`text-lg font-bold mb-3 ${dark ? 'text-purple-300' : 'text-purple-700'}`}>
          💎 {showEn ? 'After 120 Days (BONUS) — Senior Level' : '120 दिन बाद (BONUS) — Senior Level'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: '🔷', text: showEn ? 'Write TypeScript backends — fully typed APIs, zero runtime errors' : 'TypeScript backends — fully typed APIs, zero runtime errors' },
            { icon: '◈', text: showEn ? 'Build GraphQL APIs with subscriptions, auth & DataLoader' : 'GraphQL APIs with subscriptions, auth & DataLoader' },
            { icon: '🔗', text: showEn ? 'Design & build Microservices with message queues (RabbitMQ/Kafka)' : 'Microservices design + RabbitMQ/Kafka communication' },
            { icon: '☸️', text: showEn ? 'Deploy to Kubernetes — pods, services, scaling, rolling updates' : 'Kubernetes pe deploy — pods, services, scaling' },
            { icon: '⚡', text: showEn ? 'Performance optimization — profiling, load testing, memory leaks' : 'Performance optimization — profiling, load testing' },
            { icon: '🛡️', text: showEn ? 'Build resilient systems — Circuit Breaker, retry, rate limiting' : 'Resilient systems — Circuit Breaker, retry, rate limiting' },
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-lg border p-2.5 ${dark ? 'bg-slate-800/50 border-purple-800/50' : 'bg-white border-purple-100'}`}>
              <span className="text-lg shrink-0">{item.icon}</span>
              <p className={`text-sm ${dark ? 'text-purple-200' : 'text-purple-800'}`}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div className="mb-6">
        <h2 className={sectionTitle}>📊 {showEn ? 'Knowledge Level After Each Phase' : 'हर फेज के बाद तुम्हारा लेवल'}</h2>
        <div className="flex flex-col gap-2">
          {[
            { phase: 'Phase 1 (30 Days)', level: showEn ? '~3-4 months self-learner equivalent' : '~3-4 महीने self-learner के बराबर', pct: 25, color: '#6366f1', skills: 'JS + Node.js + Git + SQL + MongoDB + DSA' },
            { phase: 'Phase 2 (60 Days)', level: showEn ? '~6-8 months junior developer equivalent' : '~6-8 महीने junior developer के बराबर', pct: 50, color: '#059669', skills: 'REST API + Auth + WebSocket + MQTT + DB Design' },
            { phase: 'Phase 3 (90 Days)', level: showEn ? '~1-1.5 years backend developer equivalent' : '~1-1.5 साल backend developer के बराबर', pct: 75, color: '#d97706', skills: 'Docker + AWS + CI/CD + Testing + System Design + React' },
            { phase: 'Phase 4 (120 Days) — BONUS', level: showEn ? '~2-3 years senior backend equivalent' : '~2-3 साल senior backend developer के बराबर', pct: 100, color: '#7c3aed', skills: 'TypeScript + GraphQL + Microservices + Kafka/RabbitMQ + Kubernetes' },
          ].map((item, i) => (
            <div key={i} className={`rounded-lg border p-3 ${cardBg}`}>
              <div className="flex items-center justify-between mb-1">
                <h4 className={`font-bold text-sm ${textPrimary}`}>{item.phase}</h4>
                <span className="text-xs font-semibold" style={{ color: item.color }}>{item.level}</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden mb-2 ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <div className="h-full rounded-full transition-all" style={{ width: `${item.pct}%`, background: item.color }} />
              </div>
              <p className={`text-xs ${textMuted}`}>{item.skills}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Teaching Style */}
      <div className="mb-6">
        <h2 className={sectionTitle}>📌 {showEn ? 'Teaching Style' : 'पढ़ाने का तरीका'}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { icon: '🗣️', title: showEn ? 'Hinglish Language' : 'हिंग्लिश भाषा', desc: showEn ? 'Simple Hindi + English mix — like a classroom teacher' : 'सिंपल हिंदी + इंग्लिश मिक्स — क्लासरूम टीचर जैसे' },
            { icon: '🌾', title: showEn ? 'Real-Life Examples' : 'Real-Life Examples', desc: showEn ? 'Farmer, IoT, business, apps — not boring theory' : 'किसान, IoT, बिजनेस — बोरिंग थ्योरी नहीं' },
            { icon: '🔄', title: showEn ? 'Mixed Topics Daily' : 'रोज़ मिक्स टॉपिक्स', desc: showEn ? 'JS + Git + DB mixed — never bored on one topic' : 'JS + Git + DB मिक्स — एक टॉपिक पे बोर नहीं' },
            { icon: '🏗️', title: showEn ? 'Weekly Mini Projects' : 'हर हफ्ते Mini Project', desc: showEn ? 'Every 7 days — revision + hands-on project' : 'हर 7 दिन — revision + hands-on project' },
            { icon: '💡', title: showEn ? 'Smart Callouts' : 'स्मार्ट Callouts', desc: showEn ? 'Yaad Rakho, Socho Aise, Tip, Warning — quick memory hooks' : 'याद रखो, सोचो ऐसे, टिप, वार्निंग — जल्दी याद रहे' },
            { icon: '🎯', title: showEn ? 'Interview Ready' : 'इंटरव्यू रेडी', desc: showEn ? 'Common mistakes, best practices, interview questions included' : 'Common mistakes + best practices + interview questions' },
          ].map((item, i) => (
            <div key={i} className={`rounded-lg border p-3 ${cardBg}`}>
              <span className="text-xl">{item.icon}</span>
              <h4 className={`font-bold text-sm mt-2 ${textPrimary}`}>{item.title}</h4>
              <p className={`text-xs mt-1 ${textMuted}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All Topics */}
      <div className="mb-6">
        <h2 className={sectionTitle}>📚 {showEn ? '34 Topics Covered' : '34 विषय'}</h2>
        <div className="flex flex-wrap gap-2">
          {topics.map(topic => (
            <span
              key={topic.id}
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ background: dark ? topic.color + '40' : topic.bg, color: dark ? '#f1f5f9' : topic.color, border: `1.5px solid ${topic.color}${dark ? '60' : '30'}` }}
            >
              {topic.icon} {showEn ? topic.name : topic.nameHi}
            </span>
          ))}
        </div>
      </div>

      {/* Special Rules */}
      <div className={`rounded-lg border p-4 mb-6 ${dark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200'}`}>
        <h3 className={`font-bold text-sm mb-3 ${dark ? 'text-amber-400' : 'text-amber-700'}`}>⚠️ {showEn ? 'Important Rules' : 'ज़रूरी नियम'}</h3>
        <ul className={`text-sm space-y-1.5 ${dark ? 'text-amber-200' : 'text-amber-800'}`}>
          <li>• {showEn ? 'Never skip practice session — coding muscle memory builds only by doing' : 'Practice session कभी skip मत करो — coding muscle memory बनती है'}</li>
          <li>• {showEn ? 'Git commit after every evening session — this is your coding diary' : 'हर evening session के बाद Git commit करो — ये तुम्हारी coding diary है'}</li>
          <li>• {showEn ? 'Type the code yourself — copy-paste se kuch nahi seekhoge' : 'Code खुद type करो — copy-paste से कुछ नहीं सीखोगे'}</li>
          <li>• {showEn ? 'Every 7 days revision + mini project is mandatory' : 'हर 7 दिन revision + mini project mandatory है'}</li>
          <li>• {showEn ? 'React is taught ONLY at the end — backend is the main focus' : 'React सिर्फ आखिर में — backend ही main focus है'}</li>
        </ul>
      </div>

      {/* Bottom CTA */}
      <div className="flex gap-3 justify-center flex-col sm:flex-row">
        <button
          className="px-6 py-3 rounded-lg text-base font-bold bg-indigo-500 text-white hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer border-0"
          onClick={() => onSelectSession(1, 'morning')}
        >
          🚀 {showEn ? 'Start Learning — Day 1' : 'सीखना शुरू करो — Day 1'}
        </button>
      </div>
    </div>
  );
}

export default App;
