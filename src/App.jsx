import { useState, useEffect } from 'react';
import { BellIcon, ChatBubbleLeftIcon, UserGroupIcon, ClockIcon, XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import ChatPage from './pages/ChatPage';
import AuthPage from './components/AuthPage';
import axios from 'axios';
import { authenticate, fetchUsers, fetchChatMessages } from './api/fancentro';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function StatCard({ icon: Icon, label, value, change, isDark }) {
  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 sm:p-6 rounded-xl border`}>
      <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
        <Icon className="w-5 h-5" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-xl sm:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
        {change && (
          <span className={`text-sm ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

function ChatterRow({ name, lastActive, chats, avgResponse, performance, avatar, isDark, onClick, onChatClick, responseStatus }) {
  const getStatusColor = () => {
    if (responseStatus === 'critical') return 'bg-red-500';
    if (responseStatus === 'warning') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 ${isDark ? 'hover:bg-gray-800/50 border-gray-700' : 'hover:bg-gray-50 border-gray-200'} border-b relative`}>
      <div className={`absolute right-2 top-2 w-2 h-2 rounded-full ${getStatusColor()}`} />
      <div 
        className="relative cursor-pointer"
        onClick={onClick}
      >
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
        <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 ${isDark ? 'border-gray-800' : 'border-white'}`}></div>
      </div>
      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div 
            className="cursor-pointer"
            onClick={onClick}
          >
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Last active {lastActive}</p>
          </div>
          <div 
            className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8 cursor-pointer"
            onClick={onClick}
          >
            <div className="text-center">
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{chats} chats</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending</div>
            </div>
            <div className="text-center">
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{avgResponse}</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Avg. Response</div>
            </div>
            <div className="w-full sm:w-32">
              <div className={`h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full`}>
                <div 
                  className="h-2 bg-blue-500 rounded-full" 
                  style={{ width: `${performance}%` }}
                ></div>
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Performance</div>
            </div>
          </div>
        </div>
      </div>
      {/* <button
        onClick={onChatClick}
        className={`px-4 py-2 rounded-lg ${
          isDark 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition-colors ml-auto`}
      >
        Send Message
      </button> */}
    </div>
  );
}

function Alert({ type, message, name, time, priority = "medium", isDark }) {
  const colors = {
    red: isDark ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200",
    yellow: isDark ? "bg-yellow-900/20 border-yellow-700" : "bg-yellow-50 border-yellow-200",
    blue: isDark ? "bg-blue-900/20 border-blue-700" : "bg-blue-50 border-blue-200"
  };

  const dotColors = {
    red: isDark ? "bg-red-400" : "bg-red-500",
    yellow: isDark ? "bg-yellow-400" : "bg-yellow-500",
    blue: isDark ? "bg-blue-400" : "bg-blue-500"
  };

  return (
    <div className={`${colors[type]} p-3 rounded-xl border mb-2`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColors[type]}`}></div>
          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{message}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            {priority}
          </span>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{time}</span>
        </div>
      </div>
      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{name}</span>
    </div>
  );
}

function AlertsModal({ isOpen, onClose, alerts, isDark }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden`}>
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">All Alerts</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Review and manage all system alerts
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-opacity-10 ${
                isDark ? 'hover:bg-white' : 'hover:bg-black'
              }`}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              {...alert}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatterDetailsModal({ isOpen, onClose, chatter, isDark }) {
  if (!isOpen || !chatter) return null;

  const getStatus = (name) => {
    if (name === "Emma Wilson") return "offline";
    if (name === "Alex Chen") return "busy";
    return "online";
  };

  const status = getStatus(chatter.name);
  const statusColors = {
    online: "bg-blue-500",
    offline: "bg-gray-500",
    busy: "bg-yellow-500"
  };

  const chatterData = {
    "James Rodriguez": {
      totalChats: 167,
      resolved: 152,
      responseTime: "2m",
      performance: "90%"
    },
    "Sarah Miller": {
      totalChats: 145,
      resolved: 133,
      responseTime: "3m",
      performance: "92%"
    },
    "Alex Chen": {
      totalChats: 120,
      resolved: 112,
      responseTime: "5m",
      performance: "88%"
    },
    "Emma Wilson": {
      totalChats: 98,
      resolved: 98,
      responseTime: "4m",
      performance: "95%"
    }
  };

  const stats = chatterData[chatter.name];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl w-full max-w-lg overflow-hidden`}>
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Chatter Details</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Detailed information about {chatter.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-opacity-10 ${
                isDark ? 'hover:bg-white' : 'hover:bg-black'
              }`}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <img src={chatter.avatar} alt={chatter.name} className="w-20 h-20 rounded-full" />
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-semibold">{chatter.name}</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${statusColors[status]} text-white mt-2`}>
                {status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Chats</h4>
              <p className="text-2xl font-semibold">{stats.totalChats}</p>
            </div>
            <div>
              <h4 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Resolved</h4>
              <p className="text-2xl font-semibold">{stats.resolved}</p>
            </div>
            <div>
              <h4 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Response Time</h4>
              <p className="text-2xl font-semibold">{stats.responseTime}</p>
            </div>
            <div>
              <h4 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Performance</h4>
              <p className="text-2xl font-semibold">{stats.performance}</p>
            </div>
          </div>

          <div>
            <h4 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Performance Trend</h4>
            <div className={`h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full`}>
              <div 
                className="h-2 bg-blue-500 rounded-full" 
                style={{ width: `${chatter.performance}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatHistoryModal({ isOpen, onClose, chatter, isDark }) {
  const [newMessage, setNewMessage] = useState('');
  const [userMessages, setUserMessages] = useState({});
  
  if (!isOpen || !chatter) return null;

  const sendToTelegram = async (message) => {
    try {
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
      
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: `From ${chatter.name}: ${message}`,
        parse_mode: 'HTML'
      });

      const newMessages = userMessages[chatter.name] || [];
      setUserMessages({
        ...userMessages,
        [chatter.name]: [...newMessages, {
          message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message to Telegram:', error);
      alert('Failed to send message to Telegram');
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendToTelegram(newMessage);
    }
  };

  const currentUserMessages = userMessages[chatter.name] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl w-full max-w-2xl h-[80vh] overflow-hidden flex flex-col`}>
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={chatter.avatar} alt={chatter.name} className="w-10 h-10 rounded-full" />
              <div>
                <h2 className="text-xl font-semibold">{chatter.name}</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Send Message
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-opacity-10 ${
                isDark ? 'hover:bg-white' : 'hover:bg-black'
              }`}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {currentUserMessages.map((msg, index) => (
              <div key={index} className="flex justify-end">
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 text-blue-100`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <form onSubmit={handleSend} className="flex gap-2">
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
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [selectedChatter, setSelectedChatter] = useState(null);
  const [selectedChatHistory, setSelectedChatHistory] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  const [chatters, setChatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setChatters([]);
        setAlerts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Never';
    console.log(timestamp);
    
    const minutes = Math.floor((Date.now() / 1000 - timestamp/1000) / 60);
    console.log('Minutes since last active:', minutes);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'Over a day ago';
  };

  const getValidMessages = async (userId, authToken) => {
    try {
      const messages = await fetchChatMessages(authToken, userId);
      return messages.filter(message => 
        (message.type === 'text' && message.data?.text) || 
        (message.type === 'attachment' && message.attachmentInfo)
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  const sendTelegramAlert = async (chatter, timeSinceResponse) => {
    try {
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
      
      const minutes = Math.floor(timeSinceResponse / 60);
      const message = `⚠️ Response Time Alert\n\nChatter: ${chatter.name}\nLast Active: ${formatLastActive(chatter.lastMessageTimestamp)}\nNo response for ${minutes} minutes!\nPending Messages: ${chatter.chats}`;
      
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Error sending Telegram alert:', error);
    }
  };

  useEffect(() => {
    const loadFanCentroData = async () => {
      try {
        setLoading(true);
        const token = await authenticate();
        const userData = await fetchUsers(token);
        
        const formattedChatters = await Promise.all(
          Object.entries(userData.collection || {}).map(async ([id, user]) => {
            const messages = await getValidMessages(id, token);
            console.log(id)
            // Find the last message from the current user
            const lastUserMessageIndex = messages.findLastIndex(msg => msg.authorExternalId === id);
            const lastUserMessage = lastUserMessageIndex !== -1 ? messages[lastUserMessageIndex] : null;
            const lastUserTimestamp = lastUserMessage?.timestamp || 0;
            
            // Count pending messages (only messages after our last response)
            const pendingCount = messages.reduce((count, msg) => {
              if (msg.authorExternalId !== user.id && msg.timestamp > lastUserTimestamp) {
                return count + 1;
              }
              return count;
            }, 0);
            
            // Get the last message timestamp for response time checking
            const lastMessage = messages[messages.length - 1];
            const lastMessageTimestamp = lastMessage?.timestamp || user.lastMessageTimestamp || 0;
            console.log(lastMessageTimestamp);
            
            // Check if we need to send an alert (if last message is not from user and >15 min old)
            if (lastMessage && lastMessage.authorExternalId !== user.id) {
              const timeSinceResponse = (Date.now() / 1000) - lastMessageTimestamp/1000;
              console.log('Time since last response:', timeSinceResponse);
              
              if (timeSinceResponse >= 900) { // 15 minutes = 900 seconds
                await sendTelegramAlert({ name: user.name, lastMessageTimestamp }, timeSinceResponse);
                
                // Add to alerts if not already present
                const alertExists = alerts.some(alert => alert.name === user.name && alert.type === 'red');
                if (!alertExists) {
                  setAlerts(prev => [{
                    type: "red",
                    message: `No response `,
                    name: user.name,
                    time: "Just now",
                    priority: "high"
                  }, ...prev]);
                }
              }
            }

            return {
              id,
              name: user.name || 'Unknown User',
              lastActive: formatLastActive(lastMessageTimestamp),
              chats: pendingCount,
              avgResponse: '5m',
              performance: 85,
              avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}`,
              lastMessageTimestamp,
              userId: user.id
            };
          })
        );

        // Only show chatters with pending messages
        setChatters(formattedChatters.filter(chatter => chatter.chats > 0));
      } catch (error) {
        console.error('Error loading FanCentro data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFanCentroData();
    const intervalId = setInterval(loadFanCentroData, 600000);
    return () => clearInterval(intervalId);
  }, []);

  if (!user) {
    return <AuthPage isDark={isDark} />;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        isDark={isDark}
      />
      
      <ChatterDetailsModal
        isOpen={selectedChatter !== null && selectedChatHistory === null}
        onClose={() => setSelectedChatter(null)}
        chatter={selectedChatter}
        isDark={isDark}
      />

      <ChatHistoryModal
        isOpen={selectedChatHistory !== null}
        onClose={() => setSelectedChatHistory(null)}
        chatter={selectedChatHistory}
        isDark={isDark}
      />

      <header className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                className="sm:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <ChatBubbleLeftIcon className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              <h1 className="text-xl font-semibold">Chatter Dashboard</h1>
              <nav className="hidden sm:flex items-center gap-4">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === 'dashboard'
                      ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                      : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentPage('chat')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === 'chat'
                      ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                      : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  FanCentro Chat
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsAlertsModalOpen(true)}
                className="relative"
              >
                <BellIcon className={`w-6 h-6 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'} transition-colors`} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {alerts.length}
                </span>
              </button>
              <button onClick={() => setIsDark(!isDark)}>
                {isDark ? (
                  <SunIcon className="w-6 h-6 text-gray-400 hover:text-gray-300 transition-colors" />
                ) : (
                  <MoonIcon className="w-6 h-6 text-gray-600 hover:text-gray-700 transition-colors" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {user.email}
                </span>
                <button
                  onClick={() => auth.signOut()}
                  className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'} hover:underline`}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <StatCard 
                icon={UserGroupIcon}
                label="Active Chatters"
                value={chatters.length.toString()}
                change={`+${chatters.filter(c => (Date.now() / 1000 - c.lastMessageTimestamp) < 300).length}`}
                isDark={isDark}
              />
              <StatCard 
                icon={ChatBubbleLeftIcon}
                label="Total Pending"
                value={chatters.reduce((sum, c) => sum + c.chats, 0).toString()}
                change="+12%"
                isDark={isDark}
              />
              <StatCard 
                icon={ClockIcon}
                label="Avg Response Time"
                value="4m"
                change="-2m"
                isDark={isDark}
              />
              <StatCard 
                icon={BellIcon}
                label="Overdue Alerts"
                value={alerts.length.toString()}
                change={`+${alerts.filter(a => a.type === 'red').length}`}
                isDark={isDark}
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 order-2 lg:order-1">
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border`}>
                  <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <h2 className="text-lg font-semibold">Active Chatters</h2>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                        <input
                          type="search"
                          placeholder="Search chatters..."
                          className={`px-4 py-2 ${
                            isDark 
                              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                          } border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto`}
                        />
                        <select className={`px-4 py-2 ${
                          isDark 
                            ? 'bg-gray-900 border-gray-700 text-white' 
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                          } border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto`}>
                          <option>Sort by</option>
                          <option>Most chats</option>
                          <option>Response time</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    {loading ? (
                      <div className="p-4 text-center">Loading chatters...</div>
                    ) : chatters.map((chatter) => (
                      <ChatterRow 
                        key={chatter.id}
                        {...chatter}
                        isDark={isDark}
                        onClick={() => setSelectedChatter(chatter)}
                        onChatClick={() => setSelectedChatHistory(chatter)}
                        responseStatus={
                          Date.now() / 1000 - chatter.lastMessageTimestamp >= 900
                            ? 'critical'
                            : Date.now() / 1000 - chatter.lastMessageTimestamp >= 600
                            ? 'warning'
                            : 'normal'
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-80 order-1 lg:order-2">
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-4`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Recent Alerts</h2>
                    <button 
                      onClick={() => setIsAlertsModalOpen(true)}
                      className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'} text-sm transition-colors`}
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-100px)] overflow-y-auto">
                    {alerts.map((alert, index) => (
                      <Alert
                        key={index}
                        {...alert}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <ChatPage isDark={isDark} />
        )}
      </main>
    </div>
  );
}