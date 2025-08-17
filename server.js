const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const cors = require('cors');
// const helmet = require('helmet'); // 디버깅을 위해 잠시 비활성화

const app = express();
const PORT = process.env.PORT || 3000; // Render가 지정하는 포트 또는 3000번 포트 사용

// --- 데이터 로딩 ---
let db_1_data = [];
let db_2_map = {};
let dataLoadError = null; // 데이터 로딩 에러를 저장할 변수

try {
    // __dirname을 사용하여 현재 파일 위치를 기준으로 경로를 설정 (가장 안정적인 방식)
    const dataDirectory = path.join(__dirname, 'data');
    const db1_path = path.join(dataDirectory, 'db_1.xlsx');
    const db2_path = path.join(dataDirectory, 'db_2.xlsx');

    console.log(`엑셀 파일 경로 확인: ${dataDirectory}`);

    const workbook1 = xlsx.readFile(db1_path);
    db_1_data = xlsx.utils.sheet_to_json(workbook1.Sheets[workbook1.SheetNames[0]]);

    const workbook2 = xlsx.readFile(db2_path);
    const db_2_data_raw = xlsx.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]]);
    
    db_2_data_raw.forEach(row => {
        if (row.Data) {
            db_2_map[row.Data] = Object.values(row).slice(1).filter(text => text != null && text !== '');
        }
    });
    console.log("성공: 엑셀 데이터를 성공적으로 로드했습니다.");
} catch (error) {
    // 서버가 멈추지 않도록 에러를 변수에 저장
    dataLoadError = error;
    console.error("치명적 오류: 엑셀 데이터를 로드하는 데 실패했습니다.", error);
}

// --- 미들웨어 설정 ---
app.use(cors());
// app.use(helmet()); // 디버깅을 위해 잠시 비활성화

// --- API 라우트 (데이터 요청 처리) ---
app.get('/api/fortune', (req, res) => {
    // 데이터 로딩 중 에러가 있었다면, 해당 에러를 사용자에게 알림
    if (dataLoadError) {
        return res.status(500).json({ 
            error: '서버 내부 오류: 데이터 파일을 읽을 수 없습니다.',
            details: dataLoadError.message 
        });
    }

    const { birthday } = req.query;
    if (!/^\d{8}$/.test(birthday)) {
        return res.status(400).json({ error: '생년월일은 8자리 숫자로 입력해주세요.' });
    }

    const planetData = db_1_data.find(row => String(row.Birthday) === birthday);
    if (!planetData) {
        return res.status(404).json({ error: '해당 생년월일의 데이터를 찾을 수 없습니다.' });
    }

    const messageQueue = [];
    const planets = ['sun', 'moon', 'venus', 'mars'];
    planets.forEach(planet => {
        const planetCode = planetData[planet];
        if (db_2_map[planetCode]) {
            messageQueue.push(...db_2_map[planetCode]);
        }
    });
    
    res.status(200).json({ messages: messageQueue });
});

// --- 프론트엔드 파일 제공 ---
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

// API가 아닌 다른 모든 요청은 프론트엔드의 index.html을 보여줌
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// --- 서버 실행 및 오류 처리 ---
console.log(`서버 실행을 시도합니다... 포트: ${PORT}`);

// Render 환경을 위해 호스트를 '0.0.0.0'으로 명시적으로 바인딩합니다.
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`성공: 서버가 ${PORT}번 포트에서 0.0.0.0 호스트로 정상적으로 실행되었습니다.`);
});

// 서버 시작 시 발생하는 오류를 잡아내는 리스너 추가
server.on('error', (err) => {
    console.error('서버 시작 중 치명적 오류 발생:', err);
    process.exit(1); // 오류 발생 시 프로세스 종료
});