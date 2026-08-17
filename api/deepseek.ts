import type { Category } from '@shared/types';
import { buildSystemInstruction } from './ollama';

export const DEEPSEEK_URL = process.env.AI_API_URL || 'https://api.deepseek.com';
export const DEEPSEEK_MODEL = process.env.AI_MODEL || 'deepseek-chat';

/**
 * Parse a financial utterance using the DeepSeek API (OpenAI-compatible
 * chat completions). Returns the parsed JSON object, or null on any failure
 * so the caller can fall back to Ollama / the regex parser.
 */
export async function parseWithDeepSeek(
  text: string,
  accounts?: string[],
  categories?: Category[]
): Promise<any | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    console.warn('AI_API_KEY is not set — skipping DeepSeek.');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${DEEPSEEK_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: buildSystemInstruction(categories, accounts),
          },
          {
            role: 'user',
            content: `Parse this financial utterance into JSON: "${text}"`,
          },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      console.error(`DeepSeek responded with status ${res.status}`);
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === 'string' && content.trim()) {
      return JSON.parse(content.trim());
    }
    return null;
  } catch (err) {
    console.error('DeepSeek call failed, falling back:', err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
