import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../../../core/api/api-client';
import { useAuth } from '../../../core/auth/AuthContext';
import { signalrService } from '../../../core/services/signalrService';

interface ChatSender {
  userId: string;
  name: string;
  role: string;
  photoUrl?: string | null;
}

interface ChatMessageItem {
  id: string;
  conversationId: string;
  sender: ChatSender;
  body: string;
  createdAt: string;
  status?: string;
}

interface Participant {
  userId: string;
  name: string;
  role: string;
  photoUrl?: string | null;
}

interface ConversationItem {
  id: string;
  type: number; // 0=Direct/Classroom, 1=AdminSupport
  title: string;
  childId?: string | null;
  childName?: string | null;
  unreadCount: number;
  lastMessage?: {
    preview: string;
    senderName: string;
    at: string;
  } | null;
  participants: Participant[];
}

interface ChildOption {
  id: string;
  firstName: string;
  lastName: string;
  classroomName?: string;
}

interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  staffRole?: string;
  email?: string;
}

export const AdminChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'parents' | 'staff'>('all');

  // New Message Modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [recipientType, setRecipientType] = useState<'parent' | 'staff'>('parent');
  const [childrenList, setChildrenList] = useState<ChildOption[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isCreatingModal, setIsCreatingModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await apiClient.get<ConversationItem[]>('/api/chat/conversations');
      if (Array.isArray(res)) {
        setConversations(res);
        if (!selectedConvoId && res.length > 0) {
          setSelectedConvoId(res[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConvos(false);
    }
  }, [selectedConvoId]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // SignalR message listener
  useEffect(() => {
    signalrService.start().catch(() => {});

    const unsubscribe = signalrService.onReceiveMessage((incoming: any) => {
      const convId = incoming.conversationId || (incoming.target || '').replace('conversation:', '');
      if (convId === selectedConvoId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id || (incoming.clientId && (m as any).clientId === incoming.clientId))) {
            return prev;
          }
          return [
            ...prev,
            {
              id: incoming.id || `msg-${Date.now()}`,
              conversationId: convId,
              sender: {
                userId: incoming.senderId || 'other',
                name: incoming.senderName || 'Sender',
                role: incoming.senderRole || 'User',
              },
              body: incoming.content || incoming.message || '',
              createdAt: incoming.sentAt || new Date().toISOString(),
              status: 'sent',
            },
          ];
        });
        setTimeout(scrollToBottom, 50);
      }

      // Also update conversations list preview
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            return {
              ...c,
              lastMessage: {
                preview: incoming.content || incoming.message || '',
                senderName: incoming.senderName || 'Sender',
                at: incoming.sentAt || new Date().toISOString(),
              },
              unreadCount: convId === selectedConvoId ? 0 : c.unreadCount + 1,
            };
          }
          return c;
        })
      );
    });

    return () => {
      unsubscribe();
    };
  }, [selectedConvoId]);

  // Fetch messages when selected conversation changes
  useEffect(() => {
    if (!selectedConvoId) return;

    setIsLoadingMessages(true);
    signalrService.invoke('JoinGroup', `conversation:${selectedConvoId}`).catch(() => {});

    apiClient
      .get<ChatMessageItem[]>(`/api/chat/conversations/${selectedConvoId}/messages`)
      .then((res) => {
        if (Array.isArray(res)) {
          setMessages(res);
        }
        apiClient.post(`/api/chat/conversations/${selectedConvoId}/read`, {}).catch(() => {});
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConvoId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch((err) => console.error('Failed to load messages:', err))
      .finally(() => {
        setIsLoadingMessages(false);
        setTimeout(scrollToBottom, 100);
      });

    return () => {
      signalrService.invoke('LeaveGroup', `conversation:${selectedConvoId}`).catch(() => {});
    };
  }, [selectedConvoId]);

  // Load children and staff for modal
  useEffect(() => {
    if (showNewModal) {
      apiClient.get<any[]>('/api/children').then((data) => {
        if (Array.isArray(data)) {
          setChildrenList(
            data.map((c) => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              classroomName: c.classroomName || c.classroom?.name,
            }))
          );
          if (data.length > 0 && !selectedChildId) {
            setSelectedChildId(data[0].id);
          }
        }
      }).catch(console.error);

      apiClient.get<any[]>('/api/staff').then((data) => {
        if (Array.isArray(data)) {
          setStaffList(
            data.map((s) => ({
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              staffRole: s.staffRole,
              email: s.email,
            }))
          );
          if (data.length > 0 && !selectedStaffId) {
            setSelectedStaffId(data[0].id);
          }
        }
      }).catch(console.error);
    }
  }, [showNewModal, selectedChildId, selectedStaffId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConvoId || isSending) return;

    const body = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Optimistic UI append
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessageItem = {
      id: tempId,
      conversationId: selectedConvoId,
      sender: {
        userId: user?.id || 'current-user',
        name: user ? `${user.firstName} ${user.lastName}`.trim() : 'Administration',
        role: user?.role || 'Admin',
      },
      body,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 50);

    try {
      const savedMsg = await apiClient.post<ChatMessageItem>(
        `/api/chat/conversations/${selectedConvoId}/messages`,
        { body, clientId: tempId }
      );
      if (savedMsg && savedMsg.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...savedMsg, status: 'sent' } : m))
        );
      }
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateModalConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMessage.trim() || isCreatingModal) return;

    setIsCreatingModal(true);
    try {
      let payload: any = {
        title: modalTitle.trim() || (recipientType === 'parent' ? 'Family Inquiry' : 'Staff Collaboration'),
        initialMessage: modalMessage.trim(),
        type: recipientType === 'parent' ? 1 : 0,
      };

      if (recipientType === 'parent' && selectedChildId) {
        payload.childId = selectedChildId;
        const matchedChild = childrenList.find((c) => c.id === selectedChildId);
        if (matchedChild && !modalTitle.trim()) {
          payload.title = `Admin Support: ${matchedChild.firstName} ${matchedChild.lastName}`;
        }
      } else if (recipientType === 'staff' && selectedStaffId) {
        payload.recipientStaffId = selectedStaffId;
        payload.targetUserId = selectedStaffId;
      }

      const res = await apiClient.post<ConversationItem>('/api/chat/conversations', payload);
      if (res && res.id) {
        setShowNewModal(false);
        setModalTitle('');
        setModalMessage('');
        await fetchConversations();
        setSelectedConvoId(res.id);
      }
    } catch (err) {
      console.error('Failed to create conversation from modal:', err);
      alert('Unable to start conversation. Please try again.');
    } finally {
      setIsCreatingModal(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (filter === 'parents' && c.type !== 1 && !c.childName && !c.childId) return false;
    if (filter === 'staff' && (c.type === 1 || c.childName)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchChild = c.childName?.toLowerCase().includes(q);
      const matchSnippet = c.lastMessage?.preview.toLowerCase().includes(q);
      return matchTitle || matchChild || matchSnippet;
    }
    return true;
  });

  const activeConvo = conversations.find((c) => c.id === selectedConvoId);

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
      {/* LEFT COLUMN: Conversation List */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 dark:border-slate-800 shrink-0">
        {/* Header & New Message button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-600">forum</span>
              <span>Messages & Chat</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">Direct center communication</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/60">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by child, parent, or note..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('parents')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filter === 'parents'
                  ? 'bg-primary-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Parents & Children
            </button>
            <button
              type="button"
              onClick={() => setFilter('staff')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filter === 'staff'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Staff
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {isLoadingConvos ? (
            <div className="p-8 text-center">
              <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <span className="material-symbols-outlined text-[32px] text-slate-300 dark:text-slate-600 mb-1 block">
                chat_bubble_outline
              </span>
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = c.id === selectedConvoId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedConvoId(c.id)}
                  className={`w-full p-3.5 text-left transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-primary-50/80 dark:bg-primary-950/40 border-l-4 border-l-primary-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-black text-sm shrink-0">
                    {c.childName ? c.childName[0] : c.title[0] || 'C'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {c.title}
                      </span>
                      {c.lastMessage?.at && (
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {new Date(c.lastMessage.at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    {/* Child Badge if linked */}
                    {c.childName && (
                      <div className="mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300/60 dark:border-amber-800/60">
                          <span>👦 Child:</span>
                          <span className="truncate">{c.childName}</span>
                        </span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {c.lastMessage?.preview || 'No messages yet'}
                    </p>
                  </div>

                  {c.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Thread */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
        {activeConvo ? (
          <>
            {/* Thread Header */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-black text-sm shrink-0">
                  {activeConvo.childName ? activeConvo.childName[0] : activeConvo.title[0] || 'C'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {activeConvo.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-[10px] font-bold shrink-0">
                      {activeConvo.type === 1 ? 'Admin Support' : 'Standard'}
                    </span>
                  </div>

                  {/* Child context banner */}
                  {activeConvo.childName && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Associated Child: {activeConvo.childName}
                      </span>
                      <span>•</span>
                      <span>
                        Participants:{' '}
                        {activeConvo.participants.map((p) => p.name).join(', ') || 'Parent'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={fetchConversations}
                  title="Refresh chat"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">refresh</span>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
              {isLoadingMessages ? (
                <div className="p-8 text-center">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No messages yet. Send a note below to start chatting.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender.userId === user?.id || m.sender.role.toLowerCase() === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 font-medium px-1">
                        <span>{m.sender.name}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {m.sender.role}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-primary-600 text-white rounded-tr-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs'
                        }`}
                      >
                        {m.body}
                      </div>

                      {m.status === 'pending' && (
                        <span className="text-[10px] text-slate-400 mt-0.5">Sending...</span>
                      )}
                      {m.status === 'failed' && (
                        <span className="text-[10px] text-rose-500 mt-0.5">Failed to deliver</span>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Reply regarding ${activeConvo.childName ? activeConvo.childName : activeConvo.title}...`}
                  className="flex-1 h-11 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="h-11 px-5 rounded-2xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <span className="material-symbols-outlined text-[32px]">chat</span>
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No conversation selected
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Choose an active thread from the list or start a new conversation with parents or staff.
            </p>
          </div>
        )}
      </div>

      {/* NEW MESSAGE MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-600">edit_square</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Start New Conversation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateModalConversation} className="space-y-4">
              {/* Recipient Type Segment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Recipient Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecipientType('parent')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      recipientType === 'parent'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    👦 Parent / Child
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('staff')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      recipientType === 'staff'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    👩‍🏫 Staff Member
                  </button>
                </div>
              </div>

              {/* Conditional dropdown */}
              {recipientType === 'parent' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Select Child & Family
                  </label>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.classroomName || 'Classroom'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Select Staff Member
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.staffRole || s.email || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Schedule Update, Health Note, or General Check-in"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Initial Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={modalMessage}
                  onChange={(e) => setModalMessage(e.target.value)}
                  placeholder="Write your note..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!modalMessage.trim() || isCreatingModal}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreatingModal ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Create & Open</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
