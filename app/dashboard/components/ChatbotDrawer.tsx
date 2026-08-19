"use client";
import React from 'react';
import { Bot, X, Send } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatbotDrawerProps {
  isChatOpen: boolean;
  chatInput: string;
  messages: ChatMessage[];
  isTyping: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  setIsChatOpen: (open: boolean) => void;
  setChatInput: (input: string) => void;
  handleSendChatMessage: (e: React.FormEvent) => void;
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({
  isChatOpen,
  chatInput,
  messages,
  isTyping,
  chatEndRef,
  setIsChatOpen,
  setChatInput,
  handleSendChatMessage,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-[999] flex flex-col items-end gap-2 shrink-0 leading-none text-left">
      {isChatOpen && (
        <div className="w-[240px] md:w-[280px] h-[360px] bg-white rounded-[1.25rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5 leading-none text-left">
          <div className="bg-secondary p-3 flex items-center justify-between text-white shadow-lg leading-none text-left">
            <div className="flex items-center gap-2 leading-none text-left">
              <div className="bg-primary p-1.5 rounded-lg shadow-md leading-none text-center">
                <Bot size={14} className="text-left" />
              </div>
              <h4 className="text-[9px] font-black tracking-widest uppercase leading-none text-left">
                BÜ-AI ASİSTAN
              </h4>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="hover:text-primary transition-all leading-none text-left"
            >
              <X size={14} className="text-left" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50/50 custom-scrollbar leading-relaxed text-left">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end text-left' : 'justify-start text-left'
                } animate-in fade-in leading-relaxed text-left`}
              >
                <div
                  className={`max-w-[90%] p-2 rounded-lg text-[9px] font-medium shadow-sm leading-relaxed text-left ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none text-left'
                      : 'bg-white text-secondary rounded-tl-none border border-gray-100 text-left'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start leading-none text-left">
                <div className="bg-white p-2 rounded-lg rounded-tl-none shadow-sm flex gap-1 animate-pulse border border-gray-100 leading-none text-left">
                  <span className="w-1 h-1 bg-gray-300 rounded-full text-left"></span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full text-left"></span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full text-left"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} className="text-left" />
          </div>
          <form
            onSubmit={handleSendChatMessage}
            className="p-2.5 bg-white border-t border-gray-100 flex gap-2 leading-none text-left"
          >
            <input
              type="text"
              placeholder="Sor..."
              className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-lg px-3 py-1.5 text-[9px] outline-none focus:border-primary transition-all font-bold text-secondary shadow-inner leading-none text-left"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-primary text-white p-2 rounded-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center leading-none text-left"
            >
              <Send size={12} className="text-left" />
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 z-[1000] border-2 border-white leading-none text-left ${
          isChatOpen ? 'bg-secondary text-white' : 'bg-primary text-white'
        }`}
      >
        {isChatOpen ? <X size={18} /> : <Bot size={20} />}
      </button>
    </div>
  );
};
