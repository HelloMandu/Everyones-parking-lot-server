const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const omissionChecker = require('../lib/omissionChecker');

const { User } = require('../models');

const router = express.Router();
require('dotenv').config();

/*
    휴대폰 인증 번호 요청 API(POST): /api/mobile/auth
	phone_number: 유저 휴대폰 번호(String, 필수)
*/
router.post('/auth', async (req, res, next) => {

});

/*
    휴대폰 인증 번호 확인 API(POST): /api/mobile/confirm
	phone_number: 유저 휴대폰 번호(String, 필수)
	auth_number: 전달 받은 인증 번호(String, 필수)
*/
router.post('/confirm', async (req, res, next) => {
});

module.exports = router;
