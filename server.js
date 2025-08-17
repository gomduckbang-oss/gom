// --- 1. 필요한 라이브러리 가져오기 ---
const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// --- 2. 기본 설정 ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- 3. 보안 미들웨어 설정 ---
app.use(cors());
app.use(helmet());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: '너무 많은 요청을 보냈습니다. 15분 후에 다시 시도해주세요.'
});
app.use('/api', limiter);

// --- 4. 정적 파일 제공 ---
// 'public' 폴더의 경로를 명확하게 설정합니다.
const publicPath = path.resolve(process.cwd(), 'public');
app.use(express.static(publicPath));


// --- 5. 엑셀 데이터 처리 로직 ---
// Vercel 환경에서 안정적으로 파일 경로를 찾도록 수정합니다.
const dataDirectory = path.resolve(process.cwd(), 'data');
const db1_path = path.join(dataDirectory, 'db_1.xlsx');
const db2_path = path.join(dataDirectory, 'db_2.xlsx');

let db_1_data = [];
let db_2_map = {};

try {
    console.log(`Trying to read db_1.xlsx from: ${db1_path}`);
    const workbook1 = xlsx.readFile(db1_path);
    const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
    db_1_data = xlsx.utils.sheet_to_json(sheet1);

    console.log(`Trying to read db_2.xlsx from: ${db2_path}`);
    const workbook2 = xlsx.readFile(db2_path);
    const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
    const db_2_data_raw = xlsx.utils.sheet_to_json(sheet2);
    
    db_2_data_raw.forEach(row => {
        const key = row.Data;
        if (key) { // 'Data' 필드가 비어있지 않은 경우에만 처리
            db_2_map[key] = Object.values(row).slice(1).filter(text => text != null && text !== '');
        }
    });
    console.log("엑셀 데이터 로딩 성공.");
} catch (error) {
    console.error("서버 시작 중 엑셀 파일 읽기 오류:", error);
    // 오류가 발생해도 서버가 죽지 않도록 처리
}


// --- 6. API 라우트 설정 ---
app.get('/api/fortune', (req, res) => {
    // 엑셀 파일 로딩 실패 시 에러 메시지 전송
    if (db_1_data.length === 0) {
        console.error("API 요청 실패: DB_1 데이터가 로드되지 않았습니다.");
        return res.status(500).json({ error: '서버 데이터 파일을 읽는 데 실패했습니다.' });
    }

    const { birthday } = req.query;
    if (!/^\d{8}$/.test(birthday)) {
        return res.status(400).json({ error: '생년월일은 8자리 숫자로 입력해주세요.' });
    }

    try {
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
        
        res.json({ messages: messageQueue });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] /api/fortune 처리 오류:`, error);
        res.status(500).json({ error: '서버 처리 중 오류가 발생했습니다.' });
    }
});

// --- 7. 서버 실행 (로컬 테스트용, Vercel에서는 이 부분이 직접 사용되지 않음) ---
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`로컬 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });
}

// Vercel이 이 파일을 가져가서 사용할 수 있도록 export
module.exports = app;
