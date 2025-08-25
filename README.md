# AI 聊天流式返回演示

这是一个展示 AI 聊天流式返回的完整演示项目，支持两种实现方式：

- **SSE (Server-Sent Events)** - 单向流式数据传输
- **WebSocket** - 双向实时通信

## 📋 功能特性

### SSE (Server-Sent Events)

- ✅ 基于 HTTP 协议，实现简单
- ✅ 自动重连机制
- ✅ 流式文本输出效果
- ✅ 实时连接状态显示
- ✅ 错误处理和重试机制

### WebSocket

- ✅ 双向实时通信
- ✅ 持久连接，低延迟
- ✅ 使用 Socket.IO 实现
- ✅ 手动重连功能
- ✅ 连接状态管理

## 🚀 快速开始

### 1. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install

# 或使用 yarn
yarn install
```

### 2. 启动开发服务器

```bash
# 启动包含Socket.IO的自定义服务器
npm run dev

# 或者只启动Next.js（仅支持SSE）
npm run dev-next
```

### 3. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
ai_chat/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── sse/
│   │   │   │       └── route.js        # SSE API路由
│   │   │   └── socketio/
│   │   │       └── route.js            # WebSocket API配置
│   │   ├── globals.css                 # 全局样式
│   │   ├── layout.js                   # 根布局
│   │   ├── page.js                     # 主页面
│   │   └── page.module.css             # 主页面样式
│   └── components/
│       ├── SSEChat.js                  # SSE聊天组件
│       ├── WebSocketChat.js            # WebSocket聊天组件
│       └── Chat.module.css             # 聊天组件样式
├── server.js                           # 自定义服务器（支持Socket.IO）
├── package.json
└── README.md
```

## 🔧 技术实现

### SSE 实现原理

1. **客户端** - 使用 `EventSource` API 建立连接
2. **服务端** - 返回 `text/event-stream` 响应
3. **数据格式** - 按照 SSE 协议发送格式化数据
4. **流式输出** - 逐字符发送模拟打字效果

```javascript
// 客户端代码示例
const eventSource = new EventSource('/api/chat/sse?message=hello');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'token') {
    // 处理新的文本片段
    updateMessage(data.content);
  }
};
```

### WebSocket 实现原理

1. **客户端** - 使用 `socket.io-client` 建立 WebSocket 连接
2. **服务端** - 使用 `socket.io` 处理连接和消息
3. **双向通信** - 支持客户端和服务端相互发送消息
4. **事件驱动** - 基于事件监听处理各种消息类型

```javascript
// 客户端代码示例
const socket = io('/api/socketio');
socket.emit('user_message', { message: 'hello' });
socket.on('ai_response_token', (data) => {
  // 处理流式响应
  updateMessage(data.token);
});
```

## 🎨 界面特性

- 🌓 **深色/浅色模式** - 自动适配系统主题
- 📱 **响应式设计** - 支持移动端和桌面端
- 🔄 **实时状态** - 连接状态实时显示
- ⚡ **流式效果** - 打字机效果的流式输出
- 🎯 **用户体验** - 现代化 UI 设计

## 🛠️ 开发说明

### 自定义 AI 回复

在以下文件中修改 AI 回复内容：

- `src/app/api/chat/sse/route.js` - SSE 版本
- `server.js` - WebSocket 版本

```javascript
const AI_RESPONSES = [
  '这是一个很好的问题！',
  '根据你的描述，我认为',
  // 添加更多回复...
];
```

### 调整流式速度

修改延迟时间来调整打字速度：

```javascript
const delay = Math.random() * 100 + 50; // 50-150ms随机延迟
```

### 添加新功能

1. **消息历史** - 可以添加消息持久化
2. **用户认证** - 集成身份验证系统
3. **多房间聊天** - 扩展为多用户聊天室
4. **文件上传** - 支持图片和文件发送

## 🚨 注意事项

1. **生产环境** - 需要配置正确的 CORS 和安全策略
2. **性能优化** - 大量并发时需要考虑连接池管理
3. **错误处理** - 完善错误处理和重试机制
4. **监控日志** - 添加完善的日志和监控系统

## 📚 相关资源

- [Server-Sent Events MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Socket.IO 官方文档](https://socket.io/docs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Hooks 指南](https://reactjs.org/docs/hooks-intro.html)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## �� 许可证

MIT License
