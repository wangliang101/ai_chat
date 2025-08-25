import { NextResponse } from 'next/server';

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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('message');

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // 创建SSE响应
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const tokens = tokenizeResponse(message);
      let index = 0;

      const sendToken = () => {
        if (index < tokens.length) {
          const token = tokens[index];
          const data = JSON.stringify({
            type: 'token',
            content: token,
            index: index,
          });

          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          index++;

          // 模拟不同的延迟，让流式效果更真实
          const delay = Math.random() * 100 + 50; // 50-150ms随机延迟
          setTimeout(sendToken, delay);
        } else {
          // 发送完成信号
          const endData = JSON.stringify({
            type: 'done',
            message: 'Stream completed',
          });
          controller.enqueue(encoder.encode(`data: ${endData}\n\n`));
          controller.close();
        }
      };

      // 开始发送tokens
      setTimeout(sendToken, 500); // 初始延迟500ms
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
