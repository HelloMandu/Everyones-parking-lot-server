const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const omissionChecker = require('../lib/omissionChecker');

const { User } = require('../models');

const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, cb) {
        cb(null, new Date().valueOf() + file.originalname); // cb 콜백함수를 통해 전송된 파일 이름 설정
    },
});
const upload = multer({ storage: storage });
require('dotenv').config();

/*
    로그인 요청 API(POST): /api/user/signin
	email: 유저 이메일(String, 필수)
	password: 유저 패스워드(String, 필수)
*/
router.post('/signin', async (req, res, next) => {
    if (req.body === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { email, password } = req.body;
    const omissionResult = omissionChecker({ email, password });
    if (!omissionResult.result) {
        return res.send({ msg: omissionResult.message });
    }
    const existUser = await User.findOne({ where: { email } });
    if (!existUser) {
        return res.send({ msg: '가입되지 않은 이메일입니다.' });
    }
    const result = await bcrypt.compare(password, existUser.password);
    if (!result) {
        return res.send({ msg: '비밀번호가 일치하지 않습니다.' });
    }
    const token = jwt.sign(
        {
            email: email,
            password: password,
        },
        process.env.JWT_SECRET,
    );
    if (!token) {
        return res.send({ msg: 'token을 생성하지 못했습니다' });
    }
    res.send({ msg: 'success', token: token });
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
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
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
        return res.send({ msg: omissionResult.message });
    }
    /* 모든 데이터가 정상적으로 넘어왔으면 회원가입 절차 실행.*/
    const existUser = await User.findOne({ where: { email } });

    if (existUser) {
        // 이미 가입된 이메일이 있는지 화인.
        return res.send({ msg: '이미 가입한 이메일입니다.' });
    }
    const hash = await bcrypt.hash(password, 12); // 비밀번호 해싱
    if (!hash) {
        return res.send({ msg: '비밀번호를 설정하지 못했습니다' });
    }
    const createUser = await User.create({
        email,
        name,
        password: hash,
        phone_number,
        birth: new Date(birth),
    });

    if (!createUser) {
        return res.send({ msg: '회원가입에 실패하였습니다' });
    }
    res.send({ msg: 'success' }); // 가입 성공이라는 메세지 보냄.
});

/* 
아이디 찾기 (POST): /api/user/find/user_id
	name: 유저 이름(String, 필수)
    phone_number: 유저 휴대폰 번호(String, 필수)
*/
router.post('/find/user_id', async (req, res, next) => {
    if (req.body === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { name, phone_number } = req.body;

    const omissionResult = omissionChecker({ name, phone_number });
    if (!omissionResult.result) {
        return res.send({ msg: omissionResult.message });
    }
    const existUser = await User.findOne({ where: { name, phone_number } });
    if (!existUser) {
        return res.send({ msg: '가입되지 않은 이메일입니다.' });
    }
    const { email } = existUser;
    res.send(email);
});

/*
비밀번호 찾기 API(POST): /api/user/find/user_pw
	name: 유저 이름(String, 필수)
	email: 유저 이메일(String, 필수)
	phone_number: 유저 휴대폰 번호(String, 필수)
*/
router.post('/find/user_pw', async (req, res, next) => {
    if (req.body === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { name, email, phone_number } = req.body;

    const omissionResult = omissionChecker({ name, phone_number });
    if (!omissionResult.result) {
        return res.send({ msg: omissionResult.message });
    }
    const existUser = await User.findOne({
        where: { name, email, phone_number },
    });
    if (!existUser) {
        return res.send({ msg: '가입되지 않은 이메일입니다.' });
    }
    res.send({ msg: 'success' });
});

/*
차량 정보 등록 요청 API(PUT): /api/user
    email: 유저 이메일(String, 필수)
	car_location: 차량 등록 지역(String, 필수)
	car_num: 차량 등록 번호(String, 필수)
	car_img: 차량 이미지(ImageFile, 필수)
*/
router.put('/car_info', upload.single('car_img'), async (req, res, next) => {
    if (req.body === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    console.log(req.file);
    console.log(req.body);
    const { email, car_location, car_num } = req.body;
    const omissionResult = omissionChecker({
        email,
        car_location,
        car_num,
    });
    if (!omissionResult.result) {
        return res.send({ msg: omissionResult.message });
    }
    const existUser = User.findOne({ where: { email } });
    if (!existUser) {
        return res.send({ msg: '가입되지 않은 이메일입니다' });
    }
    const isUpdate = await User.update(
        { car_location, car_num },
        { where: { email } },
    );
    if (!isUpdate) {
        return res.send({ msg: '차량정보를 등록하지 못했습니다' });
    }
    res.send({ msg: 'success' }); // object를 리턴함
});

/*
비밀번호 재설정 API(PUT): /api/user
	password: 새 비밀번호(String, 필수)
*/
router.put('/password', async (req, res, next) => {
    if (req.body === {}) {
        return res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { name, email, phone_number, password } = req.body;
    const omissionResult = omissionChecker({
        name,
        email,
        phone_number,
        password,
    });
    if (!omissionResult.result) {
        return res.send({ msg: omissionResult.message });
    }
    const existUser = await User.findOne({ where: { email } });
    if (!existUser) {
        return res.send({ msg: '가입되지 않은 이메일입니다' });
    }
    const hash = await bcrypt.hash(password, 12); // 비밀번호 해싱
    if (!hash) {
        return res.send({ msg: '비밀번호를 설정하지 못했습니다' });
    }
    const isUpdate = await User.update(
        { password: hash },
        { where: { email, phone_number, name } },
    );
    if (!isUpdate) {
        return res.send({ msg: '비밀번호를 설정하지 못했습니다' });
    }
    res.send({ msg: 'success' });
});

module.exports = router;
