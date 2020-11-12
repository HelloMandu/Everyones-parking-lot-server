const express = require('express');
const router = express.Router();

const { Coupon } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');

require('dotenv').config();

/*
- 사용 가능한 쿠폰 요청 API(GET): /api/coupon
{ headers }: JWT_TOKEN(유저 로그인 토큰)
place_id: 결제할 주차공간 id(Integer, 필수)
*/
router.get('/', verifyToken, async (req, res, next) => {
    const { place_id } = req.query;
    const omissionResult = omissionChecker({ place_id });
    if (!omissionResult.result) {
        return res.status(401).send({ msg: omissionResult.message });
    }
    try {
        const existCoupon = await Coupon.findOne({ where: { place_id } });
        if (!existCoupon) {
            return res.status(401).send({ msg: '사용 가능한 쿠폰이 없습니다.' });
        }
        res.send(existCoupon);
    } catch (e) {
        if (e.table) {
            res.status(500).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(500).send({ msg: 'database error', error });
        }
    }
});

module.exports = router;
