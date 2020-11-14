/*test해야함*/
const express = require('express');

const omissionChecker = require('../lib/omissionChecker');

const verifyToken = require('./middlewares/verifyToken');

const { Review } = require('../models');

const router = express.Router();

/*
    리뷰 리스트 요청 API(GET): /api/review
    { headers }: JWT_TOKEN(유저 로그인 토큰)

	* 응답: reviews = [리뷰 Array…]
*/
router.get('/', verifyToken, async (req, res, next) => {
    const { user_id } = req.decodedToken;
    try {
        const reviews = await Review.findAll({ where: { user_id } });
        res.status(200).send({ msg: 'success', reviews });
    } catch (e) {
        if (e.table) {
            res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(400).send({ msg: 'database error', error });
        }
    }
});

/*
    리뷰 상세 정보 요청 API(GET): /api/review/:review_id
	{ params: review_id }: 리뷰 id

	* 응답: review = { 리뷰 상세 정보 Object }
*/
router.get('/:review_id', async (req, res, next) => {
    const { review_id } = req.params;
    try {
        const review = await Review.findOne({ where: { review_id } });
        if (!review) {
            return res.status(404).send({ msg: '리뷰 정보가 없습니다.' });
        }
        res.status(200).send({ msg: 'success', review });
    } catch (e) {
        if (e.table) {
            res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(400).send({ msg: 'database error', error });
        }
    }
});

/*
    리뷰 작성 요청 API(POST): /api/review
	{ headers }: JWT_TOKEN(유저 로그인 토큰)
    
    rental_id: 대여 주문 번호(Integer, 필수)
	place_id: 대여한 주차공간(Integer, 필수)
	review_body: 리뷰 내용(String, 필수)
    review_rating: 리뷰 평점(Float, 필수)
*/
router.post('/', verifyToken, async (req, res, next) => {
    const { rental_id, place_id, review_body, review_rating } = req.body;
    const omissionResult = omissionChecker({
        rental_id,
        place_id,
        review_body,
        review_rating,
    });
    if (!omissionResult.result) {
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const { user_id } = req.decodeToken;
        const existReview = await Review.findOne({
            where: { user_id, rental_id, place_id }
        });
        if (existReview) {
            return res.status(202).send({ msg: '이미 리뷰가 등록된 주차공간입니다.' });
        }
        const createReview = await Review.create({
            user_id,
            rental_id,
            place_id,
            review_body,
            review_rating,
        });
        if (!createReview) {
            return res.status(202).send({ msg: '리뷰를 등록하지 못했습니다.' });
        }
        res.status(201).send({ msg: 'success' });
    } catch (e) {
        if (e.table) {
            res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(400).send({ msg: 'database error', error });
        }
    }
});

/*
- 리뷰 수정 요청 API(PUT): /api/review/:review_id
    { headers }: JWT_TOKEN(유저 로그인 토큰)
    { params: review_id }: 수정할 리뷰 id
    
	review_body: 수정할 리뷰 내용(String, 필수)
    review_rating: 수정할 리뷰 평점(String, 필수)
*/
router.put('/:review_id', verifyToken, async (req, res, next) => {
    const { review_id } = req.params;
    const { review_body, review_rating } = req.body;
    const omissionResult = omissionChecker({
        review_body,
        review_rating,
    });
    if (!omissionResult.result) {
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const { user_id } = req.decodeToken;
        const existReview = await Review.findOne({
            where: { review_id, user_id }
        });
        if (!existReview) {
            return res.status(404).send({ msg: '없거나 삭제된 리뷰입니다.' });
        }
        const updateReview = await Review.update(
            { review_body, review_rating },
            { where: { review_id, user_id } },
        );
        if (!updateReview) {
            return res.status(202).send({ msg: '리뷰를 수정하지 못했습니다.' });
        }
        res.status(201).send({ msg: 'success' });
    } catch (e) {
        if (e.table) {
            res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(400).send({ msg: 'database error', error });
        }
    }
});

module.exports = router;
