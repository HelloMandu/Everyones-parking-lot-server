const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');

const { User } = require('../../models');



const REDIRECT_VIEW = 'http://localhost:3000/Oauth';

const STATE = 'test1234';

const NAVER_AUTH_URL = 'https://nid.naver.com/oauth2.0/authorize';
const NAVER_REDIRECT_URL = 'http://localhost:8080/api/Oauth/naver/callback';
const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const NAVER_PROFILE_URL = 'https://openapi.naver.com/v1/nid/me';



router.get('/', async (req, res, next) => {
    /*
        페이스북 로그인 요청 API(GET): /api/Oauth/facebook
    */
    res.render('facebook');
});

module.exports = router;