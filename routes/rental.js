const express = require('express');
const moment = require('moment');
const router = express.Router();

const { RentalOrder, Coupon, PersonalPayment, Place } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { isCellPhoneForm } = require('../lib/formatChecker');
const { parse } = require('dotenv/types');


/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        결제 및 대여 등록 요청 API(POST): /api/rental
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        place_id: 결제할 주차공간 id(Interger, 필수)
        coupon_id: 사용할 쿠폰 id(Integer)
        rental_start_time: 대여 시작 시간(DateTimeString, 필수)
        rental_end_time: 대여 종료 시간(DateTimeString, 필수)
        rental_price: 대여비(UNSIGNED Integer, 필수)
        point_price: 사용할 포인트 할인 금액(UNSIGNED Integer)
        deposit: 보증금(UNSIGNED Integer, 필수)
        payment_type: 결제 수단(Integer, 0: 카드 | 1: 카카오페이 | 2: 네이버페이 | 3: 페이코, 필수)
        bank_name: 은행 이름(String, payment_type이 0이면 필수)
        bank_account: 계좌번호(String, payment_type이 0이면 필수)
        card_num: 카드번호(String, payment_type이 0이면 필수)
        card_type: 카드 타입(String, payment_type이 0이면 필수)
        phone_number: 대여자 연락처(String, 필수)

        * 응답: rental_id = 대여 주문 번호
    */
    const {
        place_id, coupon_id,
        rental_start_time, rental_end_time,
        payment_type,
        rental_price, deposit, point_price,
        bank_name, bank_account, card_num, card_type,
        phone_number
    } = req.body;
    const { user_id: order_user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({
        place_id, rental_start_time, rental_end_time,
        payment_type, rental_price, deposit,
        phone_number
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    if (payment_type === 0) {
        // 카드 결제일 경우 은행 정보가 필요함
        const omissionBankResult = omissionChecker({
            bank_name, bank_account, card_num, card_type
        });
        if (!omissionBankResult.result) {
            // 카드 결제 필수 항목이 누락됨.
            return res.status(202).send({ msg: omissionBankResult.message });
        }
    }
    if (!isCellPhoneForm(phone_number)) {
        return res.status(202).send({ msg: '휴대폰 번호 형식에 맞지 않습니다.' });
    }
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const couponID = parseInt(coupon_id); // int 형 변환
        const rentalStartTime = new Date(rental_start_time); // Date 형 변환
        const rentalEndTime = new Date(rental_end_time); // Date 형 변환
        const paymentType = parseInt(payment_type); // int 형 변환
        const rentalPrice = Math.abs(parseInt(rental_price)); // unsigned int 형 변환
        const pointPrice = Math.abs(parseInt(point_price)); // unsigned int 형 변환
        const rentalDeposit = Math.abs(parseInt(deposit)); // unsigned int 형 변환
        const validDataType = isValidDataType({
            rental_start_time: rentalStartTime, rental_end_time: rentalEndTime,
            rental_price: rentalPrice, deposit: rentalDeposit,
            payment_type: paymentType
        }); // 데이터 형식 검사.
        if (!validDataType.result) {
            // 데이터의 형식이 올바르지 않음.
            return res.status(202).send({ msg: validDataType.message });
        }
        
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

        /* ----- 쿠폰 확인 ----- */
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

        /* ----- 포인트 확인 ----- */
        let payment_price = rental_price + deposit;
        if (point_price) {
            // 사용 포인트가 있으면 결제 금액에서 차감
            payment_price -= point_price;
        }
        if (coupon_id) {
            // 사용 쿠폰이 있으면 결제 금액에서 차감
            payment_price -= orderCoupon.dataValues.cp_price;
        }

        /* ----- 결제 정보 추가 ----- */
        const createPersonalPayment = PersonalPayment.create({
            method: "pay",
            trade_no: Date.now().toString(),
            payment_price,
            payment_time: new Date(),
            settle_case: 'card',
            // 은행, 카드 정보
            bank_name, bank_account, card_num, card_type,
            ppayment_cash: 0,
            ppayment_pg: 'space',
            ppayment_code: 'success',
            ppayment_result: { msg: 'success' }
        }); // 결제 정보를 추가함.
        if (!createPersonalPayment) {
            return res.status(202).send({ msg: '결제에 실패하였습니다.' });
        }

        /* ----- 대여 정보 추가 ----- */
        const createRentalOrder = RentalOrder.create({
            order_user_id, // 대여 신청 유저 id
            place_user_id, // 주차공간 보유 유저 id
            ppayment_id: createPersonalPayment.dataValues.ppayment_id, // 결제 정보 id
            place_id: placeID, // 주차공간 id
            coupon_id: coupon_id ? couponID : null, // 쿠폰 id
            total_price: rental_price, // 전체 금액
            term_price: place_fee, // 기간 금액
            deposit, point_price, // 보증금, 포인트 할인 금액
            payment_price, // 결제 금액
            rental_start_time: new Date(rental_start_time), // 대여 시작 시간
            rental_end_time: new Date(rental_end_time), // 대여 종료 시간
            payment_type, // 결제 방식
            phone_number // 대여자 연락처
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
    /* request 데이터 읽어 옴. */
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
    const { rental_id } = req.params;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const rentalID = parseInt(rental_id); // int 형 변환
        const order = await RentalOrder.findOne({
            where: { user_id, rental_id: rentalID }
        }); // 수익금 상세 정보 조회.
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
