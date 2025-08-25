const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// 创建Next.js应用，启用热更新
const app = next({
  dev,
  hostname,
  port,
  // 确保开发模式下启用热更新
  conf: {
    // 启用热更新相关配置
    experimental: {
      // 如果需要可以添加实验性功能
    },
  },
});
const handle = app.getRequestHandler();

// 模拟AI回复的内容
const AI_RESPONSES = [
  '这是一个很好的问题！',
  '根据你的描述，我认为',
  '在这种情况下，建议你可以',
  '从技术角度来看，',
  '我建议采用以下方法：',
  '总的来说，',
  '希望这个回答对你有帮助！',
  '如果你还有其他问题，随时可以问我。',
];

// 模拟分词处理
function tokenizeResponse(message) {
  // 根据用户消息生成相关回复
  let response = `针对你的问题"${message}"，`;

  // 随机选择一些回复片段
  const selectedResponses = AI_RESPONSES.sort(() => Math.random() - 0.5).slice(0, 3);

  response += selectedResponses.join('');

  // 将回复分割成tokens（模拟流式输出）
  const tokens = [];
  const words = response.split('');

  for (let i = 0; i < words.length; i++) {
    tokens.push(words[i]);
  }

  return tokens;
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // 创建Socket.IO服务器
  const io = new Server(server, {
    path: '/api/socketio',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.IO连接处理
  io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 监听用户消息
    socket.on('user_message', async (data) => {
      console.log('收到用户消息:', data.message);

      const messageId = Date.now();

      // 发送AI开始回复的信号
      socket.emit('ai_response_start', {
        messageId: messageId,
      });

      try {
        // 获取回复tokens
        const tokens = tokenizeResponse(data.message);

        // 逐个发送tokens，模拟流式输出
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];

          // 发送token
          socket.emit('ai_response_token', {
            messageId: messageId,
            token: token,
            index: i,
          });

          // 模拟不同的延迟
          const delay = Math.random() * 100 + 50; // 50-150ms随机延迟
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // 发送完成信号
        socket.emit('ai_response_end', {
          messageId: messageId,
        });
      } catch (error) {
        console.error('AI回复错误:', error);
        socket.emit('ai_response_error', {
          messageId: messageId,
          error: error.message,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('用户断开连接:', socket.id);
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server running on path: /api/socketio`);
    });
});
