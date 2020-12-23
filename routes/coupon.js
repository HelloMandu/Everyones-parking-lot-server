const express = require('express');
const moment = require('moment');
const router = express.Router();

const { Coupon, CouponZone, Sequelize: { Op } } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');


/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        쿠폰 코드 입력 요청 API(POST): /api/coupon
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        cp_code: 쿠폰 코드(String, 필수)

        * 응답: success / failure
    */
    const { cp_code } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ cp_code });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const coupon_zone = await CouponZone.findOne({
            where: { cz_id: cp_code }
        }); // 쿠폰 코드가 쿠폰존에 등록되어 있는지 조회.
        if (!coupon_zone) {
            // 쿠폰 코드가 없으면 쿠폰을 발급 받을 수 없음.
            return res.status(202).send({ msg: '유효하지 않은 쿠폰 코드입니다.' });
        }
        const existCoupon = await Coupon.findOne({
            where: { user_id, cz_id: cp_code }
        }); // 발급 받은 적 있는 쿠폰인지 조회.
        if (existCoupon) {
            // 발급 받은 적 있으면 쿠폰을 발급 받을 수 없음.
            return res.status(202).send({ msg: '이미 발급 받으신 쿠폰 코드입니다.' });
        }

        const { cz_id, cz_subject, cz_target, cz_period, cz_price, cz_minimum, cz_download } = coupon_zone.dataValues;
        const createCoupon = await Coupon.create({
            user_id,
            cz_id,
            cp_subject: cz_subject,
            cp_target: cz_target,
            cp_price: cz_price,
            cp_minimun: cz_minimum,
            cp_start_date: new Date(),
            cp_end_date: moment().add(cz_period, 'days')
        }); // 유저 쿠폰 생성.
        if (!createCoupon) {
            return res.status(202).send({ msg: 'failure' });
        }
        await CouponZone.update(
            { cz_download: cz_download + 1 },
            { where: { cz_id: cp_code } }
        ); // 쿠폰존 다운로드 횟수를 줄임.
        return res.status(201).send({ msg: 'success', coupon: createCoupon });
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
})


/* READ */
router.get('/', verifyToken, async (req, res, next) => {
    /*
        사용 가능한 쿠폰 리스트 요청 API(GET): /api/coupon
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        
        place_id: 결제할 주차공간 id(Integer, 필수)

        * 응답: coupons = [사용 가능한 쿠폰 Array...]
    */
    const { place_id } = req.query;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ place_id });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const coupons = await Coupon.findAll({
            where: { user_id, use_state: 0 },
            order: [['createdAt', 'DESC']]
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

router.get('/my', verifyToken, async (req, res, next) => {
    /*
        내 쿠폰 리스트 요청 API(GET): /api/coupon/my
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        
        order_type: 정렬 방식

        * 응답: coupons = [쿠폰 Array...]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const coupons = await Coupon.findAll({
            where: { user_id, use_state: 0 },
            order: [['createdAt', 'DESC']]
        }); // 내 쿠폰 리스트 조회.
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

router.get('/book', verifyToken, async (req, res, next) => {
    /*
        쿠폰북 리스트 요청 API(GET): /api/coupon/book
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        
        order_type: 정렬 방식

        * 응답: coupons = [쿠폰 Array...]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const couponZones = await CouponZone.findAll({
            where: {
                cz_end_date: {
                    [Op.gte]: new Date()
                }
            },
            order: [['createdAt', 'DESC']]
        }); // 쿠폰북 리스트 조회.
        const coupons = [];
        for (let i = 0; i < couponZones.length; i++) {
            const { cz_id } = couponZones[i].dataValues;
            const existCoupon = await Coupon.findOne({
                where: { user_id, cz_id }
            }); // 다운 받은 적이 있는 쿠폰은 다운로드 했다고 표시.
            couponZones[i].dataValues.down_status = existCoupon ? true : false;
            coupons.push(couponZones[i].dataValues);
        }; // 다운로드했던 쿠폰 표시.

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

router.get('/use', verifyToken, async (req, res, next) => {
    /*
        쿠폰 사용 내역 리스트 요청 API(GET): /api/coupon/use
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: coupons = [쿠폰 Array...]
    */
   const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
   /* request 데이터 읽어 옴. */
   try {
       const coupons = await Coupon.findAll({
           where: { user_id, use_state: 1 },
           order: [['createdAt', 'DESC']]
       }); // 쿠폰 사용 내역 리스트 조회.
       return res.status(200).send({ msg: 'success', coupons });
   } catch (e) {
       // DB 조회 도중 오류 발생.
       if (e.table) {
           return res.status(202).send({ msg: foreignKeyChecker(e.table) });
       } else {
           return res.status(202).send({ msg: 'database error', error: e });
       }
   }
})

module.exports = router;
