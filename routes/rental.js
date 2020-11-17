const express = require('express');
const router = express.Router();

const { RentalOrder } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const foreignKeyChecker = require('../lib/foreignKeyChecker');



/* READ */
router.get('/', verifyToken, async (req, res, next) => {
    /*
        이용 내역 리스트 요청 API(GET): /api/rental
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: orders = [대여 주문 정보 Array...]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    try {
        const orders = await RentalOrder.findAll({ where: { user_id } }); // 대여 주문 기록 리스트 조회.
        return res.status(200).send({ msg: 'success', orders });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.get('/:rental_id', verifyToken, async (req, res, next) => {
    /*
        이용 내역 상세 정보 요청 API(GET): /api/rental/:rental_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: rental_id }: 대여 주문 번호

        * 응답: order = { 대여 주문 정보 Object }
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    try {
        const order = await RentalOrder.findOne({ where: { user_id } }); // 수익금 기록 리스트 조회.
        if (!order) {
            return res.status(202).send({ msg: '조회할 수 없는 주문 번호입니다.' });
        }
        return res.status(200).send({ msg: 'success', order });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;
