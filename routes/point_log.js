const express = require('express');
const router = express.Router();

const { User, PointLog } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');

/*
- 나의 수익금 기록 요청 API(GET): /api/point_log
{ headers }: JWT_TOKEN(유저 로그인 토큰)

* 응답: point_logs = [포인트 사용 기록 Array…]
*/
router.get('/', verifyToken, async (req, res, next) => {
    const { user_id } = req.decodeToken;
    try {
        const existPointLog = await PointLog.findAll({ where: { user_id } });
        if (!existPointLog) {
            return res.status(202).send({ msg: 'Point 사용기록이 없습니다' });
        }
        res.status(200).send({ msg: 'success', pointlogs: existPointLog });
    } catch (e) {
        if (e.table) {
            res.status(500).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(500).send({ msg: 'database error', error });
        }
    }
});

/*
- 출금 신청 API(POST): /api/point_log
{ headers }: JWT_TOKEN(유저 로그인 토큰)
price: 출금할 액수(Integer, 필수)

* 응답: point_logs = [새로운 포인트 사용 기록 Array…]
*/
router.post('/', verifyToken, async (req, res, next) => {
    const { user_id } = req.decodeToken;
    const { price } = req.body;
    try {
        const omissionResult = omissionChecker({ price });
        if (!omissionResult.result) {
            return res.send({ msg: omissionResult.message });
        } else if (price === 0) {
            return res.status(202).send({ msg: '출금가능한 금액을 입력하세요' });
        }
        const existUser = await User.findOne({ user_id });
        if (!existUser) {
            return res.status(202).send({ msg: '가입되지 않은 이메일입니다.' });
        }
        const remainPoint = existUser.price - price;
        const updateUser = await User.update(
            { point: remainPoint },
            { where: user_id },
        );
        if (!updateUser) {
            return res.status(202).send({ msg: '출금에 실패하엿습니다' });
        }
        const createPointLog = await PointLog.create({
            user_id,
            use_point: price,
            remain_point: remainPoint,
        });
        if (!createPointLog) {
            return res.status(202).send({ msg: '출금에 실패하엿습니다' });
        }
        const existPointLog = await PointLog.findAll({ where: { user_id } });
        if (!existPointLog) {
            return res.status(202).send({ msg: 'Point 사용기록이 없습니다' });
        }
        res.status(201).send({ msg: 'success', pointlogs: existPointLog });
    } catch (e) {
        if (e.table) {
            res.status(500).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(500).send({ msg: 'database error', error });
        }
    }
});

module.exports = router;
