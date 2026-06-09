import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Send, User, MessageSquare, AlertCircle, Calendar } from 'lucide-react';

const Chat = ({ onPageChange, user, socket, pageParams = {} }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isSelfTyping = useRef(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages for chosen conversation
  const loadMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      const res = await api.getMessages(conversationId);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Error fetching messages:', err.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Load conversations list
  const fetchConversations = async (autoSelectRecipientId = null) => {
    try {
      setConversationsLoading(true);
      setError('');
      const res = await api.getConversations();
      const list = res.data || [];
      setConversations(list);

      // Query online status for all participants
      if (socket && list.length > 0) {
        const otherIds = list.map(c => {
          const other = c.participants.find(p => p._id !== user._id);
          return other ? other._id : null;
        }).filter(Boolean);
        socket.emit('check_online', otherIds);
      }

      // Handle auto-selection of conversation if recipientId is provided in URL/Params
      if (autoSelectRecipientId) {
        const found = list.find(c => 
          c.participants.some(p => p._id === autoSelectRecipientId)
        );
        if (found) {
          setActiveConv(found);
          loadMessages(found._id);
        } else {
          // If no conversation exists yet, try to fetch recipient details and show mock active room
          try {
            // Send empty message to establish conversation
            const mockMsgRes = await api.sendMessage(autoSelectRecipientId, 'Hello, I would like to inquire about the position.');
            // Re-load list
            const updatedRes = await api.getConversations();
            const updatedList = updatedRes.data || [];
            setConversations(updatedList);
            const newlyCreated = updatedList.find(c => 
              c.participants.some(p => p._id === autoSelectRecipientId)
            );
            if (newlyCreated) {
              setActiveConv(newlyCreated);
              loadMessages(newlyCreated._id);
            }
          } catch (err) {
            console.error('Failed to create starting conversation:', err.message);
          }
        }
      } else if (list.length > 0 && !activeConv) {
        // Auto-select first conversation
        setActiveConv(list[0]);
        loadMessages(list[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(pageParams.recipientId);
  }, [pageParams.recipientId]);

  // Join room and handle read status when activeConv changes
  useEffect(() => {
    if (socket && activeConv) {
      // Reset typing status when switching chats
      setIsOtherTyping(false);

      // Join the conversation room on socket
      socket.emit('joinConversation', activeConv._id);

      // Tell the other side we've read any unread messages
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const isMine = lastMsg.senderId === user._id || (lastMsg.sender?._id || lastMsg.sender) === user._id;
        if (!isMine && !lastMsg.readStatus) {
          socket.emit('messageRead', { conversationId: activeConv._id, messageId: lastMsg._id });
        }
      }
    }
  }, [socket, activeConv, messages.length]);

  // Listen to Socket events
  useEffect(() => {
    if (socket) {
      // Listen for real-time messages (handles both receiveMessage and new_message)
      const handleReceiveMessage = (msg) => {
        if (activeConv && msg.conversationId === activeConv._id) {
          // Avoid duplicate messages
          setMessages(prev => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, { ...msg, readStatus: true }];
          });

          // Mark as read in DB/socket
          socket.emit('messageRead', { conversationId: activeConv._id, messageId: msg._id });
        }

        // Refresh conversations list to update last message text and order
        api.getConversations().then(res => {
          setConversations(res.data || []);
        });
      };

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('new_message', handleReceiveMessage);

      // Listen for typing indicators
      socket.on('typing', ({ conversationId, userId }) => {
        if (activeConv && conversationId === activeConv._id && userId !== user._id) {
          setIsOtherTyping(true);
        }
      });

      socket.on('stopTyping', ({ conversationId, userId }) => {
        if (activeConv && conversationId === activeConv._id && userId !== user._id) {
          setIsOtherTyping(false);
        }
      });

      // Listen for read receipts
      socket.on('messageRead', ({ conversationId, messageId }) => {
        if (activeConv && conversationId === activeConv._id) {
          setMessages(prev => prev.map(m => {
            const isMsgTarget = m._id === messageId;
            const isUnreadSentMsg = (m.senderId === user._id || (m.sender?._id || m.sender) === user._id) && !m.readStatus;
            if (isMsgTarget || isUnreadSentMsg) {
              return { ...m, readStatus: true };
            }
            return m;
          }));
        }
      });

      // Listen for online/offline status changes
      socket.on('user_status', ({ userId, status }) => {
        setOnlineStatuses(prev => ({ ...prev, [userId]: status }));
      });

      // Listen for list responses of statuses
      socket.on('online_statuses', (statuses) => {
        setOnlineStatuses(prev => ({ ...prev, ...statuses }));
      });

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('new_message', handleReceiveMessage);
        socket.off('typing');
        socket.off('stopTyping');
        socket.off('messageRead');
        socket.off('user_status');
        socket.off('online_statuses');
      };
    }
  }, [socket, activeConv, user._id]);


  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    loadMessages(conv._id);
  };

  // Typing input field change handler
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (socket && activeConv) {
      if (!isSelfTyping.current) {
        isSelfTyping.current = true;
        socket.emit('typing', { conversationId: activeConv._id, userId: user._id });
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        isSelfTyping.current = false;
        socket.emit('stopTyping', { conversationId: activeConv._id, userId: user._id });
      }, 2000);
    }
  };

  // Dispatch message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const otherUser = activeConv.participants.find(p => p._id !== user._id);
    if (!otherUser) return;

    // Reset typing status immediately
    if (socket) {
      socket.emit('stopTyping', { conversationId: activeConv._id, userId: user._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      isSelfTyping.current = false;
    }

    try {
      const textToSend = inputText;
      setInputText('');
      
      // Send message via new room specific route
      const res = await api.sendChatMessage(activeConv._id, textToSend);
      const newMsg = res.data;

      // Append locally
      setMessages(prev => [...prev, newMsg]);

      // Broadcast message to room socket for instant delivery
      if (socket) {
        socket.emit('sendMessage', {
          _id: newMsg._id,
          conversationId: activeConv._id,
          sender: user._id,
          senderId: user._id,
          text: textToSend,
          createdAt: newMsg.createdAt,
          readStatus: false
        });
      }

      // Synchronize conversations list preview
      setConversations(prev => 
        prev.map(c => c._id === activeConv._id ? { ...c, lastMessage: newMsg, updatedAt: new Date() } : c)
      );
    } catch (err) {
      alert(err.message || 'Failed to deliver message.');
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    return conv.participants.find(p => p._id !== user._id);
  };

  if (conversationsLoading) return <LoadingSpinner />;

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', height: 'calc(100vh - 120px)', minHeight: '500px' }}>
      
      {error && (
        <div style={{ color: 'var(--error)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow)' }}>
        
        {/* Left Column: Conversations List */}
        <aside style={{ borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Chats</h2>
          </div>

          <div style={{ overflowY: 'auto', flexGrow: 1, padding: '0.5rem' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '0.75rem', margin: '0 auto' }} />
                <p>No active conversations.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isSelected = activeConv && activeConv._id === conv._id;
                const status = other ? (onlineStatuses[other._id] || 'offline') : 'offline';
                
                return (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConv(conv)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--sidebar-active-bg)' : 'transparent',
                      transition: 'all 0.2s ease',
                      borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent'
                    }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                        {other ? other.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                      </div>
                      <span 
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: status === 'online' ? 'var(--success)' : '#a1a1aa',
                          border: '2px solid var(--bg-secondary)'
                        }}
                      ></span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {other ? other.fullName : 'User'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {other ? other.role.charAt(0).toUpperCase() + other.role.slice(1) : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                        {conv.lastMessage ? conv.lastMessage.text : 'No messages yet.'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Chat Window */}
        <main style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              {(() => {
                const other = getOtherParticipant(activeConv);
                const status = other ? (onlineStatuses[other._id] || 'offline') : 'offline';
                return (
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--border-color)' }}>
                        {other ? other.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>{other ? other.fullName : 'User'}</span>
                        <span style={{ fontSize: '0.75rem', color: isOtherTyping ? 'var(--accent)' : status === 'online' ? 'var(--success)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isOtherTyping ? 'var(--accent)' : status === 'online' ? 'var(--success)' : '#a1a1aa', display: 'inline-block' }}></span>
                          {isOtherTyping ? 'Typing...' : status === 'online' ? 'Active now' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Messages Stream */}
              <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messagesLoading ? (
                  <LoadingSpinner />
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user._id || (msg.sender?._id || msg.sender) === user._id;
                    return (
                      <div 
                        key={msg._id}
                        style={{
                          display: 'flex',
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                          width: '100%'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '65%',
                            padding: '0.75rem 1rem',
                            borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            backgroundColor: isMine ? 'var(--accent)' : 'var(--bg-secondary)',
                            color: isMine ? '#111111' : 'var(--text-primary)',
                            border: isMine ? 'none' : '1px solid var(--border-color)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.15rem'
                          }}
                        >
                          <p style={{ fontSize: '0.9rem', lineHeight: 1.4, wordBreak: 'break-word' }}>{msg.text}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', opacity: 0.8 }}>
                            <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && (
                              <span 
                                style={{ 
                                  fontSize: '0.75rem', 
                                  color: msg.readStatus ? '#3b82f6' : 'var(--text-secondary)',
                                  fontWeight: 'bold',
                                  display: 'inline-flex'
                                }}
                                title={msg.readStatus ? 'Read' : 'Delivered'}
                              >
                                {msg.readStatus ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Text Input Panel */}
              <form onSubmit={handleSend} style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={inputText}
                  onChange={handleInputChange}
                  style={{
                    flexGrow: 1,
                    border: '1px solid var(--border-color)',
                    borderRadius: '100px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#111111',
                    transition: 'all 0.2s ease',
                    opacity: inputText.trim() ? 1 : 0.6
                  }}
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3 style={{ fontWeight: 800 }}>Start a Conversation</h3>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Select a chat thread from the list to begin messaging.</p>
            </div>
          )}
        </main>

      </div>

    </div>
  );
};

export default Chat;
