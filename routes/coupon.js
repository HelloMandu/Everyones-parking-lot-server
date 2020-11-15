const express = require('express');
const router = express.Router();

const { Coupon } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');



/* READ */
router.get('/', verifyToken, async (req, res, next) => {
    /*
        사용 가능한 쿠폰 요청 API(GET): /api/coupon
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        
        place_id: 결제할 주차공간 id(Integer, 필수)

        * 응답: coupons = [사용 가능한 쿠폰 Array...]
    */
    const { place_id } = req.query;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const omissionResult = omissionChecker({ place_id });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const coupons = await Coupon.findOne({
            where: { user_id, place_id: placeID }
        }); // 사용 가능한 쿠폰 리스트 조회.
        return res.status(200).send({ msg: 'success', coupons });
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
