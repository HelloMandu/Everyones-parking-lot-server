const express = require('express');
const router = express.Router();

const { Like } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');

require('dotenv').config();

/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        주차공간 좋아요 추가 요청 API(POST): /api/like

        { headers }: JWT_TOKEN(유저 로그인 토큰)
        place_id: 주차공간 id(필수)

        * 응답: status = 변경된 좋아요 상태
    */
    if (req.body === {}) {
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    } else {
        const { place_id } = req.body;
        const omissionResult = omissionChecker({ place_id });
        if (!omissionResult.result) {
            // 필수 데이터가 올바르게 넘어왔는지 검사.
            res.send({ msg: omissionResult.message });
        } else {
            const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
            const existLike = await Like.findOne({ where: {
                user_id, place_id
            }});
            if (existLike) {
                // 좋아요가 있으면 추가할 수 없음.
                res.send({ msg: '이미 좋아요한 주차공간입니다.' });
            } else {
                try {
                    const createLike = await Like.create({
                        user_id,
                        place_id: parseInt(place_id)
                    }); // 좋아요를 DB에 추가.
                    if (!createLike) {
                        // 성공 시 상태 보냄.
                        res.send({ msg: 'success', status: true });
                    } else {
                        // 실패
                        res.send({ msg: 'failure', status: false });
                    }
                } catch (e) {
                    // DB 삽입 도중 오류 발생.
                    if (e.table) {
                        res.send({ msg: foreignKeyChecker(e.table) });
                    } else {
                        res.send({ msg: 'database error', error });
                    }
                }
            }
        }
    }
});

router.delete('/', verifyToken, async (req, res, next) => {
    /*
        주차공간 좋아요 제거 요청 API(DELETE): /api/like

        { headers }: JWT_TOKEN(유저 로그인 토큰)
        place_id: 주차공간 id(필수)

        * 응답: status = 변경된 좋아요 상태
    */
    if (req.body === {}) {
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    } else {
        const { place_id } = req.body;
        const omissionResult = omissionChecker({ place_id });
        if (!omissionResult.result) {
            // 필수 데이터가 올바르게 넘어왔는지 검사.
            res.send({ msg: omissionResult.message });
        } else {
            const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
            const existLike = await Like.findOne({ where: {
                user_id, place_id
            }});
            if (!existLike) {
                // 좋아요가 없으면 제거할 수 없음.
                res.send({ msg: '이미 좋아요하지 않은 주차공간입니다.' });
            } else {
                try {
                    const destoryLike = await Like.destroy({
                        where: {
                            user_id,
                            place_id: parseInt(place_id)
                        }
                    }); // 좋아요를 DB에서 삭제.
                    if (!destoryLike) {
                        // 성공 시 상태 보냄.
                        res.send({ msg: 'success', status: false });
                    } else {
                        // 실패
                        res.send({ msg: 'failure', status: true });
                    }
                } catch (e) {
                    // DB 삽입 도중 오류 발생.
                    if (e.table) {
                        res.send({ msg: foreignKeyChecker(e.table) });
                    } else {
                        res.send({ msg: 'database error', error });
                    }
                }
            }
        }
    }
});

module.exports = router;