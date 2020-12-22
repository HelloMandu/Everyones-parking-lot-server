const express = require('express');
const router = express.Router();

const { Like, Place, User } = require('../models');

const { sendCreateNotification, sendDeleteNotification } = require('../actions/notificationSender');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');

const NOTIFICATION_BASE_URL = '/detail?place_id=';
// 좋아요는 주차공간 상세보기 페이지로 이동 시킴.



/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        주차공간 좋아요 추가 요청 API(POST): /api/like
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        place_id: 주차공간 id(Integer, 필수)

        * 응답: status = 변경된 좋아요 상태
    */
    const { place_id } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ place_id });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const existUser = await User.findOne({
            where: { user_id }
        }); // 좋아요 누른 유저가 존재하는지 확인.
        if (!existUser) {
            return res.status(202).send({ msg: '조회할 수 없는 유저입니다.' });
        }
        const existPlace = await Place.findOne({
            where: { place_id: placeID }
        }); // 주차공간이 존재하는지 확인.
        if (!existPlace) {
            return res.status(202).send({ msg: '조회할 수 없는 주차공간입니다.' });
        }
        const existLike = await Like.findOne({
            where: { user_id, place_id: placeID }
        }); // 좋아요가 있는지 확인.
        if (existLike) {
            // 좋아요가 있으면 추가할 수 없음.
            return res.status(202).send({ msg: '이미 좋아요를 한 주차공간입니다.' });
        }

        /* ----- 알림 생성 ----- */
        const notification_body = `${existUser.dataValues.name}님이 ${existPlace.dataValues.place_name}을 즐겨찾기 하셨습니다.`;
        const notification_type = 'like';
        const notification_url = NOTIFICATION_BASE_URL + place_id;
        const notification_id = await sendCreateNotification(existPlace.dataValues.user_id, notification_body, notification_type, notification_url);
        /* ----- 알림 생성 완료 ----- */

        const createLike = await Like.create({
            user_id,
            place_id: placeID,
            notification_id
        }); // 좋아요 추가.
        if (!createLike) {
            return res.status(202).send({ msg: 'failure', status: false });
        }
        return res.status(201).send({ msg: 'success', status: true });
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
        주차공간 좋아요 유무 요청 API(GET): /api/like
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        place_id: 좋아요 유무 확인할 주차공간 id(Integer, 필수)

        * 응답: status = 좋아요 상태        
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
        const existLike = await Like.findOne({
            where: { user_id, place_id: placeID }
        }); // 좋아요가 있는지 확인.
        return res.status(200).send({ msg: 'success', status: existLike ? true : false });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});



/* DELETE */
router.delete('/', verifyToken, async (req, res, next) => {
    /*
        주차공간 좋아요 제거 요청 API(DELETE): /api/like
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        place_id: 주차공간 id(Integer, 필수)

        * 응답: status = 변경된 좋아요 상태
    */
    const { place_id } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ place_id });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const existLike = await Like.findOne({
            where: { user_id, place_id: placeID }
        }); // 좋아요가 있는지 확인.
        if (!existLike) {
            // 좋아요가 없으면 삭제할 수 없음.
            return res.status(202).send({ msg: '좋아요하지 않은 주차공간입니다.' });
        }

        /* ----- 알림 제거 ----- */
        sendDeleteNotification(existLike.dataValues.notification_id);
        /* ----- 알림 제거 완료 ----- */

        const deleteLike = await Like.destroy({
            where: {
                user_id,
                place_id: placeID
            }
        }); // 좋아요 삭제.
        if (!deleteLike) {
            return res.status(202).send({ msg: 'failure', status: true });
        }
        return res.status(200).send({ msg: 'success', status: false });
    } catch (e) {
        // DB 삭제 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;