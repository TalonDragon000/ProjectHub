import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Conversation, Message, Profile } from '../types';
import { format, isToday, isThisWeek } from 'date-fns';

export default function MessagesView() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showConversationList, setShowConversationList] = useState(true);

  useEffect(() => {
    if (profile) {
      loadConversations();
    }
  }, [profile]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      markMessagesAsRead(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!profile || !activeConversation) return;

    const channel = supabase
      .channel(`messages:${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .maybeSingle();

          setMessages((prev) => [...prev, { ...newMsg, sender: senderProfile || undefined }]);

          if (newMsg.receiver_id === profile.id) {
            markMessagesAsRead(activeConversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *, 
        participant_1:profiles!conversations_participant_1_id_fkey(*), participant_2:profiles!conversations_participant_2_id_fkey(*)
        `)
      .or(`participant_1_id.eq.${profile.id},participant_2_id.eq.${profile.id}`)
      .order('last_message_at', { ascending: false });

    if (data && !error) {
      const conversationsWithUnread = await Promise.all(
        data.map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('receiver_id', profile.id)
            .eq('is_read', false);

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            unread_count: count || 0,
            last_message: lastMsg?.content || '',
          };
        })
      );

      setConversations(conversationsWithUnread);
    }

    setLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data && !error) {
      setMessages(data);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!profile) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', profile.id)
      .eq('is_read', false);

    loadConversations();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !profile) return;

    setSending(true);

    const otherParticipantId =
      activeConversation.participant_1_id === profile.id
        ? activeConversation.participant_2_id
        : activeConversation.participant_1_id;

    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConversation.id,
      sender_id: profile.id,
      receiver_id: otherParticipantId,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
      loadConversations();
    }

    setSending(false);
  };

  const getOtherParticipant = (conversation: Conversation): Profile | undefined => {
    if (!profile) return undefined;
    return conversation.participant_1_id === profile.id
      ? conversation.participant_2
      : conversation.participant_1;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isThisWeek(date)) {
      return format(date, 'EEE h:mm a');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-slate-600">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div
        className={`${
          showConversationList ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-80 border-r border-slate-200`}
      >
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-600 mb-2">No conversations yet</p>
              <p className="text-sm text-slate-500">
                Visit a user's profile and click "Send Message" to start chatting
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {conversations.map((conv) => {
                const otherUser = getOtherParticipant(conv);
                if (!otherUser) return null;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConversation(conv);
                      setShowConversationList(false);
                    }}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                      activeConversation?.id === conv.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                        {otherUser.avatar_url ? (
                          <img
                            src={otherUser.avatar_url}
                            alt={otherUser.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{getInitials(otherUser.display_name)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {otherUser.display_name}
                          </h3>
                          {conv.unread_count && conv.unread_count > 0 ? (
                            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                              {conv.unread_count}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-600 truncate">{conv.last_message}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatMessageTime(conv.last_message_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div
        className={`${
          showConversationList ? 'hidden' : 'flex'
        } md:flex flex-col flex-1`}
      >
        {activeConversation ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center space-x-3">
              <button
                onClick={() => setShowConversationList(true)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                {getOtherParticipant(activeConversation)?.avatar_url ? (
                  <img
                    src={getOtherParticipant(activeConversation)!.avatar_url}
                    alt={getOtherParticipant(activeConversation)!.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {getInitials(getOtherParticipant(activeConversation)!.display_name)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {getOtherParticipant(activeConversation)?.display_name}
                </h3>
                <p className="text-sm text-slate-500">
                  @{getOtherParticipant(activeConversation)?.username}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isSender = message.sender_id === profile?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isSender
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isSender ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-600 mb-2">No conversation selected</p>
              <p className="text-sm text-slate-500">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
