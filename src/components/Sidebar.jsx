import { useState, useMemo } from 'react';
import { getTopicById } from '../data/topics';
import { isComplete, isDayComplete } from '../utils/storage';
import { getTrackById } from '../data/tracks';

function Sidebar({
  phases, days, lang, setLang, dark, setDark,
  selectedDay, selectedSession,
  onSelectSession, onViewChange, onChangeTrack, currentTrackId, activeView,
  isOpen, onToggle, progress
}) {
  const [expandedPhase, setExpandedPhase] = useState('phase-1');
  const [expandedWeek, setExpandedWeek] = useState(null);

  const showEn = lang === 'both' || lang === 'en';
  const currentTrack = currentTrackId ? getTrackById(currentTrackId) : null;

  // Group days by phase and week
  const phaseWeeks = useMemo(() => {
    const result = {};
    phases.forEach(phase => {
      const phaseDays = days.filter(d => d.phase === phase.id);
      const weeks = {};
      phaseDays.forEach(d => {
        const w = Math.ceil(d.day / 7);
        if (!weeks[w]) weeks[w] = [];
        weeks[w].push(d);
      });
      result[phase.id] = weeks;
    });
    return result;
  }, [phases, days]);

  return (
    <aside className={`fixed top-0 left-0 w-80 h-screen bg-sidebar text-slate-200 flex flex-col z-100 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

      {/* Header + Close */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">🚀</span>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight truncate">Full Stack Mastery</h1>
            <p className="text-[0.65rem] opacity-50">90-Day Program</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Dark/Light Toggle */}
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors text-sm cursor-pointer border-0"
            onClick={() => setDark(!dark)}
            title={dark ? 'Light Mode' : 'Dark Mode'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          {/* Close (mobile only) */}
          <button
            className="w-8 h-8 rounded-lg items-center justify-center bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border-0 text-slate-200 text-sm hidden max-lg:flex"
            onClick={onToggle}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Lang Toggle */}
      <div className="flex gap-1 px-4 py-2.5 shrink-0">
        {['both', 'en', 'hi'].map(l => (
          <button
            key={l}
            className={`flex-1 py-1 rounded-md text-xs font-semibold cursor-pointer border transition-all ${lang === l ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-white/15 text-slate-300 hover:bg-white/10'}`}
            onClick={() => setLang(l)}
          >
            {l === 'both' ? 'Both' : l === 'en' ? 'EN' : 'HI'}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-0.5 px-2 py-1.5 shrink-0">
        {[
          { view: 'welcome', icon: '🏠', label: showEn ? 'Home' : 'होम' },
          { view: 'tracks', icon: '📚', label: showEn ? 'Learning Tracks' : 'लर्निंग ट्रैक्स' },
          { view: 'plan', icon: '📅', label: showEn ? 'Teaching Plan' : 'टीचिंग प्लान' },
          { view: 'downloads', icon: '📥', label: showEn ? 'Download PDFs' : 'PDF डाउनलोड' },
        ].map(btn => (
          <button
            key={btn.view}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[0.82rem] font-medium cursor-pointer border-0 text-left transition-all ${activeView === btn.view ? 'bg-sidebar-active text-white' : 'bg-transparent text-slate-300 hover:bg-sidebar-hover'}`}
            onClick={() => onViewChange(btn.view)}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      <div className="border-t border-white/8 mx-3 my-1"></div>

      {/* Navigation: Phase > Week > Day > Session */}
      <nav className="flex-1 overflow-y-auto py-1">
        {phases.map(phase => {
          const isPhaseOpen = expandedPhase === phase.id;
          const weeks = phaseWeeks[phase.id] || {};

          return (
            <div key={phase.id}>
              {/* Phase */}
              <button
                className={`flex items-center gap-2 w-full px-3 py-2.5 border-0 text-slate-200 text-[0.82rem] font-semibold cursor-pointer text-left transition-colors hover:bg-sidebar-hover ${isPhaseOpen ? 'bg-white/5' : ''}`}
                style={isPhaseOpen ? { borderLeft: `3px solid ${phase.color}` } : { borderLeft: '3px solid transparent' }}
                onClick={() => setExpandedPhase(isPhaseOpen ? null : phase.id)}
              >
                <span className="text-base">{phase.icon}</span>
                <span className="flex-1 truncate">{showEn ? phase.title : phase.titleHi}</span>
                {phase.isOptional && <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-bold uppercase tracking-wider">Bonus</span>}
                <span className="text-[0.65rem] opacity-40">{isPhaseOpen ? '▾' : '▸'}</span>
              </button>

              {/* Weeks */}
              {isPhaseOpen && Object.entries(weeks).map(([weekNum, weekDays]) => {
                const isWeekOpen = expandedWeek === `${phase.id}-${weekNum}`;
                const weekKey = `${phase.id}-${weekNum}`;
                const completedInWeek = weekDays.filter(d => isDayComplete(progress, d.day)).length;

                return (
                  <div key={weekKey}>
                    {/* Week Header */}
                    <button
                      className={`flex items-center gap-2 w-full pl-8 pr-3 py-2 border-0 text-slate-300 text-xs cursor-pointer text-left transition-colors hover:bg-white/8 ${isWeekOpen ? 'bg-white/5' : ''}`}
                      onClick={() => setExpandedWeek(isWeekOpen ? null : weekKey)}
                    >
                      <span className="font-bold uppercase tracking-wider opacity-60">Week {weekNum}</span>
                      <span className={`ml-auto text-[0.65rem] px-1.5 py-0.5 rounded-full font-semibold ${completedInWeek === weekDays.length ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'}`}>
                        {completedInWeek}/{weekDays.length}
                      </span>
                      <span className="text-[0.6rem] opacity-40">{isWeekOpen ? '▾' : '▸'}</span>
                    </button>

                    {/* Days inside week */}
                    {isWeekOpen && weekDays.map(day => {
                      const dayDone = isDayComplete(progress, day.day);
                      const isSelected = selectedDay === day.day;

                      return (
                        <div key={day.day}>
                          {/* Day */}
                          <div className="flex flex-col">
                            {['morning', 'evening'].map(session => {
                              const isActive = selectedDay === day.day && selectedSession === session;
                              const sessionData = session === 'morning' ? day.morning : day.evening;
                              const sessionDone = isComplete(progress, day.day, session);

                              return (
                                <button
                                  key={session}
                                  className={`flex items-center gap-1.5 w-full pl-12 pr-3 py-1.5 border-0 text-[0.75rem] cursor-pointer text-left transition-all ${isActive ? 'bg-sidebar-active text-white' : 'text-slate-300 hover:bg-white/8 opacity-75 hover:opacity-100'}`}
                                  onClick={() => onSelectSession(day.day, session)}
                                >
                                  {sessionDone ? (
                                    <span className="text-emerald-400 text-[0.7rem] shrink-0">✓</span>
                                  ) : (
                                    <span className="shrink-0 text-[0.7rem]">{session === 'morning' ? '🌅' : '🌆'}</span>
                                  )}
                                  <span className="font-bold text-indigo-400 shrink-0">D{day.day}</span>
                                  <span className="truncate">
                                    {session === 'morning' ? 'AM' : 'PM'}: {showEn ? sessionData.title.en : sessionData.title.hi}
                                  </span>
                                  {/* Topic dots */}
                                  <span className="flex gap-0.5 ml-auto shrink-0">
                                    {day.topicTags.slice(0, 2).map(tagId => {
                                      const topic = getTopicById(tagId);
                                      return topic ? (
                                        <span key={tagId} className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: topic.color }} />
                                      ) : null;
                                    })}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        {currentTrack && onChangeTrack && (
          <button
            className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[0.72rem] font-medium cursor-pointer border-0 bg-white/5 hover:bg-white/10 transition-all text-left mb-2"
            onClick={onChangeTrack}
            title={showEn ? 'Change learning track' : 'लर्निंग track बदलो'}
          >
            <span className="flex items-center gap-1.5 min-w-0 text-slate-300">
              <span>{currentTrack.icon}</span>
              <span className="truncate">{showEn ? currentTrack.title : currentTrack.titleHi}</span>
            </span>
            <span className="text-indigo-400 shrink-0 ml-1">🔄</span>
          </button>
        )}
        <p className="text-center text-[0.65rem] opacity-40">Made for Teaching 🎓</p>
      </div>
    </aside>
  );
}

export default Sidebar;
