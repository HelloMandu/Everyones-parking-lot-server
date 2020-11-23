const express = require('express');
const router = express.Router();

const { Place } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { isValidDataType } = require('../lib/formatChecker');

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const DEPOSIT = 10000; // 보증금



/* READ */
router.get('/', verifyToken, async (req, res, next) => {
    /*
        결제 정보 요청 API(GET): /api/order
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        place_id: 결제할 주차공간 id(Integer, 필수)
        rental_start_time: 대여 시작 시간(DateTimeString, 필수)
        rental_end_time: 대여 종료 시간(DateTimeString, 필수)

        * 응답: place = { 주차공간 정보 Object, 요금, 보증금 }
    */
   
    const { place_id, rental_start_time, rental_end_time } = req.query;
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ place_id, rental_start_time, rental_end_time });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const rentalStartTime = new Date(rental_start_time); // Date 형 변환
        const rentalEndTime = new Date(rental_end_time); // Date 형 변환
        const validDataType = isValidDataType({
            rental_start_time: rentalStartTime,
            rental_end_time: rentalEndTime
        }); // 데이터 형식 검사.
        if (!validDataType.result) {
            // 데이터의 형식이 올바르지 않음.
            return res.status(202).send({ msg: validDataType.message });
        }

        const orderPlace = Place.findOne({
            where: { place_id: placeID }
        }); // 결제할 주차공간이 존재하는지 확인.
        if (!orderPlace) {
            // 주차공간이 없으면 결제 정보를 응답할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 주차공간입니다.' });
        }

        /* 요금 계산 */
        const { place_fee } = orderPlace.dataValues;
        // 전체 요금을 계산하기 위해 두 Date 객체 생성.
        const diffTime = rentalEndTime.getTime() - rentalStartTime.getTime(); // 두 시간의 차이를 구함.
        if (diffTime < 0) {
            // 대여 종료 시간이 대여 시작 시간보다 앞이면 오류.
            return res.status(202).send({ msg: '잘못 설정된 대여 시간입니다.' });
        }
        const feeTime = Math.round(diffTime / (30 * MINUTE)); // 30분으로 나눴을 때 나오는 수 * 요금이 전체 요금.
        if (feeTime < 1) {
            // 대여 시간이 30분 이하일 경우
            return res.status(202).send({ msg: '최소 대여 시간보다 적게 대여할 수 없습니다.' });
        }
        /* 요금 계산 완료 */

        return res.status(200).send({ msg: 'success', place: orderPlace, total_price: place_fee * feeTime, deposit: DEPOSIT });
        // 보증금, 전체 요금, 주차공간 정보를 모두 반환.
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;