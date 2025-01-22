const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use('/', express.static(path.join(__dirname, '../frontend')));
app.use('/styles', express.static(path.join(__dirname, '../frontend/styles')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB 연결 성공');
}).catch((err) => {
    console.error('MongoDB 연결 실패:', err);
});

// 락커 스키마
const lockerSchema = new mongoose.Schema({
    number: { type: Number, required: true, unique: true },
    memberName: String,
    phone: String,
    membershipType: String,
    expirationDate: Date,
    isActive: { type: Boolean, default: true }
});

const Locker = mongoose.model('Locker', lockerSchema);

// 해지된 회원 스키마
const cancelledMemberSchema = new mongoose.Schema({
    memberName: String,
    phone: String,
    lockerNumber: Number,
    cancellationDate: { type: Date, default: Date.now }
});

const CancelledMember = mongoose.model('CancelledMember', cancelledMemberSchema);

// API 엔드포인트
app.get('/api/lockers', async (req, res) => {
    try {
        const lockers = await Locker.find().sort({ number: 1 });
        res.json(lockers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/lockers/:number', async (req, res) => {
    try {
        const locker = await Locker.findOneAndUpdate(
            { number: req.params.number },
            { ...req.body, isActive: true },
            { new: true, upsert: true }
        );
        res.json(locker);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/lockers/:number/cancel', async (req, res) => {
    try {
        const locker = await Locker.findOne({ number: req.params.number });
        if (!locker || !locker.memberName) {
            return res.status(404).json({ message: '락커를 찾을 수 없거나 비어있습니다.' });
        }

        await CancelledMember.create({
            memberName: locker.memberName,
            phone: locker.phone,
            lockerNumber: locker.number
        });

        locker.memberName = null;
        locker.phone = null;
        locker.membershipType = null;
        locker.expirationDate = null;
        await locker.save();

        res.json({ message: '해지 처리가 완료되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/cancelled-members', async (req, res) => {
    try {
        const members = await CancelledMember.find()
            .sort({ cancellationDate: -1 })
            .limit(50);
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 모든 다른 요청은 index.html로
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});