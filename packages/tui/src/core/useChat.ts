import { useMarkdown } from './useMarkdown';
import OpenAI from 'openai';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function useChat() {
  const { renderMarkdown } = useMarkdown();
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const messages: ChatMessage[] = [];

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      ...message,
      timestamp: new Date(),
      content: message.sender === 'ai' ? renderMarkdown(message.content) : message.content
    };
    messages.push(newMessage);
    return newMessage;
  };

  const sendToOpenAI = async (prompt: string) => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return addMessage({
      sender: 'ai',
      content: response.choices[0].message.content || ''
    });
  };

  return {
    messages,
    addMessage,
    sendToOpenAI
  };
}