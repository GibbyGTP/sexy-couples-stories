import { buildSystemPrompt } from '../vesper/systemPrompt';

const API_URL = 'https://api.anthropic.com/v1/messages';
export const DEFAULT_MODEL = 'claude-fable-5';

const STORAGE_KEYS = {
  apiKey: 'vesper.apiKey',
  model: 'vesper.model',
  messages: 'vesper.messages',
};

export function getApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEYS.apiKey) || '';
  } catch {
    return '';
  }
}

export function setApiKey(key) {
  try {
    if (key) localStorage.setItem(STORAGE_KEYS.apiKey, key.trim());
    else localStorage.removeItem(STORAGE_KEYS.apiKey);
  } catch {
    // storage unavailable — key lives only for this page load
  }
}

export function getModel() {
  try {
    return localStorage.getItem(STORAGE_KEYS.model) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function setModel(model) {
  try {
    if (model && model !== DEFAULT_MODEL) localStorage.setItem(STORAGE_KEYS.model, model.trim());
    else localStorage.removeItem(STORAGE_KEYS.model);
  } catch {
    // ignore
  }
}

export function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.messages);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
  } catch {
    // storage full or unavailable — history just won't persist
  }
}

export function clearMessages() {
  try {
    localStorage.removeItem(STORAGE_KEYS.messages);
  } catch {
    // ignore
  }
}

/**
 * Stream a reply from the Claude Messages API, directly from the browser.
 * `messages` is [{role: 'user'|'assistant', content: string}, ...] ending with the
 * newest user turn. Calls `onToken(text)` as text arrives; returns the full reply.
 */
export async function streamReply(messages, { onToken, signal } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key. Open settings (the ⚙ button) and paste your Anthropic API key.');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: 4096,
      stream: true,
      system: buildSystemPrompt(),
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const err = await response.json();
      if (err?.error?.message) detail = err.error.message;
    } catch {
      // non-JSON error body
    }
    throw new Error(detail);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      let event;
      try {
        event = JSON.parse(payload);
      } catch {
        continue;
      }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        fullText += event.delta.text;
        onToken?.(event.delta.text);
      } else if (event.type === 'error') {
        throw new Error(event.error?.message || 'Stream error');
      }
    }
  }

  return fullText;
}
