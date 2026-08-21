import { useState, useEffect, useRef, useCallback } from 'react';

// Strips markdown syntax down to plain, speakable sentences.
// Code blocks and tables are skipped (raw code/pipe-tables read aloud are noise, not signal).
export function markdownToSpeech(md) {
  if (!md) return '';
  let text = md;

  text = text.replace(/```[\s\S]*?```/g, ' Code example. ');
  text = text.replace(/^\s*\|.*\|\s*$/gm, '');
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/^#{1,6}\s*/gm, '');
  text = text.replace(/^>\s?/gm, '');
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/^[-*]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  text = text.replace(/^---+$/gm, '');
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu, '');
  text = text.replace(/\n{2,}/g, '. ');
  text = text.replace(/\n/g, ' ');
  text = text.replace(/\s{2,}/g, ' ');

  return text.trim();
}

// Splits text into chunks so long chapters don't hit browser utterance length limits,
// and so pause/resume + progress tracking stays reliable across engines.
function chunkText(text, maxLen = 200) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > maxLen && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = (current + ' ' + sentence).trim();
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Drives window.speechSynthesis over a chunked queue so pause/resume/rate-change work
// consistently (some browsers silently drop pause/resume on very long single utterances).
export function useReadAloud(rawText, { voiceLang = 'en-IN', rate = 1 } = {}) {
  const [status, setStatus] = useState('idle'); // idle | playing | paused
  const [progress, setProgress] = useState(0); // 0..1
  const chunksRef = useRef([]);
  const indexRef = useRef(0);
  const rateRef = useRef(rate);
  const voiceLangRef = useRef(voiceLang);

  useEffect(() => {
    rateRef.current = rate;
    voiceLangRef.current = voiceLang;
  }, [rate, voiceLang]);

  const stop = useCallback(() => {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.cancel();
    indexRef.current = 0;
    setProgress(0);
    setStatus('idle');
  }, []);

  const speakFrom = useCallback((startIndex) => {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.cancel();
    const chunks = chunksRef.current;
    if (!chunks.length) return;

    const speakNext = (i) => {
      if (i >= chunks.length) {
        setStatus('idle');
        setProgress(0);
        indexRef.current = 0;
        return;
      }
      const utter = new SpeechSynthesisUtterance(chunks[i]);
      utter.lang = voiceLangRef.current;
      utter.rate = rateRef.current;
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang === voiceLangRef.current)
        || voices.find(v => v.lang.startsWith(voiceLangRef.current.split('-')[0]));
      if (match) utter.voice = match;

      utter.onend = () => {
        indexRef.current = i + 1;
        setProgress((i + 1) / chunks.length);
        speakNext(i + 1);
      };
      utter.onerror = () => setStatus('idle');

      window.speechSynthesis.speak(utter);
    };

    setStatus('playing');
    speakNext(startIndex);
  }, []);

  const play = useCallback(() => {
    if (!isSpeechSupported()) return;
    chunksRef.current = chunkText(rawText);
    indexRef.current = 0;
    setProgress(0);
    speakFrom(0);
  }, [rawText, speakFrom]);

  const pause = useCallback(() => {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.pause();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    if (!isSpeechSupported()) return;
    // .resume() is unreliable across browsers after a pause spanning chunk boundaries —
    // restarting from the current chunk index is the robust cross-browser approach.
    speakFrom(indexRef.current);
  }, [speakFrom]);

  // Stop speaking on unmount / when navigating away.
  useEffect(() => {
    return () => {
      if (isSpeechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  return { status, progress, play, pause, resume, stop, supported: isSpeechSupported() };
}
