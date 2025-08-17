// --- 1. 필요한 라이브러리 가져오기 ---
const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const helmet = require('helmet'); // 보안 헤더 설정
const rateLimit = require('express-rate-limit'); // 요청 횟수 제한
const cors = require('cors'); // CORS 정책 설정

// --- 2. 기본 설정 ---
const app = express();
const PORT = process.env.PORT || 3000; // 배포 환경을 위해 process.env.PORT 사용

// --- 3. 보안 미들웨어 설정 ---

// CORS 설정: 특정 도메인만 허용하려면 ['https://your-domain.com'] 와 같이 설정
app.use(cors()); 

// Helmet을 사용하여 기본적인 웹 보안 강화
app.use(helmet());

// Rate Limiter 설정: 15분 동안 IP당 100개의 요청만 허용
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 요청 횟수
    standardHeaders: true,
    legacyHeaders: false,
    message: '너무 많은 요청을 보냈습니다. 15분 후에 다시 시도해주세요.'
});
app.use('/api', limiter); // '/api'로 시작하는 모든 요청에 적용

// --- 4. 정적 파일 제공 ---
// 'public' 폴더에 있는 파일들을 웹페이지로 제공
app.use(express.static(path.join(__dirname, 'public')));

// --- 5. 엑셀 데이터 처리 로직 ---
const db1_path = path.join(__dirname, 'data', 'db_1.xlsx');
const db2_path = path.join(__dirname, 'data', 'db_2.xlsx');

let db_1_data = [];
let db_2_map = {};

// 서버 시작 시 엑셀 파일을 미리 읽어서 메모리에 저장 (성능 향상)
try {
    const workbook1 = xlsx.readFile(db1_path);
    const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
    db_1_data = xlsx.utils.sheet_to_json(sheet1);

    const workbook2 = xlsx.readFile(db2_path);
    const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
    const db_2_data_raw = xlsx.utils.sheet_to_json(sheet2);
    
    // db_2 데이터를 key-value 형태로 변환
    db_2_data_raw.forEach(row => {
        const key = row.Data;
        db_2_map[key] = Object.values(row).slice(1).filter(text => text != null && text !== '');
    });
    console.log("엑셀 데이터 로딩 완료.");
} catch (error) {
    console.error("서버 시작 중 엑셀 파일 읽기 오류:", error);
    // 서버 시작을 중단하여 문제를 즉시 인지하도록 함
    process.exit(1); 
}


// --- 6. API 라우트 설정 ---
app.get('/api/fortune', (req, res) => {
    // 입력값 검증 강화: 8자리 숫자이고, 실제 가능한 날짜 형식인지 확인
    const { birthday } = req.query;
    if (!/^\d{8}$/.test(birthday)) {
        return res.status(400).json({ error: '생년월일은 8자리 숫자로 입력해주세요.' });
    }

    try {
        // db_1에서 생년월일에 맞는 데이터 찾기
        const planetData = db_1_data.find(row => String(row.Birthday) === birthday);

        if (!planetData) {
            return res.status(404).json({ error: '해당 생년월일의 데이터를 찾을 수 없습니다.' });
        }

        // db_2에서 텍스트 매핑 및 정렬
        const messageQueue = [];
        const planets = ['sun', 'moon', 'venus', 'mars'];

        planets.forEach(planet => {
            const planetCode = planetData[planet];
            if (db_2_map[planetCode]) {
                messageQueue.push(...db_2_map[planetCode]);
            }
        });
        
        // 찾은 메시지들을 프론트엔드로 전송
        res.json({ messages: messageQueue });

    } catch (error) {
        // 서버 내부 오류 발생 시 사용자에게는 간단한 메시지만 전달
        console.error(`[${new Date().toISOString()}] /api/fortune 처리 오류:`, error);
        res.status(500).json({ error: '서버 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    }
});

// --- 7. 서버 실행 ---
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
