const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
require('dotenv').config();

const { User } = require('../models');

const omissionChecker = require('../lib/omissionChecker');
const verifyToken = require('./middlewares/verifyToken');

/* multer storage */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, cb) {
        cb(null, new Date().valueOf() + file.originalname); // cb 콜백함수를 통해 전송된 파일 이름 설정
    },
});
const upload = multer({ storage: storage });



/* CREATE */
router.post('/', async (req, res, next) => {
    /*
        회원가입 요청 API(POST): /api/user

        email: 유저 이메일(String, 필수)
        name: 유저 이름(String, 필수)
        password: 유저 비밀번호(String, 필수)
        birth: 유저 생년월일(DateString, 필수)
        phone_number: 유저 휴대폰 번호(String, 필수)
        
        * 응답: success / failure
    */
    const { email, name, birth, phone_number, password } = req.body;
    const omissionResult = omissionChecker({
        email,
        name,
        birth,
        phone_number,
        password,
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { email }
        }); // 가입한 이메일이 있는지 확인.
        if (existUser) {
            // 이미 가입한 이메일이 있으면 가입할 수 없음.
            return res.status(202).send({ msg: '이미 가입한 이메일입니다.' });
        }
        const hash = await bcrypt.hash(password, 12); // 비밀번호 해싱.
        if (!hash) {
            return res.status(202).send({ msg: '비밀번호를 설정하지 못했습니다.' });
        }
        const createUser = await User.create({
            email,
            name,
            password: hash,
            phone_number,
            birth: new Date(birth),
        }); // 유저 생성.
        if (!createUser) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        if (e.table) {
            return res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(400).send({ msg: 'database error', error: e });
        }
    }
});



/* READ */
router.get('/', verifyToken, async (req, res, next) => {
    /*
        유저 정보 요청 API(GET): /api/user
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        
        * 응답: user = 유저 정보 Object
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    try {
        const user = await User.findOne({
            where: { user_id }
        }); // 유저 정보 조회.
        if (!user) {
            return res.status(404).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        return res.status(200).send({ msg: 'success', user });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(400).send({ msg: 'database error', error: e });
        }
    }
});

router.post('/signin', async (req, res, next) => {
    /*
        로그인 요청 API(POST): /api/user/signin

        email: 유저 이메일(String, 필수)
        password: 유저 패스워드(String, 필수)
        
        * 응답: token = 유저 로그인 토큰
    */
    const { email, password } = req.body;
    const omissionResult = omissionChecker({ email, password });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { email }
        }); // 가입한 이메일인지 확인.
        if (!existUser) {
            // 가입하지 않은 이메일로 로그인을 할 수 없음.
            return res.status(404).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const result = await bcrypt.compare(password, existUser.password);
        if (!result) {
            // 해싱한 비밀번호가 일치하지 않음.
            return res.status(202).send({ msg: '비밀번호가 일치하지 않습니다.' });
        }
        const token = jwt.sign(
            {
                user_id: existUser.dataValues.user_id,
                email: email,
            },
            process.env.JWT_SECRET,
        ); // JWT_TOKEN 생성.
        if (!token) {
            return res.status(202).send({ msg: 'token을 생성하지 못했습니다.' });
        }
        return res.status(200).send({ msg: 'success', token });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(400).send({ msg: 'database error', error: e });
        }
    }
});

router.post('/find/user_id', async (req, res, next) => {
    /*
        아이디 찾기 (POST): /api/user/find/user_id

        name: 유저 이름(String, 필수)
        phone_number: 유저 휴대폰 번호(String, 필수)

        * 응답: email = 찾은 email
    */
    const { name, phone_number } = req.body;
    const omissionResult = omissionChecker({ name, phone_number });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { name, phone_number }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 아이디를 찾을 수 없음.
            return res.status(404).send({ msg: '가입하지 않은 유저입니다.' });
        }
        const { email } = existUser; // 유저의 이메일을 가져옴.
        return res.status(200).send({ msg: 'success', email });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(400).send({ msg: 'database error', error: e });
        }
    }
});

router.post('/find/user_pw', async (req, res, next) => {
    /*
        비밀번호 찾기 API(POST): /api/user/find/user_pw

        name: 유저 이름(String, 필수)
        email: 유저 이메일(String, 필수)
        phone_number: 유저 휴대폰 번호(String, 필수)
        
        * 응답: token = 유저 임시 토큰
    */
    const { name, email, phone_number } = req.body;
    const omissionResult = omissionChecker({ name, phone_number });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { name, email, phone_number },
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 비밀번호를 찾을 수 없음.
            return res.status(404).send({ msg: '가입하지 않은 유저입니다.' });
        }
        const token = jwt.sign(
            {
                user_id: existUser.dataValues.user_id,
                email: email,
            },
            process.env.JWT_SECRET,
        ); // 임시 JWT_TOKEN 생성.
        if (!token) {
            return res.status(202).send({ msg: 'token을 생성하지 못했습니다' });
        }
        return res.status(200).send({ msg: 'success', token: token });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(400).send({ msg: 'database error', error: e });
        }
    }
});



/* UPDATE */
router.put('/car_info', upload.single('car_img'), async (req, res, next) => {
    /*
        차량 정보 등록 요청 API(PUT): /api/user/car_info
        
        email: 유저 이메일(String, 필수)
        car_location: 차량 등록 지역(String, 필수)
        car_num: 차량 등록 번호(String, 필수)
        car_img: 차량 이미지(ImageFile, 필수)
        
        * 응답: success / failure
    */
    const { email, car_location, car_num } = req.body;
    const car_img = req.file.path;
    const omissionResult = omissionChecker({
        email,
        car_location,
        car_num,
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const existUser = User.findOne({
            where: { email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 차량 등록을 할 수 없음.
            return res.status(404).send({ msg: '가입하지 않은 이메일입니다' });
        }
        const updateUser = await User.update(
            { car_location, car_num, car_img },
            { where: { email } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(400).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/password', verifyToken, async (req, res, next) => {
    /*
        비밀번호 재설정 API(PUT): /api/user/password
        { headers }: JWT_TOKEN(유저 임시 토큰)

        password: 새 비밀번호(String, 필수)
        
        * 응답: success / failure
    */
    const { password } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const omissionResult = omissionChecker({
        password,
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(400).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { user_id }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 비밀번호 변경을 할 수 없음.
            return res.status(404).send({ msg: '가입하지 않은 이메일입니다' });
        }
        const hash = await bcrypt.hash(password, 12); // 비밀번호 해싱
        const updateUser = await User.update(
            { password: hash },
            { where: { user_id } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(400).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(400).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;
