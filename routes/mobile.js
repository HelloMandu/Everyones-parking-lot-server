const express = require('express');
const router = express.Router();

const omissionChecker = require('../lib/omissionChecker');

require('dotenv').config();

/*
    휴대폰 인증 번호 요청 API(POST): /api/mobile/auth
	phone_number: 유저 휴대폰 번호(String, 필수)
*/
router.post('/auth', async (req, res, next) => {
    if (req.body === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { phone_number } = req.body;
    const omissionResult = omissionChecker({ phone_number });
    if (!omissionResult.result) {
        return res.send({ msg: omissionResult.message });
    }
    /*todo: 인증번호 요청*/
    res.send({ msg: 'success', auth_number: 1234 });
});

/*
    휴대폰 인증 번호 확인 API(POST): /api/mobile/confirm
	phone_number: 유저 휴대폰 번호(String, 필수)
	auth_number: 전달 받은 인증 번호(String, 필수)
*/
router.post('/confirm', async (req, res, next) => {
    if (req.body === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { phone_number, auth_number } = req.body;
    const omissionResult = omissionChecker({ phone_number, auth_number });
    if (!omissionResult.result) {
        return res.send({ msg: omissionResult.message });
    }
    const authConfirm = auth_number === 1234;
    if (!authConfirm) {
        return res.send({ msg: '인증에 실패하였습니다' });
    }
    res.send({ msg: 'success' });
});

module.exports = router;