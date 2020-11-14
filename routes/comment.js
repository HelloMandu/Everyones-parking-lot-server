const express = require('express');
const router = express.Router();

const { Comment } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');


/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        댓글 작성 요청 API(POST): /api/comment
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        
        review_id: 댓글을 작성할 리뷰 id(Integer, 필수)
        comment_body: 댓글 내용(String, 필수)

        * 응답: comment = { 댓글 정보 Object }
    */
    const { review_id, comment_body } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const omissionResult = omissionChecker({ review_id, comment_body });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const createComment = await Comment.create({
            review_id,
            user_id,
            comment_body,
        }); // 댓글 작성.
        if (!createComment) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success', comment: createComment });
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        if (e.table) {
            res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(400).send({ msg: 'database error', error });
        }
    }
});

router.put('/:comment_id', verifyToken, async (req, res, next) => {
    /*
        댓글 수장 요청 API(DELETE): /api/comment
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: comment_id }: 수정할 댓글 id

        comment_body: 수정할 댓글 내용(String, 필수)

        * 응답: comment = { 댓글 정보 Object }
    */
    const { comment_id } = req.params;
    const { comment_body } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const omissionResult = omissionChecker({ comment_body });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const commentID = parseInt(comment_id); // int 형 변환
        const existComment = await Comment.findOne({
            where: { review_id: commentID, user_id }
        }); // 수정할 댓글이 존재하는지 확인.
        if (!existComment) {
            // 댓글이 없으면 수정할 수 없음.
            return res.status(404).send({ msg: '조회할 수 없는 리뷰입니다.' });
        }
        const updateComment = await Comment.update(
            { comment_body },
            { where: { comment_id: commentID, user_id } },
        ); // 댓글 수정.
        if (!updateComment) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success', comment: updateComment });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(400).send({ msg: 'database error', error });
        }
    }
});

router.delete('/:comment_id', verifyToken, async (req, res, next) => {
    /*
        댓글 삭제 요청 API(DELETE): /api/comment
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: comment_id }: 삭제할 댓글 id

        * 응답: success / failure
    */
    const { comment_id } = req.params;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    try {
        const commentID = parseInt(comment_id); // int 형 변환
        const existComment = await Comment.findOne({
            where: { comment_id: commentID, user_id }
        }); // 삭제할 댓글이 존재하는지 확인.
        if (!existComment) {
            // 댓글이 없으면 삭제할 수 없음.
            return res.status(404).send({ msg: '조회할 수 없는 댓글입니다.' });
        }
        const deleteComment = await Comment.destroy({
            where: { commentID, user_id }
        }); // 댓글 삭제.
        if (!deleteComment) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(200).send({ msg: 'success' });
    } catch (e) {
        // DB 삭제 도중 오류 발생.
        if (e.table) {
            res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(400).send({ msg: 'database error', error });
        }
    }
});

module.exports = router;
