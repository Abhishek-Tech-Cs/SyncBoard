import React, { useState, useEffect, useRef } from 'react';
import { Hash, Lock, Send, MoreVertical, Edit2, Trash2, X, Check } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';
import { chatApi } from '../../api/chatApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { format } from 'date-fns';

export const ChatContainer = ({ channel }) => {
  const { user } = useAuth();
  const { socket, joinChannel, leaveChannel } = useSocket();
  const toast = useToast();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load channel messages
  useEffect(() => {
    if (!channel?._id) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const res = await chatApi.getMessages(channel._id);
        setMessages(res.data.messages || []);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [channel?._id]);

  // Socket room join & real-time message listeners
  useEffect(() => {
    if (!channel?._id) return;

    joinChannel(channel._id);

    if (socket) {
      const handleMessageSent = (newMessage) => {
        if (newMessage.channel === channel._id) {
          setMessages((prev) => [...prev, newMessage]);
          setTimeout(scrollToBottom, 50);
        }
      };

      const handleMessageUpdated = (updatedMessage) => {
        if (updatedMessage.channel === channel._id) {
          setMessages((prev) =>
            prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
          );
        }
      };

      const handleMessageDeleted = ({ messageId, channelId }) => {
        if (channelId === channel._id) {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        }
      };

      const handleTypingStart = ({ channelId, userId, userName }) => {
        if (channelId === channel._id && userId !== user._id) {
          setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
        }
      };

      const handleTypingStop = ({ channelId, userId }) => {
        if (channelId === channel._id) {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }
      };

      socket.on('message:sent', handleMessageSent);
      socket.on('message:updated', handleMessageUpdated);
      socket.on('message:deleted', handleMessageDeleted);
      socket.on('chat:typing_start', handleTypingStart);
      socket.on('chat:typing_stop', handleTypingStop);

      return () => {
        leaveChannel(channel._id);
        socket.off('message:sent', handleMessageSent);
        socket.off('message:updated', handleMessageUpdated);
        socket.off('message:deleted', handleMessageDeleted);
        socket.off('chat:typing_start', handleTypingStart);
        socket.off('chat:typing_stop', handleTypingStop);
      };
    }
  }, [channel?._id, socket, user._id]);

  // Handle typing indicator trigger
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socket && channel?._id) {
      socket.emit('chat:typing_start', { channelId: channel._id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:typing_stop', { channelId: channel._id });
      }, 1500);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');

    if (socket && channel?._id) {
      socket.emit('chat:typing_stop', { channelId: channel._id });
    }

    try {
      await chatApi.sendMessage(channel._id, { content });
    } catch (err) {
      toast.error('Failed to send message');
      setInputText(content);
    }
  };

  const handleSaveEdit = async (msgId) => {
    if (!editContent.trim()) return;
    try {
      await chatApi.editMessage(msgId, { content: editContent.trim() });
      setEditingMessageId(null);
      setEditContent('');
    } catch (err) {
      toast.error('Failed to update message');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await chatApi.deleteMessage(msgId);
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const isDM = channel.type === 'direct';
  const dmPartner = isDM
    ? channel.members?.find((m) => String(m._id || m) !== String(user?._id || user?.id))
    : null;

  const typingNames = Object.values(typingUsers);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden">
      {/* Channel Header */}
      <div className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {isDM ? (
            <Avatar name={dmPartner?.name || 'DM'} src={dmPartner?.avatar} size="xs" />
          ) : channel.type === 'private' ? (
            <Lock className="w-4 h-4 text-slate-400" />
          ) : (
            <Hash className="w-4 h-4 text-slate-400" />
          )}

          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {isDM ? dmPartner?.name || 'Direct Message' : channel.name}
          </h3>

          {channel.topic && (
            <span className="text-xs text-slate-400 hidden sm:inline-block ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {channel.topic}
            </span>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {loading && <div className="text-center text-xs text-slate-400 py-6">Loading messages...</div>}

        {!loading && messages.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            Start the conversation in #{channel.name}!
          </div>
        )}

        {messages.map((msg) => {
          const isSender = String(msg.sender?._id || msg.sender) === String(user?._id || user?.id);
          const isEditing = editingMessageId === msg._id;

          return (
            <div
              key={msg._id}
              className={`flex items-start gap-3 group ${
                isSender ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar name={msg.sender?.name} src={msg.sender?.avatar} size="sm" />

              <div
                className={`max-w-[80%] sm:max-w-md ${
                  isSender ? 'items-end' : 'items-start'
                } flex flex-col`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {msg.sender?.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}
                  </span>
                  {msg.isEdited && (
                    <span className="text-[10px] text-slate-400 italic">(edited)</span>
                  )}
                </div>

                {/* Message Bubble */}
                <div className="relative group/msg">
                  {isEditing ? (
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-indigo-400 shadow-md">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="text-xs px-2 py-1 outline-none bg-transparent w-full text-slate-800 dark:text-slate-100"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(msg._id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isSender
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-800/80'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}

                  {/* Actions (Edit / Delete) */}
                  {isSender && !isEditing && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2 opacity-0 group-hover/msg:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingMessageId(msg._id);
                          setEditContent(msg.content);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700"
                        title="Edit message"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator banner */}
      {typingNames.length > 0 && (
        <div className="px-6 py-1 text-[11px] text-slate-400 italic">
          {typingNames.join(', ')} {typingNames.length > 1 ? 'are' : 'is'} typing...
        </div>
      )}

      {/* Message Input Bar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message #${isDM ? dmPartner?.name || 'chat' : channel.name}...`}
            value={inputText}
            onChange={handleInputChange}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-colors shadow-md shadow-indigo-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

