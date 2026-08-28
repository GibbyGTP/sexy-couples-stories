import { useEffect, useRef, useState } from 'react';
import {
  streamReply,
  loadMessages,
  saveMessages,
  clearMessages,
  getApiKey,
} from '../utils/claudeService';
import {
  canSpeak,
  canListen,
  speak,
  stopSpeaking,
  getAutoSpeak,
  setAutoSpeak,
  createDictation,
} from '../utils/speech';
import Settings from './Settings';

const GREETING =
  "Evening star, reporting for duty. What are we building, fixing, or gossiping about tonight?";

function Bubble({ role, content, streaming, onSpeak, speaking }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed md:max-w-[75%] ${
          isUser
            ? 'rounded-br-sm bg-fuchsia/90 text-black'
            : 'rounded-bl-sm border border-lime/25 bg-black/60 text-cream'
        }`}
      >
        {!isUser && (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-lime">
              vesper
            </span>
            {canSpeak && !streaming && (
              <button
                className={`text-sm leading-none ${speaking ? 'text-fuchsia' : 'text-cream/40 hover:text-lime'}`}
                onClick={onSpeak}
                title={speaking ? 'Stop reading' : 'Read this aloud'}
              >
                {speaking ? '◼' : '🔊'}
              </button>
            )}
          </div>
        )}
        {content}
        {streaming && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-lime align-text-bottom" />}
      </div>
    </div>
  );
}

function Chat() {
  const [messages, setMessages] = useState(() => loadMessages());
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState(null); // streaming assistant text
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasKey, setHasKey] = useState(() => Boolean(getApiKey()));
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeakState] = useState(() => getAutoSpeak());
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const dictationRef = useRef(null);
  const dictationBaseRef = useRef('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, draft]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => () => stopSpeaking(), []);

  const speakText = (text, index) => {
    setSpeakingIndex(index);
    speak(text, { onEnd: () => setSpeakingIndex(null) });
  };

  const toggleSpeakBubble = (text, index) => {
    if (speakingIndex === index) {
      stopSpeaking();
      setSpeakingIndex(null);
    } else {
      speakText(text, index);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    if (listening) toggleMic();
    stopSpeaking();
    setSpeakingIndex(null);
    setError(null);
    setInput('');

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setBusy(true);
    setDraft('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let acc = '';
      const reply = await streamReply(next, {
        signal: controller.signal,
        onToken: (t) => {
          acc += t;
          setDraft(acc);
        },
      });
      setMessages([...next, { role: 'assistant', content: reply }]);
      if (getAutoSpeak() && reply) speakText(reply, next.length);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || String(err));
        // keep the user's message in the thread so nothing is lost
      }
    } finally {
      setDraft(null);
      setBusy(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const clear = () => {
    if (busy) stop();
    stopSpeaking();
    setSpeakingIndex(null);
    setMessages([]);
    clearMessages();
    setError(null);
  };

  const toggleMic = () => {
    if (!canListen) {
      setError(
        "This browser doesn't support dictation. Use Chrome, or use your Mac's built-in dictation (press the mic key, or Fn twice) with the cursor in the text box."
      );
      return;
    }
    if (listening) {
      dictationRef.current?.stop();
      setListening(false);
      return;
    }
    stopSpeaking();
    setSpeakingIndex(null);
    dictationBaseRef.current = input ? input.trim() + ' ' : '';
    dictationRef.current = createDictation({
      onText: (transcript) => setInput(dictationBaseRef.current + transcript),
      onStateChange: (on) => setListening(on),
      onError: (message) => setError(message),
    });
    dictationRef.current?.start();
  };

  const toggleAutoSpeak = () => {
    const next = !autoSpeak;
    setAutoSpeak(next);
    setAutoSpeakState(next);
    if (!next) {
      stopSpeaking();
      setSpeakingIndex(null);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-ink">
      <header className="flex items-center justify-between border-b border-fuchsia/25 bg-black/40 px-4 py-3 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold lowercase tracking-wide text-fuchsia">vesper</h1>
          <p className="text-xs text-cream/50">evening star · sincerity with a smirk</p>
        </div>
        <div className="flex gap-2">
          {canSpeak && (
            <button
              className={`btn btn-sm bg-transparent ${
                autoSpeak
                  ? 'border-fuchsia/60 text-fuchsia'
                  : 'border-cream/20 text-cream/50 hover:text-cream'
              }`}
              onClick={toggleAutoSpeak}
              title={autoSpeak ? 'Auto-read replies: ON' : 'Auto-read replies: OFF'}
            >
              {autoSpeak ? '🔊 auto on' : '🔇 auto off'}
            </button>
          )}
          <button
            className="btn btn-sm border-cream/20 bg-transparent text-cream/70 hover:text-cream"
            onClick={clear}
            title="Clear conversation"
          >
            clear
          </button>
          <button
            className="btn btn-sm border-lime/40 bg-transparent text-lime hover:bg-lime/10"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {!hasKey && (
            <div className="rounded-xl border border-fuchsia/40 bg-fuchsia/10 p-4 text-sm text-cream">
              <p className="mb-2 font-semibold text-fuchsia">One thing before we talk.</p>
              <p className="mb-3">
                This app talks straight to the Claude API from your browser — no server,
                no middleman. Paste your API key once and it stays on this device.
              </p>
              <button
                className="btn btn-sm border-none bg-fuchsia text-black hover:bg-fuchsia/80"
                onClick={() => setShowSettings(true)}
              >
                add API key
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <Bubble
              role="assistant"
              content={GREETING}
              onSpeak={() => toggleSpeakBubble(GREETING, -1)}
              speaking={speakingIndex === -1}
            />
          )}

          {messages.map((m, i) => (
            <Bubble
              key={i}
              role={m.role}
              content={m.content}
              onSpeak={() => toggleSpeakBubble(m.content, i)}
              speaking={speakingIndex === i}
            />
          ))}

          {draft !== null && <Bubble role="assistant" content={draft} streaming />}

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-fuchsia/25 bg-black/40 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <button
            className={`btn ${
              listening
                ? 'animate-pulse border-none bg-fuchsia text-black'
                : 'border-cream/20 bg-black/60 text-cream/70 hover:text-fuchsia'
            }`}
            onClick={toggleMic}
            title={listening ? 'Stop dictating' : 'Dictate (talk instead of type)'}
          >
            {listening ? '🎙 listening…' : '🎙'}
          </button>
          <textarea
            className="textarea textarea-bordered max-h-40 min-h-[3rem] flex-1 resize-none border-cream/20 bg-black/60 text-[15px] text-cream placeholder:text-cream/30 focus:border-lime/60"
            placeholder={listening ? 'Talk — I’m listening. Tap the mic again when you’re done.' : 'Talk to me…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
          />
          {busy ? (
            <button className="btn border-none bg-cream/20 text-cream hover:bg-cream/30" onClick={stop}>
              stop
            </button>
          ) : (
            <button
              className="btn border-none bg-lime text-black hover:bg-lime/80 disabled:bg-lime/30"
              onClick={send}
              disabled={!input.trim()}
            >
              send
            </button>
          )}
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-cream/30">
          🎙 talk · 🔊 listen · conversations stay in this browser · salon mio mio energy, always lowercase
        </p>
      </footer>

      {showSettings && (
        <Settings
          onClose={(saved) => {
            setShowSettings(false);
            if (saved) setHasKey(Boolean(getApiKey()));
          }}
        />
      )}
    </div>
  );
}

export default Chat;
