import { tracks } from '../data/tracks';

function Onboarding({ lang, dark, setLang, onSelectTrack }) {
  const showEn = lang === 'both' || lang === 'en';
  const showHi = lang === 'both' || lang === 'hi';

  const cardBg = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textMuted = dark ? 'text-slate-300' : 'text-slate-500';
  const textPrimary = dark ? 'text-white' : 'text-slate-800';

  return (
    <div className={`min-h-screen flex items-center justify-center px-5 py-10 ${dark ? 'bg-[#0c1222]' : 'bg-[#f0f2f5]'}`}>
      <div className="max-w-4xl w-full">

        {/* Lang Toggle */}
        <div className="flex justify-center gap-1 mb-6">
          {['both', 'en', 'hi'].map(l => (
            <button
              key={l}
              className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer border transition-all ${lang === l ? 'bg-indigo-500 border-indigo-500 text-white' : `${dark ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600'} bg-transparent`}`}
              onClick={() => setLang(l)}
            >
              {l === 'both' ? 'Both' : l === 'en' ? 'EN' : 'HI'}
            </button>
          ))}
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <span className="text-4xl">👋</span>
          <h1 className={`text-2xl sm:text-3xl font-extrabold mt-3 mb-2 ${textPrimary}`}>
            {showEn && 'What do you want to learn?'}
            {lang === 'both' && ' / '}
            {showHi && 'क्या सीखना/पढ़ना है?'}
          </h1>
          <p className={`text-sm max-w-lg mx-auto ${textMuted}`}>
            {showEn
              ? 'Pick a track — we\'ll take you straight there. You can switch tracks anytime later.'
              : 'एक track चुनो — हम तुम्हें सीधे वहाँ ले जाएंगे। बाद में track कभी भी बदल सकते हो।'}
          </p>
        </div>

        {/* Track Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tracks.map(track => {
            const isSoon = track.status === 'soon';
            return (
              <button
                key={track.id}
                disabled={isSoon}
                onClick={() => onSelectTrack(track.id)}
                className={`text-left rounded-xl overflow-hidden border-2 transition-all duration-200 ${cardBg} ${isSoon ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl cursor-pointer'}`}
                style={{ borderColor: isSoon ? undefined : track.color }}
              >
                <div className="p-4 text-white" style={{ background: track.color }}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-3xl">{track.icon}</span>
                    {isSoon && (
                      <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-white/20 font-bold uppercase tracking-wider">
                        {showEn ? 'Coming Soon' : 'जल्द आएगा'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold">{showEn ? track.title : track.titleHi}</h3>
                </div>
                <div className="p-4">
                  <p className={`text-xs leading-relaxed ${textMuted}`}>
                    {showEn ? track.tagline.en : track.tagline.hi}
                  </p>
                  {track.duration && (
                    <p className="text-[0.7rem] mt-2 font-semibold" style={{ color: track.color }}>
                      📅 {track.duration.days} {showEn ? 'days' : 'दिन'} {isSoon && '(planned)'}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
