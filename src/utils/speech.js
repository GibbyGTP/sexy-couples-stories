// Voice in, voice out — the way Gilbert and Vesper actually talk.
// Dictation uses the browser's Web Speech API; read-aloud uses speechSynthesis.
// Both are built into the browser: no extra services, nothing leaves the machine
// except the normal chat request.

const VOICE_KEY = 'vesper.voiceURI';
const AUTOSPEAK_KEY = 'vesper.autoSpeak';

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
export const canListen =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export function getStoredVoiceURI() {
  try {
    return localStorage.getItem(VOICE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredVoiceURI(uri) {
  try {
    if (uri) localStorage.setItem(VOICE_KEY, uri);
    else localStorage.removeItem(VOICE_KEY);
  } catch {
    // ignore
  }
}

export function getAutoSpeak() {
  try {
    return localStorage.getItem(AUTOSPEAK_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAutoSpeak(on) {
  try {
    if (on) localStorage.setItem(AUTOSPEAK_KEY, '1');
    else localStorage.removeItem(AUTOSPEAK_KEY);
  } catch {
    // ignore
  }
}

// Voices load asynchronously in most browsers; resolve once they exist.
export function loadVoices() {
  if (!canSpeak) return Promise.resolve([]);
  const list = window.speechSynthesis.getVoices();
  if (list.length) return Promise.resolve(list);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timer);
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

function pickVoice(voices) {
  const stored = getStoredVoiceURI();
  if (stored) {
    const match = voices.find((v) => v.voiceURI === stored);
    if (match) return match;
  }
  const english = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  // Prefer a warm US male voice when one exists; otherwise any US English; otherwise any English.
  const preferred = ['aaron', 'alex', 'evan', 'nathan', 'tom'];
  for (const name of preferred) {
    const match = english.find((v) => v.name.toLowerCase().includes(name));
    if (match) return match;
  }
  return english.find((v) => v.lang.toLowerCase() === 'en-us') || english[0] || voices[0] || null;
}

// Strip the things that sound terrible read aloud: markdown marks, emoji, bullets.
export function cleanForSpeech(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' code block omitted. ')
    .replace(/[*_#`>~]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\u{FE0F}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function speak(text, { onEnd } = {}) {
  if (!canSpeak) return false;
  stopSpeaking();
  const voices = await loadVoices();
  const utterance = new SpeechSynthesisUtterance(cleanForSpeech(text));
  const voice = pickVoice(voices);
  if (voice) utterance.voice = voice;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (canSpeak) window.speechSynthesis.cancel();
}

export function isSpeaking() {
  return canSpeak && window.speechSynthesis.speaking;
}

/**
 * Dictation. Returns a controller with start/stop; calls onText(fullTranscript,
 * isFinal) as words arrive and onStateChange(listening) on start/stop.
 * The pauses are part of the music: continuous mode, no auto-cutoff between
 * phrases — it listens until the mic button is tapped again.
 */
export function createDictation({ onText, onStateChange, onError }) {
  if (!canListen) return null;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let active = false;
  let finalText = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += chunk + ' ';
      else interim += chunk;
    }
    onText?.((finalText + interim).trim());
  };

  recognition.onend = () => {
    // Browsers stop recognition on silence; restart while the mic is meant to be on.
    if (active) {
      try {
        recognition.start();
      } catch {
        active = false;
        onStateChange?.(false);
      }
    } else {
      onStateChange?.(false);
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      active = false;
      onStateChange?.(false);
      onError?.('Microphone permission was blocked. Allow the mic for this site in your browser and try again.');
    }
    // 'no-speech' and 'aborted' are routine; onend handles the restart.
  };

  return {
    start() {
      finalText = '';
      active = true;
      try {
        recognition.start();
        onStateChange?.(true);
      } catch {
        active = false;
        onStateChange?.(false);
      }
    },
    stop() {
      active = false;
      recognition.stop();
    },
    get active() {
      return active;
    },
  };
}
