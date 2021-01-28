const express = require('express');
const moment = require('moment');
const router = express.Router();

const { RentalOrder, Coupon, PersonalPayment, Place, Card, User, Review, Sequelize: { Op } } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { isCellPhoneForm, isValidDataType } = require('../lib/formatChecker');
const { sendCreateNotification } = require('../actions/notificationSender');
const { sendDepositPoint, sendWithdrawPoint } = require('../actions/pointManager');
const timeFormatter = require('../lib/timeFormatter');

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const DEPOSIT = 10000; // 보증금

const NOTIFICATION_BASE_URL = '/detail?place_id=';
// 대여 신청은 주차공간 상세보기 페이지로 이동 시킴.



/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        결제 및 대여 등록 요청 API(POST): /api/rental
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        place_id: 결제할 주차공간 id(Interger, 필수)
        cp_id: 사용할 쿠폰 id(Integer)
        rental_start_time: 대여 시작 시간(DateTimeString, 필수)
        rental_end_time: 대여 종료 시간(DateTimeString, 필수)
        rental_price: 대여비(UNSIGNED Integer, 필수)
        point_price: 사용할 포인트 할인 금액(UNSIGNED Integer)
        deposit: 보증금(UNSIGNED Integer, 필수)
        payment_type: 결제 수단(Integer, 0: 카드 | 1: 카카오페이 | 2: 네이버페이 | 3: 페이코, 필수)
        card_id: 결제 카드 id(Integer, payment_type이 0이면 필수)
        phone_number: 대여자 연락처(String, 필수)

        * 응답: rental_id = 대여 주문 번호
    */
    const {
        place_id, cp_id,
        rental_start_time, rental_end_time,
        payment_type,
        rental_price, deposit, point_price,
        card_id,
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
    if (!isCellPhoneForm(phone_number)) {
        return res.status(202).send({ msg: '휴대폰 번호 형식에 맞지 않습니다.' });
    }
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const couponID = parseInt(cp_id); // int 형 변환
        const cardID = parseInt(card_id); // int 형 변환
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
        if (rentalDeposit !== DEPOSIT) {
            return res.status(202).send({ msg: '보증금이 올바르지 않습니다.' });
        }
        const orderUser = await User.findOne({
            where: { user_id: order_user_id }
        }); // 주문 유저가 존재하는지 조회.
        if (!orderUser) {
            // 유저 정보가 없으면 대여할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 유저입니다.' });
        }

        const orderPlace = await Place.findOne({
            where: { place_id: placeID },
            include: [{ model: User }]
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

        /* ----- 대여 시간 비교 알고리즘 ----- */
        const now = Date.now();
        if (now > rentalEndTime.getTime() || now > rentalStartTime.getTime()) {
            // 대여 시간이 현재 시간보다 이전일 수 없음.
            return res.status(202).send({ msg: '현재 이전 시간을 대여할 수 없습니다.' });
        }
        const diffTime = rentalEndTime.getTime() - rentalStartTime.getTime(); // 두 시간의 차이를 구함.
        if (diffTime < 0) {
            // 대여 종료 시간이 대여 시작 시간보다 앞이면 오류.
            return res.status(202).send({ msg: '잘못 설정된 대여 시간입니다.' });
        }
        const feeTime = Math.ceil(diffTime / (30 * MINUTE)); // 30분으로 나눴을 때 나오는 수 * 요금이 전체 요금.
        if ((diffTime !== 30 * MINUTE) && feeTime < 1) {
            // 대여 시간이 30분 이하일 경우
            // 정확하게 30분일 경우엔 예외처리.
            return res.status(202).send({ msg: '최소 대여 시간보다 적게 대여할 수 없습니다.' });
        }
        if (rentalPrice !== place_fee * feeTime) {
            return res.status(202).send({ msg: '잘못 계산된 금액입니다.' });
        }
        // 운영시간과 겹치는지 안 겹치는지.
        if (!moment(rentalStartTime).isBetween(oper_start_time, oper_end_time, undefined, "[]")
            || !moment(rentalEndTime).isBetween(oper_start_time, oper_end_time, undefined, "[]")) {
            // 대여 시간이 운영 시간에 포함되지 않으면 대여할 수 없음.
            return res.status(202).send({ msg: '운영 시간 외에는 대여할 수 없습니다.' });
        }
        // 타 대여와 시간 겹치는지 안 겹치는지.
        const diffOrderList = await RentalOrder.findAll({
            where: {
                place_id: placeID,
                rental_end_time: {
                    [Op.gte]: rentalStartTime
                } // 대여 요청 시작 시간 이후로 이용 예정 되어 있는 모든 대여 정보를 가져옴.
            }
        }); // 대여하려는 place의 대여 리스트를 가져옴.
        const overlapOrderList = diffOrderList.filter(orderData => {
            const { rental_start_time: st, rental_end_time: et, cancel_time } = orderData;
            // 주문 목록에서 해당 주문의 대여 시간 정보를 가져옴.
            return !cancel_time
            && ((moment(st).isBetween(rentalStartTime, rentalEndTime, undefined, "[]") || moment(st).isBetween(rentalStartTime, rentalEndTime, undefined, "[]"))
            || (moment(rentalStartTime).isBetween(st, et, undefined, "[)") || moment(rentalEndTime).isBetween(st, et, undefined, "(]")));
        });
        if (overlapOrderList.length) {
            // 겹치는 대여가 하나라도 있으면 대여할 수 없음.
            return res.status(202).send({ msg: '타 주문과 대여 시간이 중복될 수 없습니다.', detail_info: overlapOrderList });
        }
        /* ----- 대여 시간 비교 알고리즘 완료 ----- */

        /* ----- 카드 확인 ----- */
        const orderCard = card_id ? await Card.findOne({
            where: { user_id: order_user_id, card_id: cardID }
        }) : null; // 카드 가져오기.
        if (paymentType === 0) {
            // 카드 결제일 경우 카드 정보가 필요함
            const omissionBankResult = omissionChecker({ card_id });
            if (!omissionBankResult.result) {
                // 카드 결제 필수 항목이 누락됨.
                return res.status(202).send({ msg: omissionBankResult.message });
            }
            if (!orderCard) {
                // 찾을 수 없는 카드임.
                return res.status(202).send({ msg: '조회할 수 없는 카드입니다.' });
            }
        }
        /* ----- 쿠폰 확인 ----- */
        const orderCoupon = cp_id ? await Coupon.findOne({
            where: { user_id: order_user_id, cp_id: couponID }
        }) : null; // 쿠폰 가져오기.
        if (cp_id && !orderCoupon) {
            // 찾을 수 없는 쿠폰임.
            return res.status(202).send({ msg: '조회할 수 없는 쿠폰입니다.' });
        }
        if (orderCoupon && orderCoupon.dataValues.use_state) {
            // 사용하거나 회수된 쿠폰임.
            return res.status(202).send({ msg: '이미 사용한 쿠폰입니다.' });
        }
        /* ----- 쿠폰 확인 완료  ----- */
        /* ----- 포인트 확인 및 요금 계산 ----- */
        let paymentPrice = rentalPrice + rentalDeposit;
        if (point_price) {
            // 사용 포인트가 있으면 결제 금액에서 차감
            if (orderUser.dataValues.point < pointPrice) {
                // 보유한 포인트보다 많은 포인트를 사용할 수 없음.
                return res.status(202).send({ msg: '사용할 수 없는 포인트입니다.' })
            }
            paymentPrice -= pointPrice;
        }
        if (cp_id) {
            // 사용 쿠폰이 있으면 결제 금액에서 차감
            paymentPrice -= orderCoupon.dataValues.cp_price;
            await Coupon.update(
                { use_state: 1 },
                { where: { user_id: order_user_id, cp_id: couponID } }
            ); // 쿠폰 사용 처리.
        }

        // ****** 계산된 요금이 request한 요금과 일치하는지 확인해야 함.

        /* ----- 결제 정보 추가 ----- */
        const createPersonalPayment = await PersonalPayment.create({
            user_id: order_user_id,
            card_id: orderCard ? cardID : null,
            method: "pay",
            trade_no: Date.now().toString() + '_' + order_user_id + place_id + '00',
            payment_price: paymentPrice,
            payment_type: paymentType, // 결제 방식
            payment_time: new Date(),
            // 은행, 카드 정보
            ppayment_cash: 0,
            ppayment_pg: 'space',
            ppayment_code: 'success',
            ppayment_result: { msg: 'success' }
        }); // 결제 정보를 추가함.
        if (!createPersonalPayment) {
            return res.status(202).send({ msg: '결제에 실패하였습니다.' });
        }
        /* ----- 결제 정보 추가 완료 ----- */


        /* ----- 포인트 전환 ----- */
        if (point_price) {
            await sendWithdrawPoint(order_user_id, pointPrice, "주차공간에서 할인 사용");
        }
        await sendDepositPoint(place_user_id, rentalPrice, "주차공간 대여 수익금");
        /* ----- 포인트 전환 완료 ----- */
        /* ----- 알림 생성 ----- */
        const notification_body = `${orderUser.dataValues.name}님이 ${orderPlace.dataValues.place_name}을 대여 신청하셨습니다.`;
        const notification_type = 'rental';
        const notification_url = NOTIFICATION_BASE_URL + place_id;
        sendCreateNotification(place_user_id, notification_body, notification_type, notification_url);
        /* ----- 알림 생성 완료 ----- */

        /* ----- 대여 정보 추가 ----- */
        const createRentalOrder = await RentalOrder.create({
            order_user_id, // 대여 신청 유저 id
            place_user_id, // 주차공간 보유 유저 id
            ppayment_id: createPersonalPayment.dataValues.ppayment_id, // 결제 정보 id
            place_id: placeID, // 주차공간 id
            cp_id: cp_id ? couponID : null, // 쿠폰 id
            total_price: rental_price, // 전체 금액
            term_price: place_fee, // 기간 금액
            deposit: rentalDeposit, point_price: pointPrice, // 보증금, 포인트 할인 금액
            payment_price: paymentPrice, // 결제 금액
            rental_start_time: timeFormatter(rentalStartTime), // 대여 시작 시간
            rental_end_time: timeFormatter(rentalEndTime), // 대여 종료 시간
            payment_type: paymentType, // 결제 방식
            phone_number // 대여자 연락처
        }); // 주문 내역 생성.
        if (!createRentalOrder) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success', rental_id: createRentalOrder.dataValues.rental_id });
        /* ----- 대여 정보 추가 완료 ----- */
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

        * 응답: orders = [대여 주문 정보(주차공간 포함) Array...]
    */
    const { user_id: order_user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const orders = await RentalOrder.findAll({
            where: { order_user_id },
            include: [{ model: Place }],
            order: [['createdAt', 'DESC']]
        }); // 대여 주문 기록 리스트 조회.
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

        * 응답:
            order = { 대여 주문 정보 Object, 유저 Object, 주차공간 Object },
            review = { 리뷰 Object }
    */
    const { rental_id } = req.params;
    const { user_id: order_user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const rentalID = parseInt(rental_id); // int 형 변환
        const order = await RentalOrder.findOne({
            where: { order_user_id, rental_id: rentalID },
            include: [{ model: User }, { model: Place }, { model: Coupon }]
        }); // 대여 주문 상세 정보 조회.
        if (!order) {
            return res.status(202).send({ msg: '조회할 수 없는 주문 번호입니다.' });
        }
        const review = await Review.findOne({
            where: { user_id: order_user_id, rental_id: rentalID }
        }); // 리뷰가 존재하는지 조회.

        const { place_id, createdAt } = order.dataValues;
        const prev_order = await RentalOrder.findOne({
            where: {
                place_id,
                rental_end_time: { [Op.lte]: createdAt }
            },
            order: [['rental_end_time', 'DESC']],
            attributes: ['rental_id'],
            include: [{ model: User }]
        }); // 이전 대여자를 찾기 위해 검색.

        return res.status(200).send({ msg: 'success', order, review, prev_order });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});



/* UPDATE */
router.put('/:rental_id', verifyToken, async (req, res, next) => {
    /*
        대여 취소 신청 API(PUT): /api/rental/:rental_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: rental_id }: 삭제할 대여 주문 번호

        * 응답: success / failure
    */
    const { rental_id } = req.params;
    const { user_id: order_user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const rentalID = parseInt(rental_id); // int 형 변환

        const cancelUser = await User.findOne({
            where: { user_id: order_user_id }
        }); // 주문 유저가 존재하는지 조회.
        if (!cancelUser) {
            // 유저 정보가 없으면 대여할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 유저입니다.' });
        }
        const { point: cancel_user_point } = cancelUser.dataValues;

        const existRentalOrder = await RentalOrder.findOne({
            where: { order_user_id, rental_id: rentalID }
        }); // 대여 주문이 존재하는지 조회.
        if (!existRentalOrder) {
            return res.status(202).send({ msg: '조회할 수 없는 주문 번호입니다.' })
        }
        const {
            place_user_id,
            place_id,
            ppayment_id,
            payment_price,
            payment_type,
            rental_start_time,
            cp_id,
            total_price,
            point_price
        } = existRentalOrder.dataValues;
        const rentalStartTime = new Date(rental_start_time); // Date 형 변환
        if (rentalStartTime.getTime() < Date.now()) {
            // 취소하는 시간이 대여 시작 시간을 넘으면 취소할 수 없음.
            return res.status(202).send({ msg: '이미 대여 중인 주차공간입니다.' });
        }

        const orderPersonalPayment = await PersonalPayment.findOne({
            where: { user_id: order_user_id, ppayment_id }
        }); // 결제 정보 조회.
        if (!orderPersonalPayment) {
            return res.status(202).send({ msg: '결제하지 않은 주문 번호입니다.' });
        }
        const cancelPlace = await Place.findOne({
            where: { place_id },
            include: [{ model: User }]
        }); // 주차공간이 존재하는지 조회.
        if (!cancelPlace) {
            // 주차공간이 없으면 대여할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 주차공간입니다.' });
        }
        const { point: place_user_point, } = cancelPlace.dataValues.user;

        const { card_id } = orderPersonalPayment.dataValues;

        /* ----- 결제 취소 ----- */
        const createPersonalPayment = await PersonalPayment.create({
            user_id: order_user_id, card_id,
            method: "calcel",
            trade_no: Date.now().toString() + '_' + order_user_id + place_id + '11',
            payment_price, payment_type,
            payment_time: new Date(),
            // 은행, 카드 정보
            ppayment_cash: 0,
            ppayment_pg: 'space',
            ppayment_code: 'success',
            ppayment_result: { msg: 'success' }
        }); // 결제 취소 정보를 추가함.
        if (!createPersonalPayment) {
            return res.status(202).send({ msg: '결제에 실패하였습니다.' });
        }
        /* ----- 결제 취소 완료 ----- */

        if (cp_id) {
            await Coupon.update(
                { use_state: 0 },
                { where: { user_id: order_user_id, cp_id } }
            ); // 쿠폰 사용 철회.
        }
        /* ----- 포인트 전환 ----- */
        if (point_price) {
            sendDepositPoint(order_user_id, cancel_user_point, point_price, "주차공간에서 할인 사용");
        }
        sendWithdrawPoint(place_user_id, place_user_point, total_price, "주차공간 대여 수익금");
        /* ----- 포인트 전환 완료 ----- */
        /* ----- 알림 생성 ----- */
        const notification_body = `${cancelUser.dataValues.name}님이 ${cancelPlace.dataValues.place_name}을 대여 취소하셨습니다.`;
        const notification_type = 'cancel';
        const notification_url = NOTIFICATION_BASE_URL + place_id;
        sendCreateNotification(place_user_id, notification_body, notification_type, notification_url);
        /* ----- 알림 생성 완료 ----- */

        /* ----- 결제 취소 상태 기입 ----- */
        const updateRentalOrder = RentalOrder.update({
            cancel_time: new Date(),
            cancel_reason: 'just',
            cancel_price: payment_price
        }, {
            where: { order_user_id, place_user_id, ppayment_id, rental_id }
        }); // 취소 정보 기입.
        if (!updateRentalOrder) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(200).send({ msg: 'success' });
        /* ----- 결제 취소 상태 기입 완료 ----- */
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;
