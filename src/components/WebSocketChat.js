'use client';

import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import styles from './Chat.module.css';

export default function WebSocketChat() {
  const [messages, setMessages] = useState([
    { id: 1, text: '你好！我是AI助手，通过WebSocket连接与你交流！', sender: 'ai', timestamp: null },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const currentMessageRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 在客户端mounted后设置时间戳，避免hydration错误
  useEffect(() => {
    setMessages((prev) => prev.map((msg) => (msg.timestamp === null ? { ...msg, timestamp: new Date() } : msg)));
  }, []);

  // 初始化WebSocket连接
  useEffect(() => {
    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const connectSocket = () => {
    setConnectionStatus('connecting');

    // 根据当前窗口端口选择Socket.IO服务器地址
    const currentPort = window.location.port;
    const socketUrl = currentPort === '3001' ? 'http://localhost:3000' : '';

    console.log('当前端口:', currentPort, '连接到:', socketUrl || 'same origin');

    // 尝试连接到Socket.IO服务器，优先尝试polling传输
    const newSocket = io(socketUrl, {
      path: '/api/socketio',
      transports: ['polling', 'websocket'], // 优先使用polling
      timeout: 5000, // 5秒超时
      forceNew: true,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket连接成功');
      setConnectionStatus('connected');
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket连接断开');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket连接错误:', error);
      console.error('错误详情:', error.description, error.message, error.type);
      setConnectionStatus('error');
    });

    // 监听AI回复的流式数据
    newSocket.on('ai_response_start', (data) => {
      const aiMessageId = data.messageId;
      const aiMessage = {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        streaming: true,
      };
      setMessages((prev) => [...prev, aiMessage]);
      currentMessageRef.current = '';
    });

    newSocket.on('ai_response_token', (data) => {
      currentMessageRef.current += data.token;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.messageId ? { ...msg, text: currentMessageRef.current } : msg))
      );
    });

    newSocket.on('ai_response_end', (data) => {
      setMessages((prev) => prev.map((msg) => (msg.id === data.messageId ? { ...msg, streaming: false } : msg)));
      setIsLoading(false);
    });

    newSocket.on('ai_response_error', (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, text: '抱歉，发生了错误，请重试。', streaming: false } : msg
        )
      );
      setIsLoading(false);
    });

    setSocket(newSocket);
  };

  const sendMessage = () => {
    if (!input.trim() || isLoading || !socket || connectionStatus !== 'connected') return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 通过WebSocket发送消息
    socket.emit('user_message', {
      message: input,
      timestamp: new Date().toISOString(),
    });

    setInput('');
    setIsLoading(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reconnect = () => {
    if (socket) {
      socket.disconnect();
    }
    connectSocket();
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4ade80';
      case 'connecting':
        return '#fbbf24';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <h3>WebSocket 聊天演示</h3>
        <div className={styles.status}>
          <div className={styles.statusDot} style={{ backgroundColor: getStatusColor() }}></div>
          <span className={styles.statusText}>
            {connectionStatus === 'connected' && '已连接'}
            {connectionStatus === 'connecting' && '连接中...'}
            {connectionStatus === 'error' && '连接错误'}
            {connectionStatus === 'disconnected' && '未连接'}
          </span>
          {connectionStatus === 'error' || connectionStatus === 'disconnected' ? (
            <button onClick={reconnect} className={styles.reconnectButton}>
              重连
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div key={message.id} className={`${styles.message} ${styles[message.sender]}`}>
            <div className={styles.messageContent}>
              <div className={styles.messageText}>
                {message.text}
                {message.streaming && <span className={styles.cursor}>|</span>}
              </div>
              <div className={styles.messageTime}>
                {message.timestamp ? message.timestamp.toLocaleTimeString() : ''}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入你的消息... (Enter发送，Shift+Enter换行)"
          className={styles.input}
          disabled={isLoading || connectionStatus !== 'connected'}
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading || connectionStatus !== 'connected'}
          className={styles.sendButton}
        >
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>

      <div className={styles.info}>
        <p>
          <strong>WebSocket特点：</strong>
        </p>
        <p>• 使用Socket.IO实现双向通信</p>
        <p>• 持久连接，实时性更好</p>
        <p>• 支持自动重连和错误处理</p>
        <p>• 适合需要双向交互的场景</p>
      </div>
    </div>
  );
}
