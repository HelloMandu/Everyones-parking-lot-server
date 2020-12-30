const express = require('express');
const router = express.Router();

const { Notice } = require('../models');

const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const updateObjectChecker = require('../lib/updateObjectChecker');



/* CREATE */
router.post('/', async (req, res, next) => {
    /*
        공지사항 작성 요청 API(POST): /api/notice

        notice_title: 공지사항 제목(String, 필수)
        notice_body: 공지사항 내용(String)
        notice_images: 공지사항 첨부 이미지([ImageFileList])
    
        * 응답: success / failure
    */
    const { notice_title, notice_body, notice_images } = req.body;
    const omissionResult = omissionChecker({ notice_title });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const createNotice = await Notice.create({
            notice_title, notice_body, notice_images
        }); // 공지사항 생성.
        if (!createNotice) {
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
        공지사항 리스트 요청 API(GET): /api/notice

        * 응답: notices = [공지사항 Array...]
    */
    try {
        const notices = await Notice.findAll({
            order: [['createdAt', 'DESC']]
        }); // 공지사항 리스트 조회.
        return res.status(200).send({ msg: 'success', notices });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
})
router.get('/:notice_id', async (req, res, next) => {
    /*
        공지사항 상세 정보 요청 API(GET): /api/notice/:notice_id
        { params: notice_id }: 상세 정보를 가져올 공지사항 id

        * 응답: notice = { 공지사항 상세 정보 Object }
    */
    const { notice_id } = req.params;
    try {
        const noticeID = parseInt(notice_id) // int 형 변환
        const notice = await Notice.findOne({
            where: { notice_id: noticeID }
        }); // 공지사항 상세 정보 조회.
        if (!notice) {
            // 해당 공지사항 id가 DB에 없음.
            return res.status(202).send({ msg: '조회할 수 없는 공지사항입니다.' });
        }
        await notice.increment('hit', { by: 1 }); // 공지사항 조회 수 증가.
        return res.status(200).send({ msg: 'success', notice });
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
router.put('/:notice_id', async (req, res, next) => {
    /*
        공지사항 수정 요청 API(PUT): /api/notice/:notice_id
        { params: notice_id }: 수정할 공지사항 id

        notice_title: 공지사항 제목(String)
        notice_body: 공지사항 내용(String)
        notice_images: 공지사항 첨부 이미지([ImageFileList])

        * 응답: success / failure
    */
    const { notice_id } = req.params;
    const { notice_title, notice_body, notice_images } = req.body;
    try {
        const noticeID = parseInt(notice_id); // int 형 변환
        const existNotice = await Notice.findOne({
            where: { notice_id: noticeID }
        }); // 수정할 공지사항이 존재하는지 확인.
        if (!existNotice) {
            // 공지사항이 없으면 수정할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 공지사항입니다.' });
        }
        const updateNotice = await Notice.update(updateObjectChecker({
            notice_title,
            notice_body,
            notice_images,
        }), {
            where: { notice_id: noticeID }
        }); // 공지사항 수정.
        if (!updateNotice) {
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
router.delete('/:notice_id', async (req, res, next) => {
    /*
        공지사항 삭제 요청 API(DELETE): /api/notice/:notice_id
        { params: notice_id }: 삭제할 공지사항 id

        * 응답: success / failure
    */
    const { notice_id } = req.params;
    try {
        const noticeID = parseInt(notice_id); // int 형 변환
        const existNotice = await Notice.findOne({ where: {
            notice_id: noticeID
        }}); // 삭제할 공지사항이 존재하는지 확인.
        if (!existNotice) {
            // 공지사항이 없으면 삭제할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 공지사항입니다.' });
        }
        const deleteNotice = await Notice.destroy({
            where: { notice_id: noticeID }
        }); // 공지사항 삭제.
        if (!deleteNotice) {
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