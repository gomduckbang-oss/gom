const express = require('express');
const path = require('path');
const xlsx = require('xlsx'); // 엑셀 라이브러리 다시 추가

const app = express();
const PORT = process.env.PORT || 3000;

// --- 데이터 로딩 시도 ---
let dataLoadError = null;
try {
    const dataDirectory = path.join(__dirname, 'data');
    const db1_path = path.join(dataDirectory, 'db_1.xlsx');
    xlsx.readFile(db1_path); // 파일이 존재하는지만 간단히 확인
    console.log("성공: 엑셀 파일을 찾고 읽을 수 있습니다.");
} catch (error) {
    dataLoadError = error;
    console.error("치명적 오류: 엑셀 파일을 읽는 데 실패했습니다.", error);
}

// --- 서버 응답 ---
app.get('/', (req, res) => {
  if (dataLoadError) {
    // 엑셀 로딩에 실패했다면, 에러 메시지를 보여줌
    res.status(500).send(`<h1>서버 오류</h1><p>엑셀 파일을 로드할 수 없습니다.</p><pre>${dataLoadError.stack}</pre>`);
  } else {
    // 성공했다면, 성공 메시지를 보여줌
    res.send('<h1>서버 작동 중</h1><p>엑셀 파일 로딩에도 성공했습니다. 이제 API를 추가할 차례입니다.</p>');
  }
});


// --- 서버 실행 ---
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`성공: 서버가 ${PORT}번 포트에서 정상적으로 실행되었습니다.`);
});

server.on('error', (err) => {
    console.error('서버 시작 중 치명적 오류 발생:', err);
});