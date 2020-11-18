const express = require('express');
const router = express.Router();

const { Place } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { MINUTE } = require('../lib/calculateDate');

const DEPOSIT = 10000; // 보증금


router.get('/', verifyToken, async (req, res, next) => {
    /*
        결제 정보 요청 API(GET): /api/order
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        place_id: 결제할 주차공간 id(Integer, 필수)
        rental_start_time: 대여 시작 시간(DateTimeString, 필수)
        rental_end_time: 대여 종료 시간(DateTimeString, 필수)

        * 응답: place = { 주차공간 정보 Object, 요금, 보증금 }
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const { place_id, rental_start_time, rental_end_time } = req.query;
    const omissionResult = omissionChecker({ place_id, rental_start_time, rental_end_time });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const orderPlace = Place.findOne({
            where: { place_id: placeID }
        }); // 결제할 주차공간이 존재하는지 확인.
        if (!orderPlace) {
            // 주차공간이 없으면 결제 정보를 응답할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 주차공간입니다.' });
        }
        const { place_fee } = orderPlace.dataValues;
        const startTime = new Date(rental_start_time);
        const endTime = new Date(rental_end_time);
        // 전체 요금을 계산하기 위해 두 Date 객체 생성.
        const diffTime = endTime.getTime() - startTime.getTime(); // 두 시간의 차이를 구함.

        const feeTime = Math.round(diffTime / (30 * MINUTE)); // 30분으로 나눴을 때 나오는 수 * 요금이 전체 요금.

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