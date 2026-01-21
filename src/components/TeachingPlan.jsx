import { useState } from 'react';
import { getTopicById } from '../data/topics';
import { isDayComplete } from '../utils/storage';
import { downloadTeachingPlanPDF } from '../utils/pdfGenerator';

function TeachingPlan({ phases, days, lang, dark, progress }) {
  const showEn = lang === 'both' || lang === 'en';
  const showHi = lang === 'both' || lang === 'hi';
  const getWeekNum = (dayNum) => Math.ceil(dayNum / 7);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadTeachingPlanPDF(phases, days); }
    catch (err) { console.error('PDF failed:', err); }
    setDownloading(false);
  };

  const cardBg = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textMuted = dark ? 'text-slate-300' : 'text-slate-500';

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 max-md:pt-20">
      <div className="text-center mb-10">
        <h1 className={`text-2xl sm:text-3xl font-extrabold mb-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
          📅 {showEn ? 'Teaching Plan' : 'टीचिंग प्लान'}
        </h1>
        <p className={`text-base sm:text-lg mb-4 ${textMuted}`}>
          {showEn ? '90-Day Full Stack Mastery Program' : '90 दिन का फुल स्टैक मास्टरी प्रोग्राम'}
        </p>
        <button
          className={`mx-auto mb-4 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait ${dark ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700' : 'bg-indigo-500 border-indigo-500 text-white hover:bg-indigo-600'}`}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? '⏳' : '📥'} {showEn ? 'Download Teaching Plan PDF' : 'Teaching Plan PDF डाउनलोड करो'}
        </button>
        <div className={`flex justify-center gap-6 text-sm max-md:flex-col max-md:gap-1 ${textMuted}`}>
          <span>🌅 {showEn ? 'Morning: 2hrs (Concepts)' : 'Morning: 2hrs (कॉन्सेप्ट्स)'}</span>
          <span>🌆 {showEn ? 'Evening: 2hrs (Practice)' : 'Evening: 2hrs (प्रैक्टिस)'}</span>
        </div>
      </div>

      {phases.map(phase => {
        const phaseDays = days.filter(d => d.phase === phase.id);
        const weeks = {};
        phaseDays.forEach(d => {
          const w = getWeekNum(d.day);
          if (!weeks[w]) weeks[w] = [];
          weeks[w].push(d);
        });

        return (
          <div key={phase.id} className="mb-10">
            <div className="flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5 rounded-xl text-white mb-5" style={{ background: phase.color }}>
              <span className="text-3xl sm:text-4xl">{phase.icon}</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold">{showEn ? phase.title : phase.titleHi}</h2>
                <p className="text-sm opacity-85">Day {phase.dayRange[0]} - Day {phase.dayRange[1]}</p>
              </div>
            </div>

            {Object.entries(weeks).map(([weekNum, weekDays]) => {
              const weekCompleted = weekDays.filter(d => isDayComplete(progress, d.day)).length;
              return (
                <div key={weekNum} className="mb-6">
                  <div className="flex items-center gap-2 mb-3 pl-1">
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${textMuted}`}>Week {weekNum}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${weekCompleted === weekDays.length ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : dark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {weekCompleted}/{weekDays.length} done
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {weekDays.map(day => {
                      const dayDone = isDayComplete(progress, day.day);
                      return (
                        <div
                          key={day.day}
                          className={`border rounded-xl p-3 sm:p-4 transition-all hover:shadow-sm ${cardBg} ${day.isRevision ? 'border-l-4 border-l-amber-500' : ''} ${day.isMiniProject && !day.isRevision ? 'border-l-4 border-l-emerald-500' : ''} ${dayDone ? 'opacity-70' : ''}`}
                        >
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-extrabold text-indigo-500 text-sm">Day {day.day}</span>
                            {dayDone && <span className="text-emerald-500 text-xs font-semibold">✓</span>}
                            {day.isRevision && <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold dark:bg-amber-900/30 dark:text-amber-400">★ Revision</span>}
                            {day.isMiniProject && <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold dark:bg-emerald-900/30 dark:text-emerald-400">🏗️ Project</span>}
                          </div>
                          <div className={`font-semibold text-sm sm:text-[0.95rem] mb-2 ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {showEn && <span>{day.title.en}</span>}
                            {showHi && <span className={`text-sm block ${textMuted}`}>{day.title.hi}</span>}
                          </div>
                          <div className={`flex gap-4 mb-2 text-[0.82rem] max-sm:flex-col max-sm:gap-1 ${textMuted}`}>
                            <div className="flex items-center gap-1"><span>🌅</span><span>{showEn ? day.morning.title.en : day.morning.title.hi}</span></div>
                            <div className="flex items-center gap-1"><span>🌆</span><span>{showEn ? day.evening.title.en : day.evening.title.hi}</span></div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {day.topicTags.map(tagId => {
                              const topic = getTopicById(tagId);
                              return topic ? (
                                <span key={tagId} className="text-[0.7rem] px-2 py-0.5 rounded-lg font-semibold" style={{ background: dark ? topic.color + '40' : topic.bg, color: dark ? '#f1f5f9' : topic.color }}>
                                  {topic.icon} {topic.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
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
}

export default TeachingPlan;
