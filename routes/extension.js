const express = require('express');
const moment = require('moment');
const router = express.Router();

const { User, Card, Place, RentalOrder, ExtensionOrder, PersonalPayment, Sequelize: { Op } } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { isValidDataType } = require('../lib/formatChecker');
const { sendCreateNotification } = require('../actions/notificationSender');
const { sendDepositPoint } = require('../actions/pointManager');


const SECOND = 1000;
const MINUTE = 60 * SECOND;

const NOTIFICATION_BASE_URL = '/detail?place_id=';
// 연장 신청은 주차공간 상세보기 페이지로 이동 시킴.



/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        연장 신청 API(POST): /api/extension
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        rental_id: 대여 주문 번호(Integer, 필수)
        extension_end_time: 연장 종료 시간(DateTImeString, 필수)
        extension_price: 연장 추가비(UNSIGNED Integer, 필수)
        payment_type: 결제 수단(Integer, 0: 카드 | 1: 카카오페이 | 2: 네이버페이 | 3: 페이코, 필수)
        card_id: 결제 카드 id(Integer, payment_type이 0이면 필수)

        * 응답: success / failure
    */
    const {
        rental_id,
        extension_end_time,
        payment_type,
        extension_price,
        card_id
    } = req.body;
    const { user_id: order_user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({
        rental_id, extension_end_time,
        payment_type, extension_price
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const cardID = parseInt(card_id); // int 형 변환
        const rentalID = parseInt(rental_id); // int 형 변환
        const extensionEndTime = new Date(extension_end_time); // Date 형 변환
        const paymentType = parseInt(payment_type); // int 형 변환
        const extensionPrice = Math.abs(parseInt(extension_price)); // unsigned int 형 변환
        const validDataType = isValidDataType({
            extension_end_time: extensionEndTime,
            extension_price: extensionPrice,
            payment_type: paymentType
        }); // 데이터 형식 검사.
        if (!validDataType.result) {
            // 데이터의 형식이 올바르지 않음.
            return res.status(202).send({ msg: validDataType.message });
        }
        const orderUser = await User.findOne({
            where: { user_id: order_user_id }
        }); // 주문 유저가 존재하는지 조회.
        if (!orderUser) {
            // 유저 정보가 없으면 대여할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 유저입니다.' });
        }

        const existRentalOrder = await RentalOrder.findOne({
            where: { order_user_id, rental_id: rentalID }
        }); // 대여 주문이 존재하는지 조회.
        if (!existRentalOrder) {
            return res.status(202).send({ msg: '조회할 수 없는 주문 번호입니다.' })
        }
        const {
            place_user_id,
            place_id,
            total_price,
            payment_price,
            rental_end_time
        } = existRentalOrder.dataValues;
        const orderPlace = await Place.findOne({
            where: { place_id },
            include: [{ model: User }]
        }); // 주차공간 조회.
        const { oper_start_time, oper_end_time, place_fee } = orderPlace.dataValues;

        const rentalEndTime = new Date(rental_end_time); // Date 형 변환

        /* ----- 대여 시간 비교 알고리즘 ----- */
        const diffTime = extensionEndTime.getTime() - rentalEndTime.getTime(); // 두 시간의 차이를 구함.
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
        if (extensionPrice !== place_fee * feeTime) {
           return res.status(202).send({ msg: '잘못 계산된 금액입니다.' });
        }
        // 운영시간과 겹치는지 안 겹치는지.
        if (!moment(rentalEndTime).isBetween(oper_start_time, oper_end_time, undefined, "[]")
            || !moment(extensionEndTime).isBetween(oper_start_time, oper_end_time, undefined, "[]")) {
            // 연장 시간이 운영 시간에 포함되지 않으면 대여할 수 없음.
            return res.status(202).send({ msg: '운영 시간 외에는 대여할 수 없습니다.' });
        }
        // 타 대여와 시간 겹치는지 안 겹치는지.
        const diffOrderList = await RentalOrder.findAll({
            where: {
                place_id,
                rental_end_time: {
                    [Op.gte]: rentalEndTime
                } // 대여 종료 예정 시간 이후로 이용 예정 되어 있는 모든 대여 정보를 가져옴.
            }
        }); // 연장하려는 place의 대여 리스트를 가져옴.
        const overlapOrderList = diffOrderList.filter(orderData => {
            const { rental_start_time: st, rental_end_time: et, cancel_time } = orderData;
            // 주문 목록에서 해당 주문의 대여 시간 정보를 가져옴.
            return !cancel_time
            && ((moment(st).isBetween(rentalEndTime, extensionEndTime, undefined, "[]") || moment(st).isBetween(rentalEndTime, extensionEndTime, undefined, "[]"))
            || (moment(rentalEndTime).isBetween(st, et, undefined, "[)") || moment(extensionEndTime).isBetween(st, et, undefined, "(]")));
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
        
        // ***** 계산된 요금이 request한 요금과 일치하는지 확인해야 함.

        /* ----- 결제 정보 추가 ----- */
        const createPersonalPayment = await PersonalPayment.create({
            user_id: order_user_id,
            card_id: orderCard ? cardID : null,
            method: "pay",
            trade_no: Date.now().toString() + '_' + order_user_id + place_id + '00',
            payment_price: extensionPrice,
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
        sendDepositPoint(place_user_id, extensionPrice, "주차공간 연장 대여 수익금");
        /* ----- 포인트 전환 완료 ----- */

        /* ----- 알림 생성 ----- */
        const notification_body = `${orderUser.dataValues.name}님이 ${orderPlace.dataValues.place_name}을 연장 신청하셨습니다.`;
        const notification_type = 'extension';
        const notification_url = NOTIFICATION_BASE_URL + place_id;
        sendCreateNotification(place_user_id, notification_body, notification_type, notification_url);
        /* ----- 알림 생성 완료 ----- */

        /* ----- 연장 정보 갱신 및 추가 ----- */
        const updateRentalOrder = await RentalOrder.update({
            total_price: total_price + extensionPrice,
            payment_price: payment_price + extensionPrice,
            rental_end_time: extensionEndTime
        }, {
            where: { order_user_id, rental_id: rentalID }
        }); // 연장 정보 수정.

        const createExtensionOrder = await ExtensionOrder.create({
            rental_id,
            extension_start_time: rentalEndTime,
            extension_end_time: extensionEndTime,
            extension_price: extensionPrice,
            payment_type: paymentType
        }); // 연장 내역 생성.
        if (!createExtensionOrder || !updateRentalOrder) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
        /* ----- 연장 정보 갱신 및 추가 완료 ----- */
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        console.log(e)
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;
