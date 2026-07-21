import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react';
import { aiApi } from '../../api/aiApi';
import { useAuth } from '../../hooks/useAuth';
import type { AIChatMessage } from '../../types/ai.type';
import AIMessageBubble from './AIMessageBubble';
import AIQuickReplies from './AIQuickReplies';

// ─── Helpers ────────────────────────────────────────────────────────

function appendUniqueMessage(messages: AIChatMessage[], newMessage: AIChatMessage): AIChatMessage[] {
  const exists = messages.some((msg) => {
    if (msg.id && newMessage.id && msg.id === newMessage.id) return true;
    if (msg.clientMessageId && newMessage.clientMessageId && msg.clientMessageId === newMessage.clientMessageId && msg.role === newMessage.role) return true;
    return false;
  });
  if (exists) return messages;
  return [...messages, newMessage];
}

function getCurrentPage(pathname: string): string {
  if (pathname === '/') return 'HOME';
  if (pathname.startsWith('/workshops')) return 'WORKSHOP';
  if (pathname.startsWith('/ai/itinerary')) return 'AI_ITINERARY';
  if (pathname.startsWith('/ai/advisor')) return 'AI_ADVISOR';
  if (pathname.startsWith('/host')) return 'HOST_DASHBOARD';
  if (pathname.startsWith('/admin')) return 'ADMIN_DASHBOARD';
  if (pathname.startsWith('/tour-guide')) return 'TOUR_GUIDE_DASHBOARD';
  if (pathname.startsWith('/profile')) return 'PROFILE';
  if (pathname.startsWith('/my-bookings')) return 'MY_BOOKINGS';
  if (pathname.startsWith('/my-orders')) return 'MY_ORDERS';
  if (pathname.startsWith('/cart')) return 'CART';
  return 'GENERAL';
}

function getCurrentWorkshopId(pathname: string): string | null {
  const match = pathname.match(/^\/workshops\/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

const INITIAL_QUICK_REPLIES = [
  'Gợi ý workshop phù hợp',
  'Tìm workshop rẻ nhất',
  'Tạo lịch trình trải nghiệm',
  'Hướng dẫn đặt vé',
];

// ─── Component ──────────────────────────────────────────────────────

const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const location = useLocation();
  const { user } = useAuth();

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // ─── Send Logic ─────────────────────────────────────────────────

  const handleSendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isSendingRef.current) return;

    const clientMessageId = crypto.randomUUID();

    const userMessage: AIChatMessage = {
      id: `user-${clientMessageId}`,
      clientMessageId,
      role: 'USER',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => appendUniqueMessage(prev, userMessage));
    setInput('');
    setError(null);
    setIsSending(true);
    isSendingRef.current = true;

    try {
      const response = await aiApi.chat({
        conversationId,
        clientMessageId,
        message: trimmed,
        context: {
          page: getCurrentPage(location.pathname),
          currentWorkshopId: getCurrentWorkshopId(location.pathname),
          role: user?.role || null,
        },
      });

      const data = response.data?.data || response.data;

      if (data?.conversationId) {
        setConversationId(data.conversationId);
      }

      const aiMessage: AIChatMessage = {
        id: `ai-${clientMessageId}`,
        clientMessageId,
        role: 'AI',
        content: data?.reply || 'Mình chưa có phản hồi phù hợp.',
        createdAt: new Date().toISOString(),
        intent: data?.intent,
        resultMode: data?.resultMode,
        isOutOfScope: data?.isOutOfScope,
        recommendations: data?.recommendations || [],
        itinerary: data?.itinerary || null,
        quickReplies: data?.quickReplies || [],
      };

      setMessages((prev) => appendUniqueMessage(prev, aiMessage));
    } catch (err: any) {
      const errorMessage: AIChatMessage = {
        id: `ai-error-${clientMessageId}`,
        clientMessageId,
        role: 'AI',
        content: err.response?.data?.message || 'AI đang bận hoặc chưa thể phản hồi. Vui lòng thử lại sau.',
        createdAt: new Date().toISOString(),
        resultMode: 'ERROR',
        quickReplies: ['Thử lại'],
      };
      setMessages((prev) => appendUniqueMessage(prev, errorMessage));
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendText(input);
  };

  const handleQuickReply = (text: string) => {
    handleSendText(text);
  };

  // ─── Render ─────────────────────────────────────────────────────

  // Hide on auth pages
  const hideOnPages = ['/login', '/register', '/forgot-password'];
  if (hideOnPages.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <>
      {/* ── Chat Window ─────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[390px] h-[580px] max-sm:bottom-0 max-sm:right-0 max-sm:w-full max-sm:h-[85vh] max-sm:rounded-t-3xl max-sm:rounded-b-none bg-white rounded-3xl shadow-2xl border border-[#E6DED5] flex flex-col overflow-hidden animate-[slideUp_0.25s_ease-out]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#A65A3A] to-[#C2784E] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">CraftLocal AI</h3>
                <p className="text-white/70 text-[10px]">Tư vấn workshop & lịch trình</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 bg-[#FAF7F2]">
            {messages.length === 0 ? (
              /* Welcome */
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-[#A65A3A]/10 flex items-center justify-center mb-4">
                  <Sparkles size={28} className="text-[#A65A3A]" />
                </div>
                <h4 className="font-bold text-[#2F2722] text-base mb-1">Xin chào! 👋</h4>
                <p className="text-[#7A6A5E] text-xs leading-relaxed mb-5">
                  Mình là trợ lý AI của CraftLocal. Hãy hỏi mình về workshop, lịch trình, đặt vé — bất cứ điều gì!
                </p>
                <AIQuickReplies
                  quickReplies={INITIAL_QUICK_REPLIES}
                  onSelect={handleQuickReply}
                  disabled={isSending}
                />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <AIMessageBubble
                    key={msg.id}
                    message={msg}
                    onQuickReply={handleQuickReply}
                    isSending={isSending}
                  />
                ))}

                {/* Typing indicator */}
                {isSending && (
                  <div className="flex justify-start mb-3">
                    <div className="px-4 py-3 bg-white border border-[#E6DED5] rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-[#A65A3A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-[#A65A3A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-[#A65A3A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[10px] text-[#7A6A5E] ml-1">AI đang trả lời...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="px-3 py-2.5 border-t border-[#E6DED5] bg-white shrink-0"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi AI về workshop, lịch trình..."
                disabled={isSending}
                className="flex-1 px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E6DED5] rounded-xl text-sm text-[#2F2722] placeholder:text-[#B0A69E] focus:outline-none focus:ring-2 focus:ring-[#A65A3A]/30 focus:border-[#A65A3A]/40 disabled:opacity-50 transition"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="w-10 h-10 rounded-xl bg-[#A65A3A] text-white flex items-center justify-center hover:bg-[#8e492b] disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Floating Button ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bg-[#2F2722] rotate-0'
            : 'bg-[#A65A3A] hover:shadow-[0_8px_30px_rgba(166,90,58,0.4)]'
        }`}
        aria-label={isOpen ? 'Đóng chat AI' : 'Mở chat AI'}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
      </button>

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default AIChatWidget;
