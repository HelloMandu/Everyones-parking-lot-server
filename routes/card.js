const express = require('express');
const router = express.Router();

const { Card } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');


/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        카드 등록 요청 API(POST): /api/card
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        
        bank_name: 은행 이름(String, 필수)
        card_num: 카드 번호(String, 필수)
        card_type: 카드 타입(String, 필수)

        * 응답: success / failure
    */
    const { bank_name, card_num, card_type } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ bank_name, card_num, card_type });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const createCard = await Card.create({
            user_id,
            bank_name, card_num, card_type
        }); // 카드 등록.
        if (!createCard) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
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

        * 응답: cards = [사용가능한 카드 Array...]
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
