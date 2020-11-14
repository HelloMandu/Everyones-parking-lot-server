const express = require('express');
const router = express.Router();

const { Notice } = require('../models');

const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');

/* CREATE */
router.post('/', async (req, res, next) => {
    /*
        공지사항 작성 요청 API(POST): /api/notice

        notice_title: 공지사항 제목(String, 필수)
        notice_body: 공지사항 내용(String)
        notice_img: 공지사항 첨부 이미지(ImageFileList)
    
        * 응답: success / failure
    */
    const { notice_title, notice_body, notice_img } = req.body;

    const omissionResult = omissionChecker({ notice_title });
    if (!omissionResult.result) {
        // 필수 데이터가 올바르게 넘어왔는지 검사.
        res.send({ msg: omissionResult.message });
    } else {
        try {
            const createNotice = await Notice.create({
                notice_title, notice_body, notice_img
            }); // 공지사항 생성.
            if (createNotice) {
                res.send({ msg: 'success' });
            } else {
                res.send({ msg: 'failure' });
            }
        } catch (e) {
            if (e.table) {
                res.send({ msg: foreignKeyChecker(e.table) });
            } else {
                res.send({ msg: 'database error', error: e });
            }
        }
    }
});

/* READ */
router.get('/', async (req, res, next) => {
    /*
        공지사항 리스트 요청 API(GET): /api/notice

        * 응답: notices = [공지사항 Array...]
    */
    const resultNotices = await Notice.findAll(); // 공지사항 리스트 조회
    res.send({ notices: resultNotices });
})
router.get('/:notice_id', async (req, res, next) => {
    /*
        공지사항 상세 정보 요청 API(GET): /api/notice/:notice_id
        
        notice_id: 상세 정보를 가져올 공지사항 id

        * 응답: notice = { 공지사항 상세 정보 Object }
    */
    const { notice_id } = req.params;

    const omissionResult = omissionChecker({ notice_id });
    if (!omissionResult.result) {
        // 필수 항목인 notice_id가 누락됨.
        res.send({ msg: omissionResult.message });
    } else {
        const resultNotice = await Notice.findOne({
            where: { notice_id: parseInt(notice_id) }
        }); // 공지사항 상세 조회
        if (!resultNotice) {
            // 해당 공지사항 id가 DB에 없음.
            res.send({ msg: '조회할 수 없는 공지사항입니다.' });
        } else {
            res.send({ notice: resultNotice });
        }
    }
});

/* UPDATE */
router.put('/:notice_id', async (req, res, next) => {
    /*
        공지사항 수정 요청 API(PUT): /api/notice/:notice_id

        notice_id: 수정할 공지사항 id

        notice_title: 공지사항 제목(String)
        notice_body: 공지사항 내용(String)
        notice_img: 공지사항 첨부 이미지(ImageFileList)

        * 응답: success / failure
    */
    const { notice_id } = req.params;
    const omissionResult = omissionChecker({ notice_id });
    if (!omissionResult.result) {
        // 필수 항목인 notice_id가 누락됨.
        res.send({ msg: omissionResult.message });
    } else {
        const noticeID = parseInt(notice_id);
        const existNotice = await Notice.findOne({ where: {
            notice_id: noticeID
        }});
        if (!existNotice) {
            // 공지사항이 없으면 수정할 수 없음.
            res.send({ msg: '수정할 수 없는 공지사항입니다.' });
        } else {
            try {
                const preValue = existNotice.dataValues;
                const {
                    notice_title, notice_body, notice_img
                } = req.body;
                const updateNotice = Notice.update({
                    notice_title: notice_title ? notice_title : preValue.notice_title,
                    notice_body: notice_body ? notice_body : preValue.notice_body,
                    notice_img: notice_img ? notice_img : preValue.notice_img,
                }, {
                    where: { notice_id: noticeID }
                }); // 공지사항 수정.
                
                if (!updateNotice) {
                    res.send({ msg: 'failure' });
                } else {
                    res.send({ msg: 'success' });
                }
            } catch (e) {
                // DB 수정 도중 오류 발생.
                if (e.table) {
                    res.send({ msg: foreignKeyChecker(e.table) });
                } else {
                    res.send({ msg: 'database error', error: e });
                }
            }
        }
    }
});

/* DELETE */
router.delete('/:notice_id', async (req, res, next) => {
    /*
        공지사항 삭제 요청 API(DELETE): /api/notice/:notice_id

        notice_id: 삭제할 공지사항 id

        * 응답: success / failure
    */
    const { notice_id } = req.params;
    const omissionResult = omissionChecker({ notice_id });
    if (!omissionResult.result) {
        // 필수 항목인 place_id가 누락됨.
        res.send({ msg: omissionResult.message });
    } else {
        const noticeID = parseInt(notice_id);
        const existNotice = await Notice.findOne({ where: {
            notice_id: noticeID
        }});
        if (!existNotice) {
            // 공지사항이 없으면 삭제할 수 없음.
            res.send({ msg: '이미 삭제된 공지사항입니다.' });
        } else {
            try {
                const destroyNotice = await Notice.destroy({
                    where: {
                        notice_id: noticeID
                    }
                }); // 공지사항 삭제.
                if (destroyNotice) {
                    // 성공 시 상태 보냄.
                    res.send({ msg: 'success' });
                } else {
                    // 실패
                    res.send({ msg: 'failure' });
                }
            } catch (e) {
                // DB 삭제 도중 오류 발생.
                if (e.table) {
                    res.send({ msg: foreignKeyChecker(e.table) });
                } else {
                    res.send({ msg: 'database error', error: e });
                }
            }
        }
    }
});

export default router;