const express = require('express');
const router = express.Router();

const { PointLog } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const foreignKeyChecker = require('../lib/foreignKeyChecker');



/* READ */
router.get('/', verifyToken, async (req, res, next) => {
    /*
        나의 수익금 기록 리스트 요청 API(GET): /api/point_log
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: point_logs = [포인트 사용 기록 Array…]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const point_logs = await PointLog.findAll({
            where: { user_id },
            order: [['createdAt', 'DESC']]
        }); // 수익금 기록 리스트 조회.
        return res.status(200).send({ msg: 'success', point_logs });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;
