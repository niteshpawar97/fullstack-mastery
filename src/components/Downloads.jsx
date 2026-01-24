import { useState } from 'react';
import { getTopicById } from '../data/topics';
import { downloadSessionPDF, downloadDayPDF } from '../utils/pdfGenerator';

function Downloads({ phases, days, lang, dark }) {
  const [loading, setLoading] = useState(null);
  const showEn = lang === 'both' || lang === 'en';
  const getWeekNum = (dayNum) => Math.ceil(dayNum / 7);

  const cardBg = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textMuted = dark ? 'text-slate-300' : 'text-slate-500';

  const handleDownloadSession = async (day, session) => {
    const key = `${day.day}-${session}`;
    setLoading(key);
    try {
      await downloadSessionPDF((session === 'morning' ? day.morning : day.evening).content, day, session);
    } catch (err) { console.error('PDF generation failed:', err); }
    setLoading(null);
  };

  const handleDownloadDay = async (day) => {
    const key = `day-${day.day}`;
    setLoading(key);
    try { await downloadDayPDF(day); }
    catch (err) { console.error('PDF generation failed:', err); }
    setLoading(null);
  };

  const dlBtn = dark
    ? 'border-slate-600 bg-slate-800 text-slate-300 hover:border-indigo-400 hover:bg-indigo-900/30'
    : 'border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50';

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 max-md:pt-20">
      <div className="text-center mb-10">
        <h1 className={`text-2xl sm:text-3xl font-extrabold mb-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
          📥 {showEn ? 'Download PDFs' : 'PDF डाउनलोड'}
        </h1>
        <p className={textMuted}>{showEn ? 'Download notes as PDF for offline reading' : 'ऑफलाइन पढ़ने के लिए PDF डाउनलोड करें'}</p>
      </div>

      {phases.map(phase => {
        const phaseDays = days.filter(d => d.phase === phase.id);
        const weeks = {};
        phaseDays.forEach(d => { const w = getWeekNum(d.day); if (!weeks[w]) weeks[w] = []; weeks[w].push(d); });

        return (
          <div key={phase.id} className="mb-10">
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl text-white mb-5 text-lg" style={{ background: phase.color }}>
              <span>{phase.icon}</span>
              <h2 className="text-sm sm:text-base font-bold flex-1">{showEn ? phase.title : phase.titleHi}</h2>
              <span className="text-xs sm:text-sm opacity-85">Day {phase.dayRange[0]}-{phase.dayRange[1]}</span>
            </div>

            {Object.entries(weeks).map(([weekNum, weekDays]) => (
              <div key={weekNum} className="mb-6">
                <h3 className={`text-sm font-bold uppercase tracking-widest mb-3 ${textMuted}`}>Week {weekNum}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {weekDays.map(day => (
                    <div key={day.day} className={`border rounded-xl p-4 flex flex-col gap-3 ${cardBg}`}>
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold text-indigo-500 text-xs">Day {day.day}</span>
                        <span className={`font-semibold text-sm ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{showEn ? day.title.en : day.title.hi}</span>
                        <div className="flex gap-1 text-sm">
                          {day.topicTags.slice(0, 3).map(tagId => {
                            const topic = getTopicById(tagId);
                            return topic ? <span key={tagId} style={{ color: topic.color }}>{topic.icon}</span> : null;
                          })}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button className={`flex-1 py-2 px-1.5 border rounded-md text-[0.72rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait ${dlBtn}`}
                          onClick={() => handleDownloadSession(day, 'morning')} disabled={loading === `${day.day}-morning`}>
                          {loading === `${day.day}-morning` ? '⏳' : '🌅'} Morning
                        </button>
                        <button className={`flex-1 py-2 px-1.5 border rounded-md text-[0.72rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait ${dlBtn}`}
                          onClick={() => handleDownloadSession(day, 'evening')} disabled={loading === `${day.day}-evening`}>
                          {loading === `${day.day}-evening` ? '⏳' : '🌆'} Evening
                        </button>
                        <button className={`flex-1 py-2 px-1.5 border rounded-md text-[0.72rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait ${dark ? 'border-indigo-500 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50' : 'border-indigo-500 bg-indigo-50 text-indigo-500 hover:bg-indigo-100'}`}
                          onClick={() => handleDownloadDay(day)} disabled={loading === `day-${day.day}`}>
                          {loading === `day-${day.day}` ? '⏳' : '📄'} Full
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default Downloads;
