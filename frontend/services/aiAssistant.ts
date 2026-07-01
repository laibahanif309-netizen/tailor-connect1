import { apiPost } from './api';

export type AiChatTurn = { role: 'user' | 'assistant'; content: string };

/**
 * Customer-only AI helper (OpenAI key lives on the backend — see backend `.env`).
 */
export async function sendCustomerAiMessage(messages: AiChatTurn[]): Promise<string> {
  const { data } = await apiPost<{ message: string }>('/ai-assistant/chat', { messages });
  return data.message;
}
