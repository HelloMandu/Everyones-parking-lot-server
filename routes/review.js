const express = require('express');
const router = express.Router();

const { Review } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');



/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        리뷰 작성 요청 API(POST): /api/review
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        
        rental_id: 대여 주문 번호(Integer, 필수)
        place_id: 대여한 주차공간(Integer, 필수)
        review_body: 리뷰 내용(String, 필수)
        review_rating: 리뷰 평점(Float, 필수)

        * 응답: success / failure
    */
    const { rental_id, place_id, review_body, review_rating } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const omissionResult = omissionChecker({
        rental_id,
        place_id,
        review_body,
        review_rating,
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const placeID = parseInt(place_id); // int 형 변환
        
        const existReview = await Review.findOne({
            where: { user_id, rental_id, place_id: placeID }
        }); // 기존에 작성한 리뷰가 있는지 확인.
        if (existReview) {
            // 리뷰가 있으면 작성할 수 없음.
            return res.status(202).send({ msg: '이미 리뷰가 등록된 주차공간입니다.' });
        }
        const createReview = await Review.create({
            user_id,
            rental_id,
            place_id: placeID,
            review_body,
            review_rating: parseFloat(review_rating),
        }); // 리뷰 작성.
        if (!createReview) {
            return res.status(202).send({ msg: 'failure' });
        }
        res.status(201).send({ msg: 'success' });
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
        리뷰 리스트 요청 API(GET): /api/review
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: reviews = [리뷰 Array...]
    */
    const { user_id } = req.decodedToken; // JWT_TOKEN에서 추출한 값 가져옴
    try {
        const reviews = await Review.findAll({
            where: { user_id }
        }); // 리뷰 리스트 조회.
        res.status(200).send({ msg: 'success', reviews });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.get('/:review_id', async (req, res, next) => {
    /*
        리뷰 상세 정보 요청 API(GET): /api/review/:review_id
        { params: review_id }: 상세 보기할 리뷰 id

        * 응답: review = { 리뷰 상세 정보 Object }
    */
    const { review_id } = req.params;
    try {
        const reviewID = parseInt(review_id); // int 형 변환
        const review = await Review.findOne({
            where: { review_id: reviewID }
        }); // 리뷰 상세 정보 조회.
        if (!review) {
            return res.status(202).send({ msg: '조회할 수 없는 리뷰입니다.' });
        }
        return res.status(201).send({ msg: 'success', review });
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
router.put('/:review_id', verifyToken, async (req, res, next) => {
    /*
        리뷰 수정 요청 API(PUT): /api/review/:review_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: review_id }: 수정할 리뷰 id
        
        review_body: 수정할 리뷰 내용(String, 필수)
        review_rating: 수정할 리뷰 평점(String, 필수)

        * 응답: success / failure
    */
    const { review_id } = req.params;
    const { review_body, review_rating } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const omissionResult = omissionChecker({
        review_body,
        review_rating,
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const reviewID = parseInt(review_id); // int 형 변환
        const existReview = await Review.findOne({
            where: { review_id: reviewID, user_id }
        }); // 수정할 리뷰가 존재하는지 확인.
        if (!existReview) {
            // 리뷰가 없으면 수정할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 리뷰입니다.' });
        }
        const updateReview = await Review.update(
            { review_body, review_rating },
            { where: { review_id: reviewID, user_id } },
        ); // 리뷰 수정.
        if (!updateReview) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});



/* DELETE */
router.delete('/:review_id', verifyToken, async (req, res, next) => {
    /*
        리뷰 삭제 요청 API(DELETE): /api/review/:review_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: review_id }: 삭제할 리뷰 id

        * 응답: success / failure
    */
    const { review_id } = req.params;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    try {
        const reviewID = parseInt(review_id); // int 형 변환
        const existReview = await Review.findOne({
            where: { review_id: reviewID, user_id }
        }); // 삭제할 리뷰가 존재하는지 확인.
        if (!existReview) {
            // 리뷰가 없으면 삭제할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 리뷰입니다.' });
        }
        const deleteReview = await Review.destroy({
            where: { review_id: reviewID, user_id }
        }); // 리뷰 삭제.
        if (!deleteReview) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(200).send({ msg: 'success' });
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
