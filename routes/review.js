/*test해야함*/
const express = require('express');

const omissionChecker = require('../lib/omissionChecker');

const verifyToken = require('./middlewares/verifyToken');

const { Review } = require('../models');

const router = express.Router();
require('dotenv').config();

/*
- 리뷰 리스트 요청 API(GET): /api/review
    { headers }: JWT_TOKEN(유저 로그인 토큰)
	* 응답: reviews: [리뷰 Array…]
*/
router.get('/', verifyToken, async (req, res, next) => {
    if (req.body === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { email } = req.decodedToken;
    const reviews = await Review.findAll({ where: { email } });
    res.send(reviews);
});

/*
- 리뷰 상세 정보 요청 API(GET): /api/review/:review_id
	{ params: review_id }: 리뷰 id

	* 응답: review: 리뷰 상세 정보
*/
router.get('/:review_id', async (req, res, next) => {
    if (req.params === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { review_id } = req.params;
    const review = await Review.findOne({ where: { review_id } });
    if (!review) {
        return res.send({ msg: '리뷰 정보가 없습니다.' });
    }
    res.send(review);
});

/*
- 리뷰 작성 요청 API(POST): /api/review
	{ headers }: JWT_TOKEN(유저 로그인 토큰)
	rental_id: 대여 주문 번호
	place_id: 대여한 주차공간 id ======> DB 변경 필요
	review_body: 리뷰 내용
    review_rating: 리뷰 평점
*/
router.post('/', verifyToken, async (req, res, next) => {
    if (req.body === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { rental_id, place_id, review_body, review_rating } = req.body;
    const omissionResult = omissionChecker({
        rental_id,
        place_id,
        review_body,
        review_rating,
    });
    if (!omissionResult.result) {
        return res.send({ msg: omissionResult.message });
    }
    const newReview = await Review.create({
        rental_id,
        place_id,
        review_body,
        review_rating,
    });
    if (!newReview) {
        return res.send({ msg: '리뷰를 등록하지 못했습니다.' });
    }
    res.send({ msg: 'success' });
});

/*
- 리뷰 수정 요청 API(PUT): /api/review/:review_id
	{ headers }: JWT_TOKEN(유저 로그인 토큰)
	{ params: review_id }: 수정할 리뷰 id
	review_body: 수정할 리뷰 내용
    review_rating: 수정할 리뷰 평점
*/
router.put('/:review_id', verifyToken, async (req, res, next) => {
    if (req.body === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { review_id } = req.params;
    const { review_body, review_rating } = req.body;
    const omissionResult = omissionChecker({
        review_body,
        review_rating,
    });
    if (!omissionResult.result) {
        return res.send({ msg: omissionResult.message });
    }
    const review = await Review.update(
        { review_body, review_rating },
        { where: { review_id } },
    );
    if (!review) {
        return res.send({ msg: '리뷰를 수정하지 못했습니다.' });
    }
    res.send({ msg: 'success' });
});

module.exports = router;
