import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Shared between Content.jsx (90-day course) and Tracks.jsx (Flutter/Android day viewer) —
// these renderers were previously copy-pasted in both files, which is how the code-block
// mobile-overflow bug had to be fixed twice. Headings/paragraphs/lists stay page-specific
// since each viewer's typography is deliberately different.

export const calloutConfig = {
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
  'Challenge': { icon: '🎯', color: '#db2777', bg: '#fdf2f8', darkBg: '#4a0f2e', label: 'Challenge' },
  'Interview Trap': { icon: '🪤', color: '#dc2626', bg: '#fef2f2', darkBg: '#4a1515', label: 'Interview Trap' },
};

export function getCalloutType(text) {
  if (!text) return null;
  const str = (typeof text === 'string' ? text : '').trim();
  for (const [key, config] of Object.entries(calloutConfig)) {
    if (str.startsWith(`**${key}`) || str.startsWith(key)) return config;
  }
  return null;
}

export function extractTextContent(children) {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(c => typeof c === 'string' ? c : c?.props?.children ? extractTextContent(c.props.children) : '').join('');
  if (children?.props?.children) return extractTextContent(children.props.children);
  return '';
}

// Base renderers common to every markdown viewer in the app. Spread this into a
// page-specific components object and override/add headings, paragraphs, lists, etc.
export function createBaseMarkdownComponents(dark) {
  return {
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
          showLineNumbers={false}
          customStyle={{ fontFamily: 'var(--font-mono)' }}
        >
          {codeString}
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
            <div className={`text-sm [&>p]:my-1 ${dark ? 'text-slate-300' : ''}`}>{children}</div>
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
    hr() { return <hr className={`border-t-2 my-8 ${dark ? 'border-slate-700' : 'border-slate-200'}`} />; },
  };
}
