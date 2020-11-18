const express = require('express');
const router = express.Router();

const { RentalOrder, Coupon, PersonalPayment, Place } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');


/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        결제 및 대여 등록 요청 API(POST): /api/rental
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        place_id: 결제할 주차공간 id(Interger, 필수)
        coupon_id: 사용할 쿠폰 id(String)
        rental_start_time: 대여 시작 시간(DateTimeString, 필수)
        rental_end_time: 대여 종료 시간(DateTimeString, 필수)
        payment_type: 결제 수단(Integer, 필수)
        rental_price: 대여비(UNSIGNED Integer, 필수)
        deposit: 보증금(UNSIGNED Integer, 필수)
        point_price: 사용할 포인트 할인액(UNSIGNED Integer)
        phone_number: 대여자 연락처(String, 필수)

        * 응답: rental_id = 대여 주문 번호
    */
    const {
        place_id, coupon_id,
        rental_start_time, rental_end_time,
        payment_type,
        rental_price, deposit, point_price,
        phone_number
    } = req.body;
    const { user_id: order_user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const omissionResult = omissionChecker({
        place_id, rental_start_time, rental_end_time,
        payment_type, rental_price, deposit,
        phone_number
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const couponID = parseInt(coupon_id); // int 형 변환
        const orderPlace = Place.findOne({
            where: { place_id: placeID }
        }); // 주차공간이 존재하는지 조회.
        if (!orderPlace) {
            // 주차공간이 없으면 대여할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 주차공간입니다.' });
        }
        const {
            user_id: place_user_id,
            oper_start_time, oper_end_time,
            place_fee
        } = orderPlace.dataValues;

        // 대여 시간 비교 알고리즘.
        // 운영시간과 겹치는지 안 겹치는지.
        // 타 대여와 시간 겹치는지 안 겹치는지.
        const orderCoupon = coupon_id ? Coupon.findOne({
            where: { user_id: order_user_id, coupon_id: couponID }
        }) : null; // 쿠폰 가져오기.
        if (coupon_id && !orderCoupon) {
            // 찾을 수 없는 쿠폰임.
            return res.status(202).send({ msg: '조회할 수 없는 쿠폰입니다.' });
        }
        if (orderCoupon && !orderCoupon.dataValues.use_state) {
            // 사용하거나 회수된 쿠폰임.
            return res.status(202).send({ msg: '이미 사용한 쿠폰입니다.' });
        }


        const createRentalOrder = RentalOrder.create({
            order_user_id,
            place_user_id,
            total_price: rental_price,
            term_price: place_fee,
            deposit, point_price,
            rental_start_time: new Date(rental_start_time),
            rental_end_time: new Date(rental_end_time),
            payment_time: 
        }); // 주문 내역 생성.
        if (!createRentalOrder) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(202).send({ msg: 'success', rental_id: createRentalOrder.dataValues.rental_id });
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});



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
