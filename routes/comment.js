const express = require('express');
const router = express.Router();

const { Comment } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');

require('dotenv').config();

/*
- 댓글 작성 요청 API(POST): /api/comment
{ headers }: JWT_TOKEN(유저 로그인 토큰)
review_id: 댓글을 작성할 리뷰 id(Integer, 필수)
comment_body: 댓글 내용(String, 필수)

* 응답: comment = 댓글 정보 Object
*/
router.post('/', verifyToken, async (req, res, next) => {
    const { review_id, comment_body } = req.body;
    const { user_id } = req.decodeToken;
    const omissionResult = omissionChecker({ review_id });
    if (!omissionResult.result) {
        return res.status(401).send({ msg: omissionResult.message });
    }
    try {
        const createComment = await Comment.create({
            review_id,
            user_id,
            comment_body,
        });
        if (!createComment) {
            return res.status(401).send({ msg: '코멘트를 작성하지 못했습니다.' });
        }
        res.send({ msg: 'success' });
    } catch (e) {
        if (e.table) {
            res.status(500).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(500).send({ msg: 'database error', error });
        }
    }
});

module.exports = router;
