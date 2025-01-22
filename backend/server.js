const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// .env 파일 로드
dotenv.config();

// 모델 불러오기
const Locker = require('./models/Locker');
const CancelledMember = require('./models/CancelledMember');

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/locker-system')
    .then(() => {
        console.log('MongoDB 연결 성공');
        initializeLockers();
    })
    .catch(err => {
        console.error('MongoDB 연결 실패:', err);
    });

// API 라우트
// 모든 락커 정보 가져오기
app.get('/api/lockers', async (req, res) => {
    try {
        const lockers = await Locker.find().sort({ number: 1 });
        res.json(lockers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 락커 정보 업데이트
app.put('/api/lockers/:number', async (req, res) => {
    try {
        const locker = await Locker.findOneAndUpdate(
            { number: parseInt(req.params.number) },
            req.body,
            { new: true, upsert: true }
        );
        res.json(locker);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 락커 해지
app.post('/api/lockers/:number/cancel', async (req, res) => {
    try {
        const locker = await Locker.findOne({ number: parseInt(req.params.number) });
        if (!locker) {
            return res.status(404).json({ message: '락커를 찾을 수 없습니다.' });
        }

        // 해지 회원 정보 저장
        const cancelledMember = new CancelledMember({
            memberName: locker.memberName,
            phone: locker.phone,
            previousLockerNumber: locker.number,
            cancellationDate: new Date()
        });
        await cancelledMember.save();
        console.log('해지 회원 저장됨:', cancelledMember);

        // 락커 정보 초기화
        locker.memberName = '';
        locker.phone = '';
        locker.membershipType = 'regular';
        locker.expirationDate = null;
        locker.isCancelled = true;
        await locker.save();

        res.json({ message: '성공적으로 해지되었습니다.' });
    } catch (error) {
        console.error('해지 처리 중 오류:', error);
        res.status(500).json({ message: error.message });
    }
});

// 해지된 회원 목록 가져오기
app.get('/api/cancelled-members', async (req, res) => {
    try {
        const members = await CancelledMember.find().sort({ cancellationDate: -1 });
        res.json(members || []);
    } catch (error) {
        console.error('해지 회원 목록 조회 중 오류:', error);
        res.status(500).json({ message: error.message });
    }
});

// 초기 387개 락커 생성
async function initializeLockers() {
    try {
        // 기존 데이터 모두 삭제
        await Locker.deleteMany({});
        
        // 387개 락커 새로 생성
        const lockers = Array.from({ length: 387 }, (_, i) => ({
            number: i + 1,
            memberName: '',
            phone: '',
            membershipType: 'regular'
        }));
        await Locker.insertMany(lockers);
        console.log('387개 락커 초기화 완료');
    } catch (error) {
        console.error('락커 초기화 실패:', error);
    }
}

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});