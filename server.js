const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 루트 경로('/')로 접속하면 간단한 메시지를 보냅니다.
app.get('/', (req, res) => {
  res.send('<h1>서버가 작동 중입니다.</h1><p>이 메시지가 보인다면, 기본 서버 환경은 정상입니다.</p>');
});

// 서버를 실행하고, 성공/실패 여부를 명확하게 로그로 남깁니다.
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`성공: 서버가 ${PORT}번 포트에서 정상적으로 실행되었습니다.`);
});

server.on('error', (err) => {
    console.error('서버 시작 중 치명적 오류 발생:', err);
});
