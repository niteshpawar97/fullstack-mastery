import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getTopicById } from '../data/topics';
import { isComplete } from '../utils/storage';
import { createBaseMarkdownComponents } from '../utils/markdownComponents';
import ReadAloud from './ReadAloud';

function createMarkdownComponents(dark) {
  return {
    ...createBaseMarkdownComponents(dark),
    h1({ children }) {
      return <h1 className={`text-2xl sm:text-3xl font-extrabold mb-6 leading-tight ${dark ? 'text-white' : 'text-slate-800'}`}>{children}</h1>;
    },
    h2({ children }) {
      return <h2 className={`text-lg sm:text-xl font-bold mt-9 mb-4 pb-2 border-b-2 ${dark ? 'text-white border-slate-700' : 'text-slate-800 border-slate-200'}`}>{children}</h2>;
    },
    h3({ children }) {
      return <h3 className={`text-base sm:text-lg font-semibold mt-6 mb-3 ${dark ? 'text-indigo-400' : 'text-indigo-500'}`}>{children}</h3>;
    },
    p({ children }) { return <p className="my-3">{children}</p>; },
    ul({ children }) { return <ul className="my-3 pl-6 list-disc">{children}</ul>; },
    ol({ children }) { return <ol className="my-3 pl-6 list-decimal">{children}</ol>; },
    li({ children }) { return <li className="my-1.5">{children}</li>; },
    hr() { return <hr className={`border-t-2 my-8 ${dark ? 'border-slate-700' : 'border-slate-200'}`} />; },
    a({ href, children }) { return <a href={href} className="text-indigo-500 font-medium hover:underline">{children}</a>; },
    strong({ children }) { return <strong className={dark ? 'text-white font-bold' : 'font-bold text-slate-800'}>{children}</strong>; },
  };
}

function Content({ content, phase, lang, dark, onNavigate, hasPrev, hasNext, progress, onToggleComplete }) {
  const contentRef = useRef(null);
  const showEn = lang === 'both' || lang === 'en';
  const sessionDone = isComplete(progress, content.day, content.session);
  const components = createMarkdownComponents(dark);

  const btnBase = dark
    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-indigo-400 hover:text-indigo-400'
    : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-500 hover:text-indigo-500';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-md:pt-18">
      {/* Card wrapper for large screens */}
      <div className={`lg:rounded-2xl lg:p-8 sm:p-6 p-4 ${dark ? 'lg:bg-slate-900 lg:border lg:border-slate-800 lg:shadow-2xl' : 'lg:bg-white lg:border lg:border-slate-200 lg:shadow-sm'}`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 py-2 text-sm mb-2 flex-wrap">
        <span className="font-semibold" style={{ color: phase?.color }}>
          {phase?.icon} {showEn ? phase?.title : phase?.titleHi}
        </span>
        <span className={dark ? 'text-slate-600' : 'text-slate-400'}>/</span>
        <span className={`font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>Day {content.day}</span>
        <span className={dark ? 'text-slate-600' : 'text-slate-400'}>/</span>
        <span className={dark ? 'text-slate-300' : 'text-slate-500'}>
          {content.session === 'morning' ? '🌅 Morning' : '🌆 Evening'}
        </span>
        <span className="text-slate-500 text-xs ml-auto">Week {Math.ceil(content.day / 7)}</span>
      </div>

      {/* Topic Tags + Complete Toggle */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {content.topicTags?.map(tagId => {
          const topic = getTopicById(tagId);
          return topic ? (
            <span key={tagId} className="px-2.5 py-1 rounded-xl text-xs font-semibold" style={{ background: dark ? topic.color + '40' : topic.bg, color: dark ? '#f1f5f9' : topic.color }}>
              {topic.icon} {topic.name}
            </span>
          ) : null;
        })}
        <button
          className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${sessionDone ? 'bg-emerald-500 text-white border-emerald-500' : dark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500 hover:text-emerald-400' : 'bg-white text-slate-500 border-slate-300 hover:border-emerald-500 hover:text-emerald-500'}`}
          onClick={() => onToggleComplete(content.day, content.session)}
        >
          {sessionDone ? '✓ Completed' : 'Mark Done'}
        </button>
      </div>

      {/* Read Aloud */}
      <ReadAloud text={content.content} dark={dark} showEn={showEn} defaultVoiceLang={showEn ? 'en-IN' : 'hi-IN'} />

      {/* Markdown Content */}
      <div className={`leading-7 ${dark ? 'text-slate-200' : 'text-slate-800'}`} ref={contentRef}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
          {content.content}
        </ReactMarkdown>
      </div>

      {/* Navigation */}
      <div className={`flex justify-between pt-6 mt-6 border-t-2 ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
        <button
          className={`px-4 sm:px-6 py-2.5 border-2 rounded-lg font-semibold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm ${btnBase}`}
          onClick={() => onNavigate(-1)}
          disabled={!hasPrev}
        >
          ← Previous
        </button>
        <button
          className={`px-4 sm:px-6 py-2.5 border-2 rounded-lg font-semibold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm ${btnBase}`}
          onClick={() => onNavigate(1)}
          disabled={!hasNext}
        >
          Next →
        </button>
      </div>
      </div>{/* end card wrapper */}
    </div>
  );
}

export default Content;
