const express = require('express');
const router = express.Router();

const { Card } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { isValidDataType } = require('../lib/formatChecker');
const timeFormatter = require('../lib/timeFormatter');

const cardName = [
    "현대카드",
    "삼성카드",
    "삼성카드",
    "삼성카드",
    "삼성카드",
    "삼성카드",
    "삼성카드",
    "삼성카드"
];


/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        카드 등록 요청 API(POST): /api/card
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        
        card_num: 카드 번호(String, 필수)
        card_password: 카드 비밀번호(String, 필수)
        valid_term: 유효 기간(DateString, 필수)
        cvc: cvc 코드(String, 필수)

        * 응답: card = { 카드 정보 Object }
    */
    const { card_num, valid_term, cvc, card_password } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ card_num, valid_term, cvc, card_password });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const card_type = Math.ceil(Math.random() * 8); // 1 ~ 8 랜덤 값.
        const validTerm = new Date(valid_term); // Date 형 변환

        const validDataType = isValidDataType({
            valid_term: validTerm
        }); // 데이터 형식 검사.
        if (!validDataType.result) {
            // 데이터의 형식이 올바르지 않음.
            return res.status(202).send({ msg: validDataType.message });
        }
        const createCard = await Card.create({
            user_id,
            bank_name: cardName[card_type - 1],
            card_num, card_type, valid_term: timeFormatter(validTerm), cvc
        }); // 카드 등록.
        if (!createCard) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success', card: createCard });
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
        등록된 카드 리스트 요청 API(POST): /api/card
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: cards = [사용 가능한 카드 Array...]
        * card_type은 이미지 번호
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const cards = await Card.findAll({
            where: { user_id },
        }); // 사용가능한 카드 리스트 조회.
        return res.status(201).send({ msg: 'success', cards });
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
router.delete('/:card_id', verifyToken, async (req, res, next) => {
    /*
        카드 삭제 요청 API(DELETE): /api/card/:card_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: card_id }: 삭제할 카드 id

        * 응답: success / failure
    */
    const { card_id } = req.params;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const cardID = parseInt(card_id); // int 형 변환
        const existCard = await Card.findOne({
            where: { card_id: cardID, user_id }
        }); // 삭제할 카드가 존재하는지 확인.
        if (!existCard) {
            // 카드가 없으면 삭제할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 카드입니다.' });
        }
        const deleteCard = await Card.destroy({
            where: { card_id: cardID, user_id }
        }); // 카드 삭제.
        if (!deleteCard) {
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
