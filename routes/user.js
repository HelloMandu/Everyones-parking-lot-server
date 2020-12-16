const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');

const { User } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { isEmailForm, isPasswordForm, isCellPhoneForm, isValidDataType } = require('../lib/formatChecker');
const { fileDeleter } = require('../lib/fileDeleter');



/* multer storage */
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads/'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, callback) {
        callback(null, new Date().valueOf() + file.originalname); // cb 콜백함수를 통해 전송된 파일 이름 설정
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
        agree_item: 선택 동의(bool)
        
        * 응답: success / failure
    */
    const { email, name, birth, phone_number, password, agree_item } = req.body;
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({
        email,
        name,
        birth,
        phone_number,
        password,
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    if (!isEmailForm(email)) {
        return res.status(202).send({ msg: '이메일 형식에 맞지 않습니다.' });
    }
    if (!isPasswordForm(password)) {
        return res.status(202).send({ msg: '패스워드 형식에 맞지 않습니다.', sub: '패스워드는 8자 이상 영문, 숫자, 특수문자 조합으로 설정하셔야 합니다.' });
    }
    if (!isCellPhoneForm(phone_number)) {
        return res.status(202).send({ msg: '휴대폰 번호 형식에 맞지 않습니다.' });
    }
    try {
        const insertBirth = new Date(birth); // Date 형 변환
        const validDataType = isValidDataType({
            birth: insertBirth
        }); // 데이터 형식 검사.
        if (!validDataType.result) {
            // 데이터의 형식이 올바르지 않음.
            return res.status(202).send({ msg: validDataType.message });
        }
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
            birth: insertBirth,
            email_verified_at: new Date(),
            agree_mail: agree_item, agree_sms: agree_item
        }); // 유저 생성.
        if (!createUser) {
            return res.status(202).send({ msg: 'failure' });
        }
        const token = jwt.sign(
            {
                user_id: createUser.dataValues.user_id,
                email: 'temporary',
            },
            process.env.JWT_SECRET,
        ); // 임시 JWT_TOKEN 생성.
        if (!token) {
            return res.status(202).send({ msg: 'token을 생성하지 못했습니다.' });
        }
        return res.status(200).send({ msg: 'success', token });
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        console.log(e);
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
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
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const user = await User.findOne({
            where: { user_id, email }
        }); // 유저 정보 확인.
        if (!user) {
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        return res.status(200).send({ msg: 'success', user });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
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
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ email, password });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { email }
        }); // 가입한 이메일인지 확인.
        if (!existUser) {
            // 가입하지 않은 이메일로 로그인을 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
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
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.post('/logout', verifyToken, async (req, res, next) => {
    /*
        로그아웃 요청 API(POST): /api/user/logout
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: success / failure
    */
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 로그아웃을 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const updateUser = await User.update(
            { native_token: null },
            { where: { user_id, email } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(200).send({ msg: 'success' });
    } catch (e) {
        // DB 삭제 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
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
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ name, phone_number });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    if (!isCellPhoneForm(phone_number)) {
        return res.status(202).send({ msg: '휴대폰 번호 형식에 맞지 않습니다.' });
    }
    try {
        const existUser = await User.findOne({
            where: { name, phone_number }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 아이디를 찾을 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 유저입니다.' });
        }
        const { email } = existUser; // 유저의 이메일을 가져옴.
        return res.status(200).send({ msg: 'success', email });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else { 
            return res.status(202).send({ msg: 'database error', error: e });
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
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ name, phone_number });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    if (!isCellPhoneForm(phone_number)) {
        return res.status(202).send({ msg: '휴대폰 번호 형식에 맞지 않습니다.' });
    }
    try {
        const existUser = await User.findOne({
            where: { name, email, phone_number },
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 비밀번호를 찾을 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 유저입니다.' });
        }
        const token = jwt.sign(
            {
                user_id: existUser.dataValues.user_id,
                email: 'temporary',
            },
            process.env.JWT_SECRET,
        ); // 임시 JWT_TOKEN 생성.
        if (!token) {
            return res.status(202).send({ msg: 'token을 생성하지 못했습니다.' });
        }
        return res.status(200).send({ msg: 'success', token: token });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});



/* UPDATE */
router.put('/profile_image', verifyToken, upload.single('profile_image'), async (req, res, next) => {
    /*
        프로필 이미지 변경 요청 API(PUT): /api/user/profile_image
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        profile_image: 변경할 프로필 이미지(ImageFile, 필수)

        * 응답: profile_image = 변경된 이미지 경로    
    */
    const profile_image = req.file.path;
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ profile_image });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        fileDeleter(profile_image); // 실패이므로 업로드 한 파일 삭제.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 프로필 이미지 변경을 할 수 없음.
            fileDeleter(profile_image); // 실패이므로 업로드 한 파일 삭제.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const updateUser = await User.update(
            { profile_image },
            { where: { user_id, email } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            fileDeleter(profile_image); // 실패이므로 업로드 한 파일 삭제.
            return res.status(202).send({ msg: 'failure' });
        }
        const prevProfileImage = existUser.dataValues.profile_image; // 이전에 저장된 프로필 확인.
        if (prevProfileImage) {
            fileDeleter(prevProfileImage); // 이전에 저장된 프로필 이미지가 있으면 삭제.
        }
        return res.status(201).send({ msg: 'success', profile_image });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        fileDeleter(profile_image); // 실패이므로 업로드 한 파일 삭제.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/name', verifyToken, async (req, res, next) => {
    /*
        이름 변경 요청 API(PUT): /api/user/name
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        name: 변경할 이름(String, 필수)

        * 응답: success / failure
    */
    const { name } = req.body;
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ name });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 이름 변경을 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const updateUser = await User.update(
            { name },
            { where: { user_id, email } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/password', verifyToken, async (req, res, next) => {
    /*
        비밀번호 재설정 API(PUT): /api/user/password
        { headers }: JWT_TOKEN(유저 임시 토큰 or 유저 로그인 토큰)

        prev_password: 마이페이지에서 재설정 시 필요한 현재 비밀번호(String)
        password: 새 비밀번호(String, 필수)
        
        * 응답: success / failure
    */
    const { prev_password, password } = req.body;
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴

    let omissionResult = {};
    if (email !== 'temporary') {
        // 임시 토큰으로 진행하지 않을 경우 현재 비밀번호 필요.
        omissionResult = omissionChecker({ password, prev_password });
    } else {
        // 임시 토큰으로 진행할 경우 현재 비밀번호 X
        omissionResult = omissionChecker({ password });
    }
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    if (!isPasswordForm(password)) {
        return res.status(202).send({ msg: '패스워드 형식에 맞지 않습니다.', sub: '패스워드는 8자 이상 영문, 숫자, 특수문자 조합으로 설정하셔야 합니다.' });
    }
    try {
        const existUser = await User.findOne({
            where: { user_id }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 비밀번호 변경을 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        if (email !== 'temporary') {
            // 임시 토큰으로 진행하지 않을 경우 현재 비밀번호와 비교.
            const result = await bcrypt.compare(prev_password, existUser.password);
            if (!result) {
                // 해싱한 비밀번호가 일치하지 않음.
                return res.status(202).send({ msg: '비밀번호가 일치하지 않습니다.' });
            }
        }
        const hash = await bcrypt.hash(password, 12); // 비밀번호 해싱.
        if (!hash) {
            return res.status(202).send({ msg: '비밀번호를 설정하지 못했습니다.' });
        }
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
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/phone_number', verifyToken, async (req, res, next) => {
    /*
        휴대폰 번호 변경 요청 API(PUT): /api/user/phone_number
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        phone_numer: 변경할 휴대폰 번호(String, 필수)

        * 응답: success / failure
    */
    const { phone_number } = req.body;
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ phone_number });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    if (!isCellPhoneForm(phone_number)) {
        return res.status(202).send({ msg: '휴대폰 번호 형식에 맞지 않습니다.' });
    }
    try {
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 휴대폰 번호 변경을 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const updateUser = await User.update(
            { phone_number },
            { where: { user_id } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/car_info', verifyToken, upload.single('car_image'), async (req, res, next) => {
    /*
        차량 정보 등록 요청 API(PUT): /api/user/car_info
        { headers }: JWT_TOKEN(유저 임시 토큰 or 유저 로그인 토큰)
        
        car_location: 차량 등록 지역(String)
        car_num: 차량 등록 번호(String, 필수)
        car_image: 차량 이미지(ImageFile, 필수)
        
        * 응답: success / failure
    */
    const { car_location, car_num } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const car_image = req.file.path;
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({
        car_num,
        car_image
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        fileDeleter(car_image); // 실패이므로 업로드 한 파일 삭제.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { user_id }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 차량 등록을 할 수 없음.
            fileDeleter(car_image); // 실패이므로 업로드 한 파일 삭제.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const updateUser = await User.update(
            { car_location, car_num, car_image },
            { where: { user_id } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            fileDeleter(car_image); // 실패이므로 업로드 한 파일 삭제.
            return res.status(202).send({ msg: 'failure' });
        }
        const prevCarImage = existUser.dataValues.car_image; // 이전에 저장된 프로필 확인.
        if (prevCarImage) {
            fileDeleter(prevCarImage); // 이전에 저장된 프로필 이미지가 있으면 삭제.
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        fileDeleter(car_image); // 실패이므로 업로드 한 파일 삭제.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/birth', verifyToken, async (req, res, next) => {
    /*
        생년월일 변경 요청 API(PUT): /api/user/birth
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        birth: 변경할 생년월일(DateString, 필수)

        * 응답: success / failure
    */
    const { birth } = req.body;
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ birth });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const updateBirth = new Date(birth); // Date 형 변환
        const validDataType = isValidDataType({
            birth: updateBirth
        }); // 데이터 형식 검사.
        if (!validDataType.result) {
            // 데이터의 형식이 올바르지 않음.
            return res.status(202).send({ msg: validDataType.message });
        }
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 생년월일 변경을 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const updateUser = await User.update(
            { birth },
            { where: { user_id, email } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/agree_mail', verifyToken, async (req, res, next) => {
    /*
        메일 수신 동의 변경 요청 API(PUT): /api/user/agree_mail
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        state: 변경할 동의 상태(Bool, 필수)

        * 응답: success / failure
    */
    const { state } = req.body;
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ state });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 메일 수신 동의 변경을 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const updateUser = await User.update(
            { agree_mail: state },
            { where: { user_id, email } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            return res.status(202).send({ msg: 'failure', state: existUser.dataValues.agree_mail });
        }
        return res.status(201).send({ msg: 'success', state });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/agree_sms', verifyToken, async (req, res, next) => {
    /*
        SMS 수신 동의 변경 요청 API(PUT): /api/user/agree_sms
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        state: 변경할 동의 상태(Bool, 필수)

        * 응답: success / failure
    */
    const { state } = req.body;
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ state });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 SMS 수신 동의 변경을 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const updateUser = await User.update(
            { agree_sms: state },
            { where: { user_id, email } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            return res.status(202).send({ msg: 'failure', state: existUser.dataValues.agree_sms });
        }
        return res.status(201).send({ msg: 'success', state });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/agree_push', verifyToken, async (req, res, next) => {
    /*
        푸시알림 수신 동의 변경 요청 API(PUT): /api/user/agree_push
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        state: 변경할 동의 상태(Bool, 필수)

        * 응답: success / failure
    */
    const { state } = req.body;
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ state });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 푸시알림 수신 동의 변경을 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const updateUser = await User.update(
            { agree_push: state },
            { where: { user_id, email } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            return res.status(202).send({ msg: 'failure', state: existUser.dataValues.agree_push });
        }
        return res.status(201).send({ msg: 'success', state });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/native_token', verifyToken, async (req, res, next) => {
    /*
        푸시알림 디바이스 토큰 등록 요청 API(PUT): /api/user/native_token
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        native_token: 디바이스의 native_token

        * 응답: success / failure
    */
    const { native_token } = req.body;
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ native_token });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 푸시알림 수신 동의 변경을 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const updateUser = await User.update(
            { native_token },
            { where: { user_id, email } },
        ); // 유저 정보 수정.
        if (!updateUser) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});



/* DELETE */
router.delete('/', verifyToken, async (req, res, next) => {
    /*
        회원 탈퇴 요청 API(DELETE): /api/user
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: success / failure
    */
    const { user_id, email } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const existUser = await User.findOne({
            where: { user_id, email }
        }); // 가입한 유저인지 확인.
        if (!existUser) {
            // 가입하지 않은 유저는 회원 탈퇴를 할 수 없음.
            return res.status(202).send({ msg: '가입하지 않은 이메일입니다.' });
        }
        const deleteUser = await User.destroy({
            where: { user_id, email }
        }); // 유저 삭제.
        if (!deleteUser) {
            return res.status(202).send({ msg: 'failure' });
        }

        const { profile_image, car_image } = existUser.dataValues;
        fileDeleter(profile_image); // 프로필 이미지 파일 제거
        fileDeleter(car_image); // 자동차 이미지 파일 제거
        return res.status(200).send({ msg: 'success' });
    } catch (e) {
        // DB 삭제 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;
