const express = require('express');
const multer = require('multer');
const router = express.Router();

const { Qna, User } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { filesDeleter } = require('../lib/fileDeleter');
const updateObjectChecker = require('../lib/updateObjectChecker');



/* multer storage */
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads/'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, callback) {
        callback(null, new Date().valueOf() + file.originalname); // cb 콜백함수를 통해 전송된 파일 이름 설정
    },
});
const upload = multer({ storage: storage });



/* CREATE */
router.post('/', verifyToken, upload.array('q_files'), async (req, res, next) => {
    /*
        1:1 문의 작성 요청 API(POST): /api/qna
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        email: 답변 받을 이메일(String, 필수)
        subject: 1:1 문의 제목(String, 필수)
        question: 1:1 문의 내용(String, 필수)
        q_files: 1:1 문의 첨부 파일([FileList])
    
        * 응답: success / failure
    */
    const { email, subject, question } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const { q_files } = req.files;
    /* request 데이터 읽어 옴. */
    const qFiles = q_files ? q_files.map(file => file.path) : null;
    const omissionResult = omissionChecker({ email, subject, question });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        filesDeleter(qFiles);
        // 실패이므로 업로드 한 파일 삭제.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const createqna = await Qna.create({
            user_id,
            email, subject, question,
            q_files: qFiles,
        }); // 1:1 문의 생성.
        if (!createqna) {
            filesDeleter(qFiles);
            // 실패이므로 업로드 한 파일 삭제.
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        filesDeleter(qFiles);
        // 실패이므로 업로드 한 파일 삭제.
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
        1:1 문의 리스트 요청 API(GET): /api/qna
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: qnas = [1:1 문의(유저 포함) Array...]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const qnas = await Qna.findAll({
            where: { user_id },
            include: [{ model: User }],
            order: [['createdAt', 'DESC']]
        }); // 1:1 문의 리스트 조회.
        return res.status(200).send({ msg: 'success', qnas });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
})
router.get('/:qna_id', verifyToken, async (req, res, next) => {
    /*
        1:1 문의 상세 정보 요청 API(GET): /api/qna/:qna_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: qna_id }: 상세 정보를 가져올 1:1 문의 id

        * 응답: qna = { 1:1 문의 상세 정보 Object, 유저 Object }
    */
    const { qna_id } = req.params;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const qnaID = parseInt(qna_id) // int 형 변환
        const qna = await Qna.findOne({
            where: { user_id, qna_id: qnaID },
            include: [{ model: User }]
        }); // 1:1 문의 상세 정보 조회.
        if (!qna) {
            // 해당 1:1 문의 id가 DB에 없음.
            return res.status(202).send({ msg: '조회할 수 없는 1:1 문의입니다.' });
        }

        await qna.increment('hit', { by: 1 }); // 1:1 문의 조회 수 증가.
        
        return res.status(200).send({ msg: 'success', qna });
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
router.put('/:qna_id', verifyToken, upload.array('q_files'), async (req, res, next) => {
    /*
        1:1 문의 수정 요청 API(PUT): /api/qna/:qna_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: qna_id }: 수정할 1:1 문의 id

        email: 답변 받을 이메일(String)
        subject: 1:1 문의 제목(String)
        question: 1:1 문의 내용(String)
        q_files: 1:1 문의 첨부 파일([FileList])

        * 응답: success / failure
    */
    const { qna_id } = req.params;
    const { email, subject, question } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const { q_files } = req.files;
    /* request 데이터 읽어 옴. */
    const qFiles = q_files ? q_files.map(file => file.path) : [];
    try {
        const qnaID = parseInt(qna_id); // int 형 변환
        const existQna = await Qna.findOne({ where: {
            user_id,
            qna_id: qnaID
        }}); // 수정할 1:1 문의가 존재하는지 확인.
        if (!existQna) {
            // 1:1 문의가 없으면 수정할 수 없음.
            filesDeleter(qFiles);
            // 실패이므로 업로드 한 파일 삭제.
            return res.status(202).send({ msg: '조회할 수 없는 1:1 문의입니다.' });
        } 
        const preValue = existQna.dataValues;
        // 기존 값으로 업데이트하기 위한 객체.
        const updateQna = Qna.update(updateObjectChecker({
            email, subject, question, q_files: qFiles
        }), {
            where: { user_id, qna_id: qnaID }
        }); // 1:1 문의 수정.
        if (!updateQna) {
            filesDeleter(qFiles);
            // 실패이므로 업로드 한 파일 삭제.
            return res.status(202).send({ msg: 'failure' });
        }
        if (q_files) filesDeleter(preValue.q_files); // 첨부 파일이 바꼈으면 이전 이미지 삭제.
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        filesDeleter(qFiles);
        // 실패이므로 업로드 한 파일 삭제.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

/* DELETE */
router.delete('/:qna_id', verifyToken, async (req, res, next) => {
    /*
        1:1 문의 삭제 요청 API(DELETE): /api/qna/:qna_id
        { params: qna_id }: 삭제할 1:1 문의 id

        * 응답: success / failure
    */
    const { qna_id } = req.params;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    try {
        const qnaID = parseInt(qna_id); // int 형 변환
        const existQna = await Qna.findOne({ where: {
            user_id,
            qna_id: qnaID
        }}); // 삭제할 1:1 문의가 존재하는지 확인.
        if (!existQna) {
            // 1:1 문의가 없으면 삭제할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 1:1 문의입니다.' });
        }
        const deleteQna = await Qna.destroy({
            where: { user_id, qna_id: qnaID }
        }); // 1:1 문의 삭제.
        if (!deleteQna) {
            return res.status(202).send({ msg: 'failure' });
        }
        const { q_files } = existQna.dataValues;
        filesDeleter(q_files); // 첨부 파일 제거
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