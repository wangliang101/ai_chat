'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './Chat.module.css';

export default function SSEChat() {
  const [messages, setMessages] = useState([
    { id: 1, text: '你好！我是AI助手，请问有什么可以帮助你的吗？', sender: 'ai', timestamp: null },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setConnectionStatus('connecting');

    // 创建AI回复消息的占位符
    const aiMessageId = Date.now() + 1;
    const aiMessage = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      streaming: true,
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      // 创建EventSource连接
      const eventSource = new EventSource(`/api/chat/sse?message=${encodeURIComponent(input)}`);

      setConnectionStatus('connected');
      currentMessageRef.current = '';

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'token') {
          // 接收到新的token，累加到当前消息
          currentMessageRef.current += data.content;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === aiMessageId ? { ...msg, text: currentMessageRef.current } : msg))
          );
        } else if (data.type === 'done') {
          // 流式传输完成
          setMessages((prev) => prev.map((msg) => (msg.id === aiMessageId ? { ...msg, streaming: false } : msg)));
          eventSource.close();
          setIsLoading(false);
          setConnectionStatus('disconnected');
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        setIsLoading(false);
        setConnectionStatus('error');

        // 显示错误消息
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, text: '抱歉，发生了错误，请重试。', streaming: false } : msg
          )
        );
      };
    } catch (error) {
      console.error('Send message error:', error);
      setIsLoading(false);
      setConnectionStatus('error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
        <h3>SSE 聊天演示</h3>
        <div className={styles.status}>
          <div className={styles.statusDot} style={{ backgroundColor: getStatusColor() }}></div>
          <span className={styles.statusText}>
            {connectionStatus === 'connected' && '已连接'}
            {connectionStatus === 'connecting' && '连接中...'}
            {connectionStatus === 'error' && '连接错误'}
            {connectionStatus === 'disconnected' && '未连接'}
          </span>
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
          disabled={isLoading}
          rows={1}
        />
        <button onClick={sendMessage} disabled={!input.trim() || isLoading} className={styles.sendButton}>
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>

      <div className={styles.info}>
        <p>
          <strong>SSE特点：</strong>
        </p>
        <p>• 使用EventSource API进行单向通信</p>
        <p>• 自动重连机制</p>
        <p>• 基于HTTP协议，兼容性好</p>
        <p>• 适合服务器主动推送数据的场景</p>
      </div>
    </div>
  );
}
