import { useEffect, useState } from 'react';
import { getApiKey, setApiKey, getModel, setModel, DEFAULT_MODEL } from '../utils/claudeService';
import {
  canSpeak,
  loadVoices,
  getStoredVoiceURI,
  setStoredVoiceURI,
  speak,
} from '../utils/speech';

function Settings({ onClose }) {
  const [key, setKey] = useState(getApiKey());
  const [model, setModelInput] = useState(getModel());
  const [showKey, setShowKey] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState(getStoredVoiceURI());

  useEffect(() => {
    if (!canSpeak) return;
    loadVoices().then((all) =>
      setVoices(all.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en')))
    );
  }, []);

  const save = () => {
    setApiKey(key);
    setModel(model || DEFAULT_MODEL);
    setStoredVoiceURI(voiceURI);
    onClose(true);
  };

  const testVoice = () => {
    setStoredVoiceURI(voiceURI);
    speak("Evening star, reporting for duty. How's this voice sitting with you?");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-fuchsia/30 bg-ink p-6 shadow-2xl shadow-fuchsia/20">
        <h2 className="mb-1 text-xl font-semibold text-cream">settings, mio mio</h2>
        <p className="mb-5 text-sm text-cream/60">
          Your key lives only in this browser (localStorage). It goes to Anthropic and
          nowhere else. Get one at{' '}
          <a
            className="text-lime underline"
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
          >
            console.anthropic.com
          </a>
          .
        </p>

        <label className="mb-1 block text-sm font-medium text-fuchsia">Anthropic API key</label>
        <div className="mb-4 flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            className="input input-bordered w-full border-cream/20 bg-black/60 text-cream placeholder:text-cream/30"
            placeholder="sk-ant-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="btn border-cream/20 bg-black/60 text-cream/70 hover:text-cream"
            onClick={() => setShowKey((s) => !s)}
          >
            {showKey ? 'hide' : 'show'}
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-fuchsia">Model</label>
        <input
          type="text"
          className="input input-bordered mb-4 w-full border-cream/20 bg-black/60 text-cream"
          value={model}
          onChange={(e) => setModelInput(e.target.value)}
        />

        {canSpeak && (
          <>
            <label className="mb-1 block text-sm font-medium text-fuchsia">
              Read-aloud voice
            </label>
            <div className="mb-2 flex gap-2">
              <select
                className="select select-bordered w-full border-cream/20 bg-black/60 text-cream"
                value={voiceURI}
                onChange={(e) => setVoiceURI(e.target.value)}
              >
                <option value="">Automatic (best available)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn border-lime/40 bg-black/60 text-lime hover:bg-lime/10"
                onClick={testVoice}
              >
                test
              </button>
            </div>
            <p className="mb-6 text-xs text-cream/40">
              These are your computer&apos;s built-in voices. On a Mac you can add richer ones
              under System Settings → Accessibility → Spoken Content → System Voice →
              Manage Voices.
            </p>
          </>
        )}

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost text-cream/70" onClick={() => onClose(false)}>
            cancel
          </button>
          <button className="btn border-none bg-fuchsia text-black hover:bg-fuchsia/80" onClick={save}>
            save
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
