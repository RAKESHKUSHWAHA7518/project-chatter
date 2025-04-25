import { useState, useEffect, useRef } from 'react';
import { authenticate, fetchUsers, fetchChatMessages, sendMessage } from '../api/fancentro';
import axios from 'axios';

function MessageItem({ message, isDark }) {
  if (!message?.data?.text && !message?.attachmentInfo) {
    return null;
  }

  const date = new Date(message.timestamp * 1000);
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isOwnMessage = message.authorExternalId === MODEL_TOKEN;

  const renderAttachment = (attachmentInfo) => {
    const { resourceMap, message: attachmentMessage } = attachmentInfo;
    
    if (!resourceMap || resourceMap.length === 0) {
      return attachmentMessage ? (
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {attachmentMessage}
        </p>
      ) : null;
    }

    return (
      <div className="space-y-4">
        {attachmentMessage && (
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {attachmentMessage}
          </p>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          {resourceMap.map((resource, index) => {
            const { resourceInfo, thumbs, type } = resource;

            if (resourceInfo.mediaType === 'image') {
              return (
                <div key={resource.id} className="relative">
                  <img 
                    src={thumbs?.w450_h600l} 
                    alt={`Image attachment ${index + 1}`}
                    className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                    onClick={() => window.open(thumbs?.w450_h600l, '_blank')}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    {resourceInfo.width}x{resourceInfo.height}
                  </div>
                </div>
              );
            }

            if (resourceInfo.mediaType === 'video') {
              return (
                <div key={resource.id} className="relative">
                  <div className="aspect-w-16 aspect-h-9">
                    <video 
                      controls 
                      className="w-full rounded-lg"
                      style={{ maxHeight: '300px' }}
                      preload="metadata"
                      poster={thumbs?.w450_h600l}
                    >
                      <source src={thumbs?.original} type={`video/${resourceInfo.mediaSubType}`} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  {resourceInfo.duration && (
                    <div className="mt-2 text-xs text-gray-500">
                      Duration: {resourceInfo.duration}s
                      {resourceInfo.format && ` • ${resourceInfo.format}p`}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    );
  };

  const renderMessageContent = () => {
    const content = [];

    if (message.type === 'text' && message.data?.text) {
      content.push(
        <p key="text" className="text-sm break-words mb-2">
          {decodeURIComponent(message.data.text)}
        </p>
      );
    }

    if (message.type === 'attachment' && message.attachmentInfo) {
      content.push(
        <div key="attachment" className="max-w-full">
          {renderAttachment(message.attachmentInfo)}
        </div>
      );
    }

    return content.length > 0 ? content : null;
  };

  const messageContent = renderMessageContent();
  if (!messageContent) return null;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${
        isOwnMessage
          ? isDark
            ? 'bg-blue-600 text-white'
            : 'bg-blue-500 text-white'
          : isDark
          ? 'bg-gray-700 text-gray-200'
          : 'bg-gray-200 text-gray-900'
      }`}>
        {messageContent}
        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {formattedTime}
        </p>
      </div>
    </div>
  );
}

function UserList({ users, selectedUserId, onUserSelect, isDark }) {
  const sortedUsers = Object.entries(users).sort(([, userA], [, userB]) => {
    const timeA = userA.lastMessageTimestamp || 0;
    const timeB = userB.lastMessageTimestamp || 0;
    return timeB - timeA;
  });

  const getResponseStatus = (lastMessageTime) => {
    if (!lastMessageTime) return 'normal';
    
    const timeDiff = (Date.now() / 1000) - lastMessageTime;
    const minutesDiff = Math.floor(timeDiff / 60);
    
    if (minutesDiff >= 15) return 'critical';
    if (minutesDiff >= 10) return 'warning';
    return 'normal';
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const minutes = Math.floor((Date.now() / 1000 - timestamp) / 60);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'Over a day ago';
  };

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden h-full`}>
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Active Conversations
        </h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {sortedUsers.map(([userId, user]) => {
          const responseStatus = getResponseStatus(user.lastMessageTimestamp);
          const statusColors = {
            critical: isDark ? 'bg-red-500' : 'bg-red-500',
            warning: isDark ? 'bg-yellow-500' : 'bg-yellow-500',
            normal: isDark ? 'bg-green-500' : 'bg-green-500'
          };

          return (
            <button
              key={userId}
              onClick={() => onUserSelect(userId)}
              className={`w-full text-left p-4 transition-colors relative ${
                selectedUserId === userId
                  ? isDark
                    ? 'bg-gray-700'
                    : 'bg-gray-100'
                  : isDark
                  ? 'hover:bg-gray-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`absolute right-2 top-2 w-2 h-2 rounded-full ${statusColors[responseStatus]}`} />
              <div className="flex items-center gap-3">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                    }}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {user?.name || 'Unknown User'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Last active: {formatLastActive(user.lastMessageTimestamp)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChatView({ messages, selectedUser, isDark, loading, error, onSendMessage }) {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      await onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  if (!selectedUser) {
    return (
      <div className={`h-full flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Select a conversation to start chatting
      </div>
    );
  }

  const validMessages = messages.filter(message => 
    (message.type === 'text' && message.data?.text) || 
    (message.type === 'attachment' && message.attachmentInfo)
  );

  return (
    <div className="h-full flex flex-col">
      <div className={`p-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
          {selectedUser.avatar ? (
            <img 
              src={selectedUser.avatar} 
              alt={selectedUser.name} 
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=random`;
              }}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              {selectedUser.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedUser.name}
            </p>
            {/* <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Active now
            </p> */}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        {loading ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading messages...
          </div>
        ) : error ? (
          <div className={`p-4 rounded-lg ${
            isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
          }`}>
            {error}
          </div>
        ) : validMessages.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No messages yet
          </div>
        ) : (
          <div className="space-y-4">
            {validMessages.map((message, index) => (
              <MessageItem 
                key={`${message.timestamp}-${index}`}
                message={message}
                isDark={isDark}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 px-4 py-2 rounded-lg ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`px-4 py-2 rounded-lg ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            📎
          </button>
           <button
            type="submit"
            className={`px-4 py-2 rounded-lg ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
          >
            Send
          </button> 
        </form>
      </div> */}
    </div>
  );
}

const MODEL_TOKEN = '7089ba0426640fccf726c6774b9ada83';

export default function ChatPage({ isDark }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const sendTelegramAlert = async (user) => {
    try {
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
      
      const message = `⚠️ Response Time Alert\n\nUser: ${user.name}\nLast Active: ${
        new Date(user.lastMessageTimestamp * 1000).toLocaleString()
      }\nNo response for over 15 minutes!`;
      
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Error sending Telegram alert:', error);
    }
  };

  const checkResponseTimes = async () => {
    const now = Date.now() / 1000;
    
    Object.entries(users).forEach(([userId, user]) => {
      if (user.lastMessageTimestamp) {
        const timeDiff = now - user.lastMessageTimestamp;
        const minutesDiff = Math.floor(timeDiff / 60);
        
        if (minutesDiff >= 15) {
          sendTelegramAlert(user);
        }
      }
    });
  };

  const getValidMessages = (messages) => {
    return messages.filter(message => 
      (message.type === 'text' && message.data?.text) || 
      (message.type === 'attachment' && message.attachmentInfo)
    );
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const token = await authenticate();
        setAuthToken(token);
        
        const userData = await fetchUsers(token);
        setUsers(userData.collection || {});
        
        const firstUserId = Object.keys(userData.collection)[0];
        if (firstUserId) {
          setSelectedUserId(firstUserId);
          const chatMessages = await fetchChatMessages(token, firstUserId);
          setMessages(getValidMessages(chatMessages));
        }
        
        setError(null);
      } catch (err) {
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(checkResponseTimes, 60000);
    return () => clearInterval(intervalId);
  }, [users]);

  const handleUserSelect = async (userId) => {
    try {
      setLoading(true);
      setSelectedUserId(userId);
      const chatMessages = await fetchChatMessages(authToken, userId);
      
      const validMessages = getValidMessages(chatMessages);
      
      if (validMessages.length > 0) {
        setUsers(prevUsers => ({
          ...prevUsers,
          [userId]: {
            ...prevUsers[userId],
            lastMessageTimestamp: validMessages[validMessages.length - 1].timestamp
          }
        }));
      }
      
      setMessages(validMessages);
      setError(null);
    } catch (err) {
      setError(`Failed to load messages: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message) => {
    try {
      await sendMessage(authToken, selectedUserId, message);
      const chatMessages = await fetchChatMessages(authToken, selectedUserId);
      setMessages(getValidMessages(chatMessages));
      
      setUsers(prevUsers => ({
        ...prevUsers,
        [selectedUserId]: {
          ...prevUsers[selectedUserId],
          lastMessageTimestamp: Math.floor(Date.now() / 1000)
        }
      }));
    } catch (err) {
      setError(`Failed to send message: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          FanCentro Chat
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        <div className="md:col-span-1 h-full">
          {Object.keys(users).length > 0 && (
            <UserList
              users={users}
              selectedUserId={selectedUserId}
              onUserSelect={handleUserSelect}
              isDark={isDark}
            />
          )}
        </div>
        <div className="md:col-span-3 h-full">
          <div className={`h-full rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <ChatView
              messages={messages}
              selectedUser={selectedUserId ? users[selectedUserId] : null}
              isDark={isDark}
              loading={loading}
              error={error}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}