const express = require('express');
const router = express.Router();

const omissionChecker = require('../lib/omissionChecker');

require('dotenv').config();

/*
    휴대폰 인증 번호 요청 API(POST): /api/mobile/auth
	phone_number: 유저 휴대폰 번호(String, 필수)
*/
router.post('/auth', async (req, res, next) => {
    const { phone_number } = req.body;
    const omissionResult = omissionChecker({ phone_number });
    if (!omissionResult.result) {
        return res.status(400).send({ msg: omissionResult.message });
    }
    /*todo: 인증번호 요청*/
    res.status(200).send({ msg: 'success', auth_number: 1234 });
});

/*
    휴대폰 인증 번호 확인 API(POST): /api/mobile/confirm
	phone_number: 유저 휴대폰 번호(String, 필수)
	auth_number: 전달 받은 인증 번호(String, 필수)
*/
router.post('/confirm', async (req, res, next) => {
    const { phone_number, auth_number } = req.body;
    const omissionResult = omissionChecker({ phone_number, auth_number });
    if (!omissionResult.result) {
        return res.status(400).send({ msg: omissionResult.message });
    }
    const authConfirm = auth_number === 1234;
    if (!authConfirm) {
        return res.status(401).send({ msg: '인증에 실패하였습니다' });
    }
    res.status(200).send({ msg: 'success' });
});

module.exports = router;
