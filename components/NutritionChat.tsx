
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithNutritionistStream } from '../services/geminiService';
import { marked } from 'marked';

const NutritionChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, searchQuery]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    
    try {
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      const stream = chatWithNutritionistStream(messages, userMsg);
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', text: fullResponse };
          return updated;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Protocol error: Unable to retrieve clinical response." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = (text: string, isModel: boolean) => {
    if (!isModel) return <div className="font-bold">{text}</div>;
    const html = marked.parse(text || '...');
    return <div className="prose-chat text-sm" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const filteredMessages = messages.filter(m => 
    m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden h-[650px] flex flex-col relative group">
      {/* Header */}
      <div className="bg-slate-900 p-6 text-white flex items-center justify-between relative overflow-hidden flex-shrink-0">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center font-black text-xs shadow-lg shadow-emerald-500/20">CX</div>
          <div>
            <div className="text-sm font-black tracking-tight">Clinical Assistant</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em]">Live Stream</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar Component */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
        <div className="relative group/search">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within/search:text-emerald-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversation history..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-8 bg-slate-50/30 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-16 px-8 animate-in fade-in duration-1000">
            <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-6 text-emerald-500">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-slate-800 text-sm font-black tracking-tight mb-2">Protocol Validation Unit</p>
            <p className="text-slate-400 text-xs font-bold leading-relaxed px-4">
              Streaming clinical insights instantly.
            </p>
          </div>
        )}
        
        {filteredMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[90%] p-6 rounded-[2rem] text-sm shadow-sm border transition-all ${
              m.role === 'user' 
              ? 'bg-emerald-600 text-white border-emerald-700 rounded-tr-none shadow-emerald-200' 
              : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
            }`}>
              {renderMessage(m.text, m.role === 'model')}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_30px_rgb(0,0,0,0.02)] flex-shrink-0">
        <div className="flex gap-3 relative">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query clinical context..."
            className="flex-grow px-6 py-4 rounded-2xl border border-slate-200 text-sm font-bold bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white transition-all outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-6 py-2 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 active:scale-95 disabled:opacity-50 transition-all shadow-xl hover:shadow-emerald-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NutritionChat;
