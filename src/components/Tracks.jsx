import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReadAloud from './ReadAloud';
import { tracks, getTrackById } from '../data/tracks';
import { flutterDays, getFlutterContent, hasFlutterContent } from '../data/flutterCourse';
import { androidDays, getAndroidContent, hasAndroidContent } from '../data/androidCourse';

// Per-track day-by-day content wiring. Add an entry here when a new track gets day content.
const trackContentMap = {
  flutter: { days: flutterDays, getContent: getFlutterContent, hasContent: hasFlutterContent },
  android: { days: androidDays, getContent: getAndroidContent, hasContent: hasAndroidContent },
};

function Tracks({ lang, dark, initialTrackId, onSwitchToFullStack }) {
  const [selectedTrack, setSelectedTrack] = useState(() => initialTrackId || null);
  const showEn = lang === 'both' || lang === 'en';
  const textMuted = dark ? 'text-slate-300' : 'text-slate-500';
  const textPrimary = dark ? 'text-white' : 'text-slate-800';

  if (selectedTrack) {
    const track = getTrackById(selectedTrack);
    return (
      <TrackDetail
        track={track}
        lang={lang}
        dark={dark}
        onBack={() => setSelectedTrack(null)}
        onSwitchToFullStack={onSwitchToFullStack}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 max-md:pt-18">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
          {showEn ? 'Choose Your Learning Path' : 'अपना लर्निंग पाथ चुनो'}
        </div>
        <h1 className={`text-3xl sm:text-4xl font-extrabold mb-2 ${textPrimary}`}>
          📚 {showEn ? 'Learning Tracks' : 'लर्निंग ट्रैक्स'}
        </h1>
        <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${textMuted}`}>
          {showEn
            ? 'Multiple courses, one teaching style — Hinglish, classroom-format, real-life examples.'
            : 'कई courses, एक teaching style — Hinglish, classroom-format, real-life examples।'}
        </p>
      </div>

      {/* Track Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {tracks.map(track => (
          <TrackCard
            key={track.id}
            track={track}
            lang={lang}
            dark={dark}
            onOpen={() => {
              if (track.status === 'active') {
                onSwitchToFullStack();
              } else if (track.status === 'available') {
                setSelectedTrack(track.id);
                window.scrollTo(0, 0);
              }
            }}
          />
        ))}
      </div>

      {/* Footer Note */}
      <div className={`rounded-lg border-2 p-4 ${dark ? 'bg-indigo-900/10 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
        <h3 className={`font-bold text-sm mb-2 ${dark ? 'text-indigo-300' : 'text-indigo-700'}`}>
          💡 {showEn ? 'Coming Soon' : 'जल्द आ रहा है'}
        </h3>
        <p className={`text-sm ${dark ? 'text-indigo-200' : 'text-indigo-800'}`}>
          {showEn
            ? 'JavaScript Mastery, Python, React Native aur DevOps tracks development me hain. Stay tuned — same teaching style, same depth.'
            : 'JavaScript Mastery, Python, React Native और DevOps tracks development में हैं। Stay tuned — same teaching style, same depth।'}
        </p>
      </div>
    </div>
  );
}

function TrackCard({ track, lang, dark, onOpen }) {
  const showEn = lang === 'both' || lang === 'en';
  const isSoon = track.status === 'soon';
  const isActive = track.status === 'active';
  const isAvailable = track.status === 'available';

  const cardBg = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textMuted = dark ? 'text-slate-300' : 'text-slate-500';

  const badge = isActive
    ? { text: showEn ? 'Active' : 'सक्रिय', color: '#10b981' }
    : isAvailable
      ? { text: showEn ? 'Available' : 'उपलब्ध', color: '#6366f1' }
      : { text: showEn ? 'Coming Soon' : 'जल्द आएगा', color: '#94a3b8' };

  return (
    <div
      className={`rounded-xl overflow-hidden border-2 transition-all duration-200 ${cardBg} ${isSoon ? 'opacity-70' : 'hover:-translate-y-1 hover:shadow-xl cursor-pointer'}`}
      style={{ borderColor: isSoon ? undefined : track.color }}
      onClick={isSoon ? undefined : onOpen}
    >
      {/* Header */}
      <div className="p-5 text-white relative" style={{ background: track.color }}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-4xl">{track.icon}</span>
          <span
            className="text-[0.65rem] px-2 py-1 rounded-full font-bold uppercase tracking-wider"
            style={{ background: badge.color }}
          >
            {badge.text}
          </span>
        </div>
        <h3 className="text-xl font-bold mb-1">{showEn ? track.title : track.titleHi}</h3>
        <p className="text-xs opacity-90 leading-relaxed">{showEn ? track.tagline.en : track.tagline.hi}</p>
      </div>

      {/* Body */}
      <div className="p-5">
        {track.audience && (
          <p className={`text-sm mb-3 leading-relaxed ${textMuted}`}>
            {showEn ? track.audience.en : track.audience.hi}
          </p>
        )}

        {isSoon && (
          <p className={`text-xs mb-3 italic ${textMuted}`}>
            📝 {showEn ? 'Planned roadmap — no lessons written yet' : 'Planned roadmap — abhi tak koi lesson likha nahi gaya'}
          </p>
        )}

        {/* Stats */}
        {track.duration && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`text-xs px-2 py-1 rounded-md font-semibold ${dark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
              📅 {track.duration.days} {showEn ? 'days' : 'दिन'} {isSoon && '(planned)'}
            </span>
            {track.duration.hoursPerDay && (
              <span className={`text-xs px-2 py-1 rounded-md font-semibold ${dark ? 'bg-emerald-700/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                ⚡ {track.duration.hoursPerDay}h/{showEn ? 'day' : 'दिन'}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-md font-semibold ${dark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
              ⏱️ {track.duration.hours}h
            </span>
            {track.sessions && (
              <span className={`text-xs px-2 py-1 rounded-md font-semibold ${dark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                🎯 {track.sessions} {showEn ? 'sessions' : 'सेशन'}
              </span>
            )}
            {track.topics && (
              <span className={`text-xs px-2 py-1 rounded-md font-semibold ${dark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                📚 {track.topics} {showEn ? 'topics' : 'विषय'}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all border-0 cursor-pointer"
          style={{
            background: isSoon ? (dark ? '#334155' : '#e2e8f0') : track.color,
            color: isSoon ? (dark ? '#94a3b8' : '#64748b') : 'white',
            cursor: isSoon ? 'not-allowed' : 'pointer'
          }}
          disabled={isSoon}
          onClick={isSoon ? undefined : (e) => { e.stopPropagation(); onOpen(); }}
        >
          {isActive
            ? (showEn ? '▶ Continue Learning' : '▶ सीखना जारी रखो')
            : isAvailable
              ? (showEn ? '📖 View Roadmap' : '📖 रोडमैप देखो')
              : (showEn ? '🔒 Coming Soon' : '🔒 जल्द आएगा')}
        </button>
      </div>
    </div>
  );
}

function TrackDetail({ track, lang, dark, onBack }) {
  const showEn = lang === 'both' || lang === 'en';
  const cardBg = dark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200';
  const textMuted = dark ? 'text-slate-300' : 'text-slate-500';
  const textPrimary = dark ? 'text-white' : 'text-slate-800';
  const sectionTitle = `text-lg font-bold mb-3 ${textPrimary}`;
  const [selectedDay, setSelectedDay] = useState(null);

  const trackContent = trackContentMap[track.id];
  const dayList = trackContent?.days || [];

  if (selectedDay !== null) {
    return (
      <DayContentViewer
        day={selectedDay}
        track={track}
        dayList={dayList}
        getContent={trackContent.getContent}
        dark={dark}
        showEn={showEn}
        onBack={() => setSelectedDay(null)}
        onPrev={selectedDay > 1 ? () => { setSelectedDay(selectedDay - 1); window.scrollTo(0, 0); } : null}
        onNext={selectedDay < dayList.length ? () => { setSelectedDay(selectedDay + 1); window.scrollTo(0, 0); } : null}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 max-md:pt-18">
      {/* Back */}
      <button
        className={`mb-4 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${dark ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
        onClick={onBack}
      >
        ← {showEn ? 'Back to Tracks' : 'Tracks पर वापस'}
      </button>

      {/* Hero */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: track.color }}>
        <div className="p-6 sm:p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-5xl">{track.icon}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{showEn ? track.title : track.titleHi}</h1>
              <p className="text-sm opacity-90 mt-1">{showEn ? track.tagline.en : track.tagline.hi}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-white/20">
              📅 {track.duration.days} {showEn ? 'days' : 'दिन'}
            </span>
            {track.duration.hoursPerDay && (
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-white/20">
                ⚡ {track.duration.hoursPerDay} {showEn ? 'hrs/day' : 'घंटे/दिन'}
              </span>
            )}
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-white/20">
              ⏱️ {track.duration.hours} {showEn ? 'total hours' : 'कुल घंटे'}
            </span>
            {track.sessions && (
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-white/20">
                🎯 {track.sessions} {showEn ? 'sessions' : 'सेशन'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Audience */}
      {track.audience && (
        <div className={`rounded-lg border p-4 mb-6 ${cardBg}`}>
          <h3 className={`font-bold text-sm mb-2 ${textPrimary}`}>🎯 {showEn ? 'Who is this for?' : 'किसके लिए है?'}</h3>
          <p className={`text-sm ${textMuted}`}>{showEn ? track.audience.en : track.audience.hi}</p>
        </div>
      )}

      {/* Phases */}
      {track.phases && (
        <div className="mb-6">
          <h2 className={sectionTitle}>📅 {showEn ? 'Learning Roadmap' : 'लर्निंग रोडमैप'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {track.phases.map(phase => (
              <div key={phase.id} className={`rounded-xl overflow-hidden border-2 ${cardBg}`} style={{ borderColor: phase.color }}>
                <div className="p-4 text-white" style={{ background: phase.color }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{phase.icon}</span>
                    <h3 className="text-base font-bold flex-1">{showEn ? phase.title : phase.titleHi}</h3>
                    {phase.isOptional && (
                      <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-white/25 font-bold uppercase tracking-wider">
                        Bonus
                      </span>
                    )}
                  </div>
                  <span className="text-xs opacity-90">Day {phase.dayRange[0]}-{phase.dayRange[1]}</span>
                </div>
                <div className="p-4">
                  <p className={`text-sm mb-3 leading-relaxed ${textMuted}`}>
                    {showEn ? phase.description.en : phase.description.hi}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {phase.topics.map((t, i) => (
                      <span
                        key={i}
                        className={`text-[0.7rem] px-2 py-0.5 rounded-full font-medium ${dark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day List */}
      {dayList.length > 0 && (
        <div className="mb-6">
          <h2 className={sectionTitle}>📖 {showEn ? 'Day-by-Day Content' : 'Day-by-Day कंटेंट'}</h2>
          <p className={`text-xs mb-3 ${textMuted}`}>
            {showEn
              ? 'Click any day to read the lesson. Days marked "Full" have complete content; "Outline" days list the topics while full content is written.'
              : 'किसी भी दिन पे click करो lesson पढ़ने के लिए। "Full" वाले days में पूरा content है; "Outline" वाले days में topics list हैं जब तक full content नहीं लिखा जाता।'}
          </p>
          {track.phases.map(phase => {
            const phaseDays = dayList.filter(d => d.phase === phase.id);
            if (phaseDays.length === 0) return null;
            return (
              <div key={phase.id} className="mb-4">
                <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${textPrimary}`}>
                  <span className="text-base">{phase.icon}</span>
                  <span>{showEn ? phase.title : phase.titleHi}</span>
                  {phase.isOptional && (
                    <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-500 font-bold uppercase tracking-wider">Bonus</span>
                  )}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {phaseDays.map(d => {
                    const isFull = trackContent.hasContent ? trackContent.hasContent(d.day) : true;
                    return (
                      <button
                        key={d.day}
                        onClick={() => { setSelectedDay(d.day); window.scrollTo(0, 0); }}
                        className={`text-left rounded-lg border p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${cardBg}`}
                        style={{ borderLeftWidth: '4px', borderLeftColor: phase.color }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs" style={{ color: phase.color }}>Day {d.day}</span>
                          {isFull ? (
                            <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold uppercase">Full</span>
                          ) : (
                            <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold uppercase">Outline</span>
                          )}
                        </div>
                        <p className={`text-[0.7rem] leading-snug line-clamp-2 ${textMuted}`}>{d.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Projects */}
      {track.projects && (
        <div className="mb-6">
          <h2 className={sectionTitle}>🏗️ {showEn ? 'What You\'ll Build' : 'क्या बनाओगे'}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {track.projects.map((p, i) => (
              <div key={i} className={`rounded-lg border p-3 ${cardBg}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <h4 className={`font-bold text-sm ${textPrimary}`}>{p.title}</h4>
                    <span className="text-[0.65rem] font-semibold" style={{ color: track.color }}>{p.phase}</span>
                    <p className={`text-xs mt-1 ${textMuted}`}>{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outcomes */}
      {track.outcomes && (
        <div className="mb-6">
          <h2 className={sectionTitle}>🎯 {showEn ? 'After Completion You Can' : 'पूरा करने के बाद तुम'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {track.outcomes.map((item, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-lg border p-2.5 ${cardBg}`}>
                <span className="text-lg shrink-0">{item.icon}</span>
                <p className={`text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {showEn ? item.text.en : item.text.hi}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon Notice — only when this track has no day content wired up yet */}
      {dayList.length === 0 && (
        <div className={`rounded-lg border-2 p-4 ${dark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200'}`}>
          <h3 className={`font-bold text-sm mb-2 ${dark ? 'text-amber-400' : 'text-amber-700'}`}>
            📢 {showEn ? 'Day-by-Day Content Coming Soon' : 'Day-by-Day Content जल्द आ रहा है'}
          </h3>
          <p className={`text-sm ${dark ? 'text-amber-200' : 'text-amber-800'}`}>
            {showEn
              ? `Ye roadmap aur syllabus finalize ho chuka hai. ${track.duration.days}-day Hinglish curriculum same teaching style me jaldi launch hoga.`
              : `ये roadmap और syllabus finalize हो चुका है। ${track.duration.days}-day Hinglish curriculum same teaching style में जल्द launch होगा।`}
          </p>
        </div>
      )}
    </div>
  );
}

function DayContentViewer({ day, track, dayList, getContent, dark, showEn, onBack, onPrev, onNext }) {
  const content = getContent(day);
  const dayMeta = dayList.find(d => d.day === day);
  const phase = track.phases?.find(p => p.id === dayMeta?.phase);
  const cardBg = dark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200';
  const textPrimary = dark ? 'text-white' : 'text-slate-800';

  const components = {
    pre: ({ children }) => <div className="overflow-x-auto max-w-full my-4">{children}</div>,
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      const inline = !match && !codeString.includes('\n');
      return inline ? (
        <code className={`px-1.5 py-0.5 rounded font-mono text-[0.88em] break-words ${dark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`} {...props}>{children}</code>
      ) : (
        <SyntaxHighlighter
          style={oneDark}
          language={match ? match[1] : 'text'}
          PreTag="div"
          className="rounded-xl! text-sm!"
        >
          {codeString}
        </SyntaxHighlighter>
      );
    },
    h1: ({ children }) => <h1 className={`text-2xl sm:text-3xl font-extrabold mt-6 mb-4 ${textPrimary}`}>{children}</h1>,
    h2: ({ children }) => <h2 className={`text-xl sm:text-2xl font-bold mt-6 mb-3 ${textPrimary}`}>{children}</h2>,
    h3: ({ children }) => <h3 className={`text-lg font-bold mt-4 mb-2 ${textPrimary}`}>{children}</h3>,
    h4: ({ children }) => <h4 className={`text-base font-semibold mt-3 mb-2 ${textPrimary}`}>{children}</h4>,
    p: ({ children }) => <p className={`my-3 leading-relaxed ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{children}</p>,
    ul: ({ children }) => <ul className={`list-disc pl-6 my-3 space-y-1 ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{children}</ul>,
    ol: ({ children }) => <ol className={`list-decimal pl-6 my-3 space-y-1 ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className={`border-l-4 pl-4 my-4 py-2 rounded-r-lg ${dark ? 'border-indigo-500 bg-indigo-900/20 text-indigo-100' : 'border-indigo-500 bg-indigo-50 text-indigo-900'}`}>
        {children}
      </blockquote>
    ),
    table: ({ children }) => <div className="overflow-x-auto my-4"><table className={`min-w-full border ${dark ? 'border-slate-700' : 'border-slate-300'}`}>{children}</table></div>,
    thead: ({ children }) => <thead className={dark ? 'bg-slate-700' : 'bg-slate-100'}>{children}</thead>,
    th: ({ children }) => <th className={`px-3 py-2 text-left text-sm font-bold border ${dark ? 'border-slate-600 text-slate-100' : 'border-slate-300 text-slate-800'}`}>{children}</th>,
    td: ({ children }) => <td className={`px-3 py-2 text-sm border ${dark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'}`}>{children}</td>,
    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 underline">{children}</a>,
    hr: () => <hr className={`my-6 border-t ${dark ? 'border-slate-700' : 'border-slate-300'}`} />,
    strong: ({ children }) => <strong className={`font-bold ${textPrimary}`}>{children}</strong>,
  };

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-6 max-md:pt-18">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <button
          className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${dark ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          onClick={onBack}
        >
          ← {showEn ? 'Back to Roadmap' : 'Roadmap पर वापस'}
        </button>
        <div className="flex gap-2">
          <button
            disabled={!onPrev}
            onClick={onPrev || undefined}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${!onPrev ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${dark ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            ← {showEn ? 'Prev Day' : 'पिछला दिन'}
          </button>
          <button
            disabled={!onNext}
            onClick={onNext || undefined}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${!onNext ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${dark ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            {showEn ? 'Next Day' : 'अगला दिन'} →
          </button>
        </div>
      </div>

      {/* Phase Banner */}
      {phase && (
        <div className="rounded-lg p-3 mb-5 text-white flex items-center gap-2" style={{ background: phase.color }}>
          <span className="text-xl">{phase.icon}</span>
          <div className="flex-1">
            <span className="text-xs opacity-90">{showEn ? phase.title : phase.titleHi}</span>
            <span className="text-xs opacity-75 ml-2">| Day {phase.dayRange[0]}-{phase.dayRange[1]}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/25 font-bold">⚡ {track.duration?.hoursPerDay || 2} hrs/day</span>
        </div>
      )}

      {/* Read Aloud */}
      <ReadAloud text={content} dark={dark} showEn={showEn} defaultVoiceLang={showEn ? 'en-IN' : 'hi-IN'} />

      {/* Markdown Content */}
      <article className={`prose-lg ${cardBg} border rounded-xl p-5 sm:p-8`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
          {content}
        </ReactMarkdown>
      </article>

      {/* Bottom Nav */}
      <div className="flex items-center justify-between mt-6 gap-2 flex-wrap">
        <button
          disabled={!onPrev}
          onClick={onPrev || undefined}
          className={`px-4 py-2 rounded-md text-sm font-semibold border transition-all ${!onPrev ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${dark ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
        >
          ← {showEn ? 'Previous Day' : 'पिछला दिन'}
        </button>
        <button
          disabled={!onNext}
          onClick={onNext || undefined}
          className="px-4 py-2 rounded-md text-sm font-semibold border-0 bg-indigo-500 text-white hover:bg-indigo-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {showEn ? 'Next Day' : 'अगला दिन'} →
        </button>
      </div>
    </div>
  );
}

export default Tracks;
