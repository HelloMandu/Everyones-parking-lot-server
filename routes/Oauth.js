const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');

const { User } = require('../models');

const REDIRECT_VIEW = 'http://localhost:3000';

const STATE = 'test1234';

const NAVER_AUTH_URL = 'https://nid.naver.com/oauth2.0/authorize';
const NAVER_REDIRECT_URL = 'http://localhost:8080/api/Oauth/naver_cb';
const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const NAVER_PROFILE_URL = 'https://openapi.naver.com/v1/nid/me';

router.get('/kakao', async (req, res, next) => {
    /*
        카카오 로그인 요청 API(GET): /api/Oauth/kakao
    */
});

router.get('/naver', async (req, res, next) => {
    /*
        네이버 로그인 요청 API(GET): /api/Oauth/naver
    */
    res.redirect(`${NAVER_AUTH_URL}?client_id=${process.env.NAVER_ID}&response_type=code&redirect_uri=${NAVER_REDIRECT_URL}&state=${STATE}`);
});

router.get('/naver_cb', async (req, res, next) => {
    /*
        네이버 로그인 완료 콜백 요청 API(GET): /api/Oauth/naver_cb
    */
    const { code, state, error, error_description } = req.query;

    if (error) {
        // API 요청 실패 시
    }
    if (code) {
        // API 요청 성공 시
        try {
            const token_res = await axios.get(NAVER_TOKEN_URL, {
                params: {
                    grant_type: 'authorization_code',
                    client_id: process.env.NAVER_ID,
                    client_secret: process.env.NAVER_SECRET,
                    code, STATE
                }
            });
            const { data: token_data } = token_res;
            /* ----- 접근 토큰 발급 완료 ----- */



            /* ----- 프로필 API 호출 ----- */
            const profile_res = await axios.post(NAVER_PROFILE_URL, null, {
                headers: {
                    'Authorization': `Bearer ${token_data.access_token}`
                }  
            });
            const { data: profile_data } = profile_res;
            if (profile_data.message === 'success') {
                const { id, profile_image, email, name, birthday } = profile_data.response;

                const existUser = await User.findOne({
                    where: { email }
                }); // 가입한 이메일이 있는지 확인.
                if (existUser) {
                    // 로그인.
                    if (existUser.dataValues.register_type === null) {
                        // 네이버 로그인 가입자가 아니므로 오류.
                    }
                    // 로그인.
                    res.send(existUser);
                } else {
                    // 회원가입.
                    const hash = await bcrypt.hash(id, 12); // 비밀번호 해싱.
                    const createUser = await User.create({
                        email, name,
                        password: hash,
                        phone_number: '00012345678',
                        birth: new Date(`70-${birthday}`),
                        profile_image,
                        register_type: 'naver',
                        email_verified_at: new Date()
                    });
                    if (!createUser) {
                        // 오류
                    }
                    // 회원가입 성공 및 로그인.
                    res.send(createUser);
                }
            } else {
                // 오류
                res.send('failure');
            }
            /* ----- 프로필 API 호출 완료 ----- */
        } catch (e) {
            // 오류
            res.send(e);
        }
    }
});

router.get('/facebook', async (req, res, next) => {
    /*
        페이스북 로그인 요청 API(GET): /api/Oauth/facebook
    */
    

});

module.exports = router;