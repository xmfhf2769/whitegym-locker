const express = require('express');
const router = express.Router();
const Locker = require('./models/Locker');
const CancelledMember = require('./models/CancelledMember');

// 모든 락커 정보 가져오기
router.get('/lockers', async (req, res) => {
    try {
        const lockers = await Locker.find().sort({ number: 1 });
        res.json(lockers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 락커 정보 업데이트
router.put('/lockers/:number', async (req, res) => {
    try {
        const locker = await Locker.findOneAndUpdate(
            { number: req.params.number },
            req.body,
            { new: true }
        );
        res.json(locker);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 락커 해지
router.post('/lockers/:number/cancel', async (req, res) => {
    try {
        const locker = await Locker.findOne({ number: req.params.number });
        if (!locker) {
            return res.status(404).json({ message: '락커를 찾을 수 없습니다.' });
        }

        const cancelledMember = new CancelledMember({
            memberName: locker.memberName,
            phone: locker.phone,
            previousLockerNumber: locker.number
        });
        await cancelledMember.save();

        locker.memberName = '';
        locker.phone = '';
        locker.expirationDate = null;
        locker.isCancelled = true;
        await locker.save();

        res.json({ message: '성공적으로 해지되었습니다.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 해지된 회원 목록 가져오기
router.get('/cancelled-members', async (req, res) => {
    try {
        const members = await CancelledMember.find()
            .sort({ cancellationDate: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;