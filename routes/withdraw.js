const express = require('express');
const router = express.Router();

const { Withdraw, User } = require('../models');

const MINIMUM_WITHDRAW_POINT = 0; // 최소 출금 포인트

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { sendWithdrawPoint } = require('../actions/pointManager');



/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        출금 신청 API(POST): /api/withdraw
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        bank_name: 받을 은행 이름(String, 필수)
        account_number: 받을 계좌 번호(String, 필수)
        withdraw_point: 출금할 액수(UNSIGNED Integer, 필수)

	    * 응답: success / failure
    */

    const { bank_name, account_number, withdraw_point } = req.body;
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const omissionResult = omissionChecker({ bank_name, account_number, withdraw_point });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const withdrawPoint = parseInt(withdraw_point); // int 형 변환.
        if (withdrawPoint <= MINIMUM_WITHDRAW_POINT) {
            // 최소 출금 포인트 이하일 경우 출금할 수 없음.
            return res.status(202).send({ msg: MINIMUM_WITHDRAW_POINT + '포인트 이하 액수를 출금할 수 없습니다.' });
        }
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 유저 정보 확인.
        if (!existUser) {
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }

        const user_point = existUser.dataValues.point; // 유저 보유 포인트 가져옴.
        if (user_point < withdrawPoint) {
            // 유저가 보유한 포인트보다 많은 포인트를 출금할 수 없음.
            return res.status(202).send({ msg: '보유한 포인트보다 많은 포인트를 출금할 수 없습니다.' });
        }
        /*
            const createWithdraw = Withdraw.create({
                user_id, withdraw_point: withdrawPoint, account_number, bank_name
            }); // 출금 신청 생성.
            if (!createWithdraw) {
                return res.status(202).send({ msg: 'failure' });
            }
            return res.status(201).send({ msg: 'success' });
            // 현재는 신청 직후 바로 출금되기 때문에 필요 없음.
        */

        /* ----- 출금 기록 생성 ----- */
        const withdrawResult = await sendWithdrawPoint(user_id, withdrawPoint, "(계좌: " + account_number + ")");
        if (!withdrawResult) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success', point_log: withdrawResult });
        /* ----- 출금 기록 생성 완료 ----- */
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;