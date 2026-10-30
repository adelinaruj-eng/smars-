import { useState } from 'react';
import { getGroupAIResponse } from '@/lib/ai';
import { Bot, Send, User } from 'lucide-react';

export function AIAssistant() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    { role: 'model', text: 'Hello! I am your independent AI assistant with memory. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue;
    setInputValue('');

    const updatedMessages = [...messages, { role: 'user' as const, text: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const aiReply = await getGroupAIResponse(updatedMessages, userText);
      setMessages(prev => [...prev, { role: 'model', text: aiReply || "No response." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Error connecting to AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <Bot className="w-5 h-5 text-primary-600" />
        <h2 className="font-semibold text-gray-800">Independent AI Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 max-w-[80%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm italic p-2">
            AI is thinking...
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Ask your AI assistant anything..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}