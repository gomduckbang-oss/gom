const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 데이터 로딩 ---
let db_1_data = [];
let db_2_map = {};
let dataLoadError = null;

try {
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
    dataLoadError = error;
    console.error("치명적 오류: 엑셀 데이터를 로드하는 데 실패했습니다.", error);
}

// --- 미들웨어 설정 ---
app.use(cors());

// --- API 라우트 (데이터 요청 처리) ---
app.get('/api/fortune', (req, res) => {
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
// 'frontend' 폴더에 있는 파일들을 웹사이트의 루트 경로로 제공합니다.
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

// --- 서버 실행 ---
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`성공: 서버가 ${PORT}번 포트에서 0.0.0.0 호스트로 정상적으로 실행되었습니다.`);
});

server.on('error', (err) => {
    console.error('서버 시작 중 치명적 오류 발생:', err);
});
