const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const omissionChecker = require('../lib/omissionChecker');

const verifyToken = require('./middlewares/verifyToken');

const { User } = require('../models');

require('dotenv').config();

/*
    로그인 요청 API(POST): /api/user/signin
	email: 유저 이메일(String, 필수)
	password: 유저 패스워드(String, 필수)
*/
router.post('/signin', async (req, res, next) => {
    if (req.body === {}) {
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { email, password } = req.body;
    const omissionResult = omissionChecker({ email, password });
    if (!omissionResult.result) {
        res.send({ msg: omissionResult.message });
    }
    const existUser = await User.findOne({ where: { email } });
    if (!existUser) {
        res.send({ msg: '가입되지 않은 이메일입니다.' });
    }
    const result = await bcrypt.compare(password, existUser.password);
    if (!result) {
        res.send({ msg: '비밀번호가 일치하지 않습니다.' });
    }
    const token = jwt.sign(
        {
            email: email,
            password: password,
        },
        process.env.JWT_SECRET,
    );
    res.send({ msg: '로그인 성공!', token: token });
});

/*
    회원가입 요청 API(POST): /api/user
	email: 유저 이메일(String, 필수)
	name: 유저 이름(String, 필수)
	password: 유저 비밀번호(String, 필수)
	birth: 유저 생년월일(DateString, 필수)
	phone_number: 유저 휴대폰 번호(String, 필수)
*/
router.post('/', async (req, res, next) => {
    if (req.body === {}) {
        // 데이터를 보내지 않았을 때.
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { email, name, birth, phone_number, password } = req.body;
    const omissionResult = omissionChecker({
        email,
        name,
        birth,
        phone_number,
        password,
    });
    if (!omissionResult.result) {
        // 데이터가 올바르게 모두 넘어왔는지 검사.
        res.send({ msg: omissionResult.message });
    }
    /* 모든 데이터가 정상적으로 넘어왔으면 회원가입 절차 실행.*/
    const existUser = await User.findOne({ where: { email } });

    if (existUser) {
        // 이미 가입된 이메일이 있는지 화인.
        res.send({ msg: '이미 가입한 이메일입니다.' });
    }
    const hash = await bcrypt.hash(password, 12);
    const createUser = await User.create({
        email,
        name,
        password: hash,
        phone_number,
        birth: new Date(birth),
    }); // 비밀번호 해싱

    if (createUser) {
        // 가입 성공이라는 메세지 보냄.
        res.send({ msg: 'success' });
    }
});

/*
차량 정보 등록 요청 API(PUT): /api/user
	car_location: 차량 등록 지역(String, 필수)
	car_num: 차량 등록 번호(String, 필수)
	car_image: 차량 이미지(ImageFile, 필수)
*/
router.put('/', verifyToken, async (req, res, next) => {
    /*이거해야댐*/
    if (req.body === {}) {
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { car_location, car_num, car_image } = req.body;
    const omissionResult = omissionChecker({
        car_location,
        car_num,
        car_image,
    });
    if (!omissionResult) {
        res.send({ msg: omissionResult.message });
    }
    res.send({ msg: 'success' });
});

/* 
아이디 찾기 (POST): /api/user/find
	name: 유저 이름(String, 필수)
    phone_number: 유저 휴대폰 번호(String, 필수)
비밀번호 찾기 API(POST): /api/user/find
	name: 유저 이름(String, 필수)
	email: 유저 이메일(String, 필수)
	phone_number: 유저 휴대폰 번호(String, 필수)
*/
router.post('/find', async (req, res, next) => {
    if (req.body === {}) {
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { name, email, phone_number } = req.body;

    if (email) {
        // 비밀번호 찾기
        const omissionResult = omissionChecker({ name, phone_number });
        if (!omissionResult) {
            res.send({ msg: omissionResult.message });
        }
        const existUser = await User.findOne({
            where: { name, email, phone_number },
        });
        if (!existUser) {
            res.send({ msg: '가입되지 않은 이메일입니다.' });
        }
        res.send({ msg: 'success' });
    } else {
        const omissionResult = omissionChecker({ name, phone_number });
        if (!omissionResult) {
            res.send({ msg: omissionResult.message });
        }
        const existUser = await User.findOne({ where: { name, phone_number } });
        if (!existUser) {
            res.send({ msg: '가입되지 않은 이메일입니다.' });
        }
        const { email } = existUser;
        res.send(email);
    }
});

/*
비밀번호 재설정 API(PUT): /api/user
	password: 새 비밀번호(String, 필수)
*/
router.put('/', verifyToken, async (req, res, next) => {
    if (req.body === {}) {
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { email, password } = req.body;
    const omissionResult = omissionChecker({ email, password });
    if (!omissionResult) {
        res.send({ msg: omissionResult.message });
    }
    const existUser = User.findOne({ where: { email } });
    if (!existUser) {
        res.send({ msg: '가입되지 않은 이메일입니다.' });
    }
    const hash = await bcrypt.hash(password, 12);
    const isUpdate = User.update(
        { password: hash },
        { where: { email: email } },
    );
    if (!isUpdate) {
        res.send({ msg: '업데이트에 실패하였습니다.' });
    }
    res.send({ msg: 'success' });
});

module.exports = router;
