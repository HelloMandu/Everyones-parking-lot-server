const express = require('express');
const router = express.Router();

const { Faq } = require('../models');

const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { isValidDataType } = require('../lib/formatChecker');



// "0: 회원가입, 1: 쿠폰, 2: 결제, 3: 포인트, 4: 주차공간, 5: 대여/연장"



/* CREATE */
router.post('/', async (req, res, next) => {
    /*
        자주 묻는 질문 작성 요청 API(POST): /api/faq

        question: 자주 묻는 질문(String, 필수)
        answer: 자주 묻는 질문 답변(String, 필수)
        faq_type: 자주 묻는 질문 타입(Integer, 필수)
    
        * 응답: success / failure
    */
    const { question, answer, faq_type } = req.body;
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ question, answer, faq_type });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const faqType = parseInt(faq_type); // int 형 변환
        const validDataType = isValidDataType({
            faq_type: faqType
        }); // 데이터 형식 검사.
        if (!validDataType.result) {
            // 데이터의 형식이 올바르지 않음.
            return res.status(202).send({ msg: validDataType.message });
        }

        const createFaq = await Faq.create({
            question, answer, faq_type: faqType
        }); // 자주 묻는 질문 생성.
        if (!createFaq) {
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
router.get('/', async (req, res, next) => {
    /*
        자주 묻는 질문 리스트 요청 API(GET): /api/faq

        faq_type: 자주 묻는 질문 타입(Integer, 필수)

        * 응답: faqs = [자주 묻는 질문 Array...]
    */
    const { faq_type } = req.query;
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ faq_type });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const faqType = parseInt(faq_type); // int 형 변환
        const validDataType = isValidDataType({
            faq_type: faqType
        }); // 데이터 형식 검사.
        if (!validDataType.result) {
            // 데이터의 형식이 올바르지 않음.
            return res.status(202).send({ msg: validDataType.message });
        }
        const faqs = await Faq.findAll({
            where: { faq_type: faqType },
            order: [['createdAt', 'DESC']]
        }); // 자주 묻는 질문 리스트 조회.
        res.status(200).send({ msg: 'success', notices: faqs });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
})



/* DELETE */
router.delete('/:faq_id', async (req, res, next) => {
    /*
        자주 묻는 질문 삭제 요청 API(DELETE): /api/faq/:faq_id
        { params: faq_id }: 삭제할 자주 묻는 질문 id

        * 응답: success / failure
    */
    const { faq_id } = req.params;
    /* request 데이터 읽어 옴. */
    try {
        const faqID = parseInt(faq_id); // int 형 변환
        const existFaq = await Faq.findOne({ where: {
            faq_id: faqID
        }}); // 삭제할 자주 묻는 질문이 존재하는지 확인.
        if (!existFaq) {
            // 자주 묻는 질문이 없으면 삭제할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 FAQ입니다.' });
        }
        const deleteFaq = await Faq.destroy({
            where: { faq_id: faqID }
        }); // 자주 묻는 질문 삭제.
        if (!deleteFaq) {
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