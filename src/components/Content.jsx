import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getTopicById } from '../data/topics';
import { isComplete } from '../utils/storage';

const calloutConfig = {
  'Yaad Rakho': { icon: '🧠', color: '#3b82f6', bg: '#eff6ff', darkBg: '#1e3a5f', label: 'Yaad Rakho' },
  'याद रखो': { icon: '🧠', color: '#3b82f6', bg: '#eff6ff', darkBg: '#1e3a5f', label: 'याद रखो' },
  'Socho Aise': { icon: '💡', color: '#059669', bg: '#ecfdf5', darkBg: '#1a3a2a', label: 'Socho Aise' },
  'सोचो ऐसे': { icon: '💡', color: '#059669', bg: '#ecfdf5', darkBg: '#1a3a2a', label: 'सोचो ऐसे' },
  'Tip': { icon: '✨', color: '#d97706', bg: '#fffbeb', darkBg: '#3d2e0a', label: 'Tip' },
  'टिप': { icon: '✨', color: '#d97706', bg: '#fffbeb', darkBg: '#3d2e0a', label: 'टिप' },
  'Example': { icon: '📌', color: '#7c3aed', bg: '#f5f3ff', darkBg: '#2d1b69', label: 'Example' },
  'उदाहरण': { icon: '📌', color: '#7c3aed', bg: '#f5f3ff', darkBg: '#2d1b69', label: 'उदाहरण' },
  'Warning': { icon: '⚠️', color: '#dc2626', bg: '#fef2f2', darkBg: '#4a1515', label: 'Warning' },
  'ध्यान': { icon: '⚠️', color: '#dc2626', bg: '#fef2f2', darkBg: '#4a1515', label: 'ध्यान' },
  'Question': { icon: '❓', color: '#ea580c', bg: '#fff7ed', darkBg: '#3d2008', label: 'Question' },
  'सवाल': { icon: '❓', color: '#ea580c', bg: '#fff7ed', darkBg: '#3d2008', label: 'सवाल' },
  'Practice Karo': { icon: '💻', color: '#059669', bg: '#ecfdf5', darkBg: '#1a3a2a', label: 'Practice Karo!' },
  'Practice Time': { icon: '💻', color: '#059669', bg: '#ecfdf5', darkBg: '#1a3a2a', label: 'Practice Time!' },
  'Expected Output': { icon: '📺', color: '#0284c7', bg: '#f0f9ff', darkBg: '#0c2d48', label: 'Expected Output' },
  'Mini Project': { icon: '🏗️', color: '#d97706', bg: '#fffbeb', darkBg: '#3d2e0a', label: 'Mini Project' },
  'Terminal Command': { icon: '⌨️', color: '#94a3b8', bg: '#f1f5f9', darkBg: '#1e293b', label: 'Terminal Command' },
  'Aaj ka plan': { icon: '📋', color: '#818cf8', bg: '#eef2ff', darkBg: '#272361', label: 'Aaj ka plan' },
};

function getCalloutType(text) {
  if (!text) return null;
  const str = typeof text === 'string' ? text : '';
  for (const [key, config] of Object.entries(calloutConfig)) {
    if (str.startsWith(`**${key}`) || str.startsWith(key)) return config;
  }
  return null;
}

function extractTextContent(children) {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(c => typeof c === 'string' ? c : c?.props?.children ? extractTextContent(c.props.children) : '').join('');
  if (children?.props?.children) return extractTextContent(children.props.children);
  return '';
}

function createMarkdownComponents(dark) {
  return {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const inline = !match && !className;
      return inline ? (
        <code className={`px-1.5 py-0.5 rounded font-mono text-[0.88em] ${dark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`} {...props}>{children}</code>
      ) : (
        <SyntaxHighlighter
          style={oneDark}
          language={match ? match[1] : 'text'}
          PreTag="div"
          className="rounded-xl! my-4! text-sm!"
          showLineNumbers={false}
          customStyle={{ fontFamily: 'var(--font-mono)' }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    },
    blockquote({ children }) {
      const text = extractTextContent(children);
      const callout = getCalloutType(text);
      if (callout) {
        return (
          <div className="rounded-lg p-4 my-4 border-l-4" style={{ borderColor: callout.color, background: dark ? callout.darkBg : callout.bg }}>
            <div className="flex items-center gap-2 font-bold text-sm mb-1" style={{ color: dark ? callout.color + 'cc' : callout.color }}>
              <span className="text-base">{callout.icon}</span>
              <span>{callout.label}</span>
            </div>
            <div className={`text-sm [&>p:first-child]:hidden [&>p]:my-1 ${dark ? 'text-slate-300' : ''}`}>{children}</div>
          </div>
        );
      }
      return <blockquote className={`border-l-4 pl-4 py-3 my-4 rounded-r-lg ${dark ? 'border-slate-600 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{children}</blockquote>;
    },
    table({ children }) {
      return (
        <div className={`overflow-x-auto my-4 rounded-lg border ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
          <table className="w-full border-collapse text-sm">{children}</table>
        </div>
      );
    },
    th({ children }) {
      return <th className={`px-3.5 py-2.5 text-left font-semibold border-b-2 ${dark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200'}`}>{children}</th>;
    },
    td({ children }) {
      return <td className={`px-3.5 py-2.5 border-b ${dark ? 'border-slate-700' : 'border-slate-200'}`}>{children}</td>;
    },
    tr({ children }) {
      return <tr className={dark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}>{children}</tr>;
    },
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

function Content({ content, dayData, phase, lang, dark, onNavigate, hasPrev, hasNext, progress, onToggleComplete }) {
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
