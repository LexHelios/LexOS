import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const sendMessage = async (message: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/api/agent`, {
      message,
    });
    return response.data.reply;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}; 