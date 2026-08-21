import { useState, useMemo } from 'react';
import { markdownToSpeech, useReadAloud } from '../utils/speech';

const RATE_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

function ReadAloud({ text, dark, defaultVoiceLang = 'en-IN', showEn = true }) {
  const [voiceLang, setVoiceLang] = useState(defaultVoiceLang);
  const [rate, setRate] = useState(1);
  const speechText = useMemo(() => markdownToSpeech(text), [text]);
  const { status, progress, play, pause, resume, stop, supported } = useReadAloud(speechText, { voiceLang, rate });

  if (!supported) return null;

  const btnBase = dark
    ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';
  const selectBase = dark
    ? 'bg-slate-800 border-slate-600 text-slate-200'
    : 'bg-white border-slate-300 text-slate-700';

  return (
    <div className={`flex items-center gap-2 flex-wrap rounded-lg border p-2.5 mb-5 ${dark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
      {status === 'idle' && (
        <button onClick={play} className={`px-3 py-1.5 rounded-md text-xs font-semibold border cursor-pointer transition-all ${btnBase}`}>
          🔊 {showEn ? 'Read Aloud' : 'सुनो'}
        </button>
      )}
      {status === 'playing' && (
        <button onClick={pause} className={`px-3 py-1.5 rounded-md text-xs font-semibold border cursor-pointer transition-all ${btnBase}`}>
          ⏸ {showEn ? 'Pause' : 'रोको'}
        </button>
      )}
      {status === 'paused' && (
        <button onClick={resume} className={`px-3 py-1.5 rounded-md text-xs font-semibold border cursor-pointer transition-all ${btnBase}`}>
          ▶ {showEn ? 'Resume' : 'जारी रखो'}
        </button>
      )}
      {status !== 'idle' && (
        <button onClick={stop} className={`px-3 py-1.5 rounded-md text-xs font-semibold border cursor-pointer transition-all ${btnBase}`}>
          ⏹ {showEn ? 'Stop' : 'बंद करो'}
        </button>
      )}

      <select
        value={voiceLang}
        onChange={(e) => setVoiceLang(e.target.value)}
        title={showEn ? 'Voice language' : 'आवाज़ की भाषा'}
        className={`text-xs rounded-md border px-2 py-1.5 cursor-pointer ${selectBase}`}
      >
        <option value="en-IN">🔤 English</option>
        <option value="hi-IN">🔤 हिन्दी</option>
      </select>

      <select
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        title={showEn ? 'Reading speed' : 'पढ़ने की स्पीड'}
        className={`text-xs rounded-md border px-2 py-1.5 cursor-pointer ${selectBase}`}
      >
        {RATE_OPTIONS.map((r) => (
          <option key={r} value={r}>{r}x</option>
        ))}
      </select>

      {status !== 'idle' && (
        <div className={`flex-1 min-w-[50px] h-1.5 rounded-full overflow-hidden ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}

export default ReadAloud;
