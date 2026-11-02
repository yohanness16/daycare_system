import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { ChatMessage, ConversationSummary } from '../types/parent';
import { ChatBubble } from '../components/ChatBubble';
import { QuickReplies } from '../components/QuickReplies';
import { signalrService } from '../../../core/services/signalrService';

export const ParentChatThreadPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!conversationId) return;
    setIsLoading(true);

    // 1. Initial REST fetch for message history
    Promise.all([
      parentApi.getMessages(conversationId),
      parentApi.getConversations(),
    ])
      .then(([msgs, convos]) => {
        setMessages(msgs);
        const match = convos.find((c) => c.id === conversationId) || null;
        setConversation(match);
        parentApi.markConversationRead(conversationId);
      })
      .catch(console.error)
      .finally(() => {
        setIsLoading(false);
        setTimeout(scrollToBottom, 100);
      });

    // 2. Connect to SignalR and join the conversation channel
    signalrService.start().then(() => {
      signalrService.invoke('JoinGroup', `conversation:${conversationId}`).catch(() => {});
    });

    // 3. Listen for incoming real-time messages
    const unsubscribe = signalrService.onReceiveMessage((incoming) => {
      const incomingConvId = (incoming as any).conversationId || ((incoming as any).target || '').replace('conversation:', '');
      if (incomingConvId === conversationId) {
        setMessages((prev) => {
          // Prevent duplicates if already present
          if (prev.some((m) => m.id === incoming.id || (incoming.clientId && m.clientId === incoming.clientId))) {
            return prev.map((m) => (incoming.clientId && m.clientId === incoming.clientId ? { ...m, id: incoming.id || m.id, status: 'sent' } : m));
          }
          const newIncoming: ChatMessage = {
            id: incoming.id || `msg-${Date.now()}`,
            conversationId,
            clientId: String((incoming as any).clientId || ''),
            sender: {
              userId: (incoming as any).senderId || 'other',
              name: (incoming as any).senderName || 'Staff',
              role: ((incoming as any).senderRole as any) || 'Staff',
            },
            type: 0,
            body: incoming.content || (incoming as any).message || '',
            attachments: [],
            createdAt: new Date((incoming as any).sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isDeleted: false,
            status: 'sent',
          };
          return [...prev, newIncoming];
        });
        setTimeout(scrollToBottom, 50);
      }
    });

    return () => {
      unsubscribe();
      signalrService.invoke('LeaveGroup', `conversation:${conversationId}`).catch(() => {});
    };
  }, [conversationId]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !conversationId) return;

    const text = inputText;
    const currentReply = replyTo;
    setInputText('');
    setReplyTo(null);

    // Optimistic message append
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      clientId: `client-${Date.now()}`,
      sender: {
        userId: 'current-parent',
        name: 'You',
        role: 'Parent',
      },
      type: 0,
      body: text,
      replyTo: currentReply ? { id: currentReply.id, preview: currentReply.body } : null,
      attachments: [],
      createdAt: 'Just now',
      isDeleted: false,
      status: 'sending',
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const confirmed = await parentApi.sendMessage(
        conversationId,
        text,
        currentReply?.id
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...confirmed, status: 'sent' } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...m, status: 'failed' } : m))
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-200">
      {/* 1. Thread Header */}
      <div className="p-3.5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between gap-3 shrink-0 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/parent/messages"
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
              {conversation?.title || 'Classroom Team'}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              Replies within working hours (7:00 AM – 6:00 PM)
            </p>
          </div>
        </div>

        <Link
          to="/parent/complaints/new"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shrink-0 hidden sm:inline"
        >
          Raise Formal Concern
        </Link>
      </div>

      {/* 2. Message History Pane */}
      <div className="flex-1 overflow-y-auto p-4 bg-white/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-1">
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-500 text-center max-w-sm mx-auto mb-4">
          🛡️ Messages in this classroom thread are recorded for quality and safety. For urgent issues, please call the main desk.
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center text-slate-400">
            <span className="material-symbols-outlined text-[28px] animate-spin">
              progress_activity
            </span>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              onReply={(m) => setReplyTo(m)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Replies Bar */}
      <div className="mt-2 shrink-0">
        <QuickReplies onSelect={(phrase) => setInputText((prev) => (prev ? `${prev} ${phrase}` : phrase))} />
      </div>

      {/* 4. Reply Quote Preview (if active) */}
      {replyTo && (
        <div className="mt-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-between text-xs border border-slate-200 dark:border-slate-700">
          <div className="min-w-0 pr-2">
            <span className="font-bold text-primary-600 block">
              Replying to {replyTo.sender.name}:
            </span>
            <p className="text-slate-600 dark:text-slate-400 truncate text-[11px]">
              {replyTo.body}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* 5. Sticky Composer Form */}
      <form onSubmit={handleSend} className="mt-2 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message to teachers..."
          className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-11 h-11 rounded-2xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white flex items-center justify-center transition-colors shadow-2xs shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </form>
    </div>
  );
};
