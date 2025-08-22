const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const cors = require('cors');
const admin = require('firebase-admin');

// --- 파이어베이스 초기화 ---
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('파이어베이스에 성공적으로 연결되었습니다.');
} catch (error) {
  console.error('파이어베이스 초기화 실패:', error);
}

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3000;

// --- 미들웨어 설정 ---
app.use(cors());

// --- API 라우트 (파이어베이스에서 데이터 조회) ---
app.get('/api/fortune', async (req, res) => {
  try {
    const { birthday } = req.query;
    if (!/^\d{8}$/.test(birthday)) {
      return res.status(400).json({ error: '생년월일은 8자리 숫자로 입력해주세요.' });
    }

    const birthdayDoc = await db.collection('birthdays').doc(birthday).get();
    if (!birthdayDoc.exists) {
      return res.status(404).json({ error: '해당 생년월일의 데이터를 찾을 수 없습니다.' });
    }
    const planetData = birthdayDoc.data();

    const messageQueue = [];
    const planets = ['sun', 'moon', 'venus', 'mars'];
    
    for (const planet of planets) {
      const planetCode = planetData[planet];
      if (planetCode) {
        const messageDoc = await db.collection('messages').doc(planetCode).get();
        if (messageDoc.exists) {
          messageQueue.push(...messageDoc.data().texts);
        }
      }
    }
    
    // --- 캐시 방지 헤더 추가 ---
    res.set('Cache-Control', 'no-store');
    
    res.status(200).json({ messages: messageQueue });

  } catch (error) {
    console.error('API 처리 중 오류 발생:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});

// --- 프론트엔드 파일 제공 ---
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

// --- 서버 실행 ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 ${PORT}번 포트에서 실행되었습니다.`);
});
