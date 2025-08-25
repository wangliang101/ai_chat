'use client';

import { useState } from 'react';
import SSEChat from '../components/SSEChat';
import WebSocketChat from '../components/WebSocketChat';
import styles from './page.module.css';

export default function Home() {
  const [method, setMethod] = useState('sse'); // 'sse' 或 'websocket'

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>AI聊天流式返回演示</h1>

        <div className={styles.methodSelector}>
          <h2>选择通信方式:</h2>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.methodButton} ${method === 'sse' ? styles.active : ''}`}
              onClick={() => setMethod('sse')}
            >
              SSE (Server-Sent Events)
            </button>
            <button
              className={`${styles.methodButton} ${method === 'websocket' ? styles.active : ''}`}
              onClick={() => setMethod('websocket')}
            >
              WebSocket
            </button>
          </div>
        </div>

        <div className={styles.description}>
          {method === 'sse' ? (
            <div>
              <h3>SSE (Server-Sent Events)</h3>
              <p>• 单向通信，服务器向客户端推送数据</p>
              <p>• 基于HTTP协议，实现简单</p>
              <p>• 自动重连机制</p>
              <p>• 适合实时数据推送场景</p>
            </div>
          ) : (
            <div>
              <h3>WebSocket</h3>
              <p>• 双向通信，客户端和服务器可以相互发送数据</p>
              <p>• 持久连接，低延迟</p>
              <p>• 需要手动处理重连</p>
              <p>• 适合实时交互场景</p>
            </div>
          )}
        </div>

        <div className={styles.chatContainer}>{method === 'sse' ? <SSEChat /> : <WebSocketChat />}</div>
      </main>
    </div>
  );
}
