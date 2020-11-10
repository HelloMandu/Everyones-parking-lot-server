const express = require('express');

const { AppInfo } = require('../models');

const router = express.Router();

router.get('/', async (req, res, next) => {
    if (req.body === {}) {
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const appInfo = await AppInfo.findOne({ where: { id: 1 } });
    if (!appInfo) {
        res.send({ msg: '애플리케이션 정보가 없습니다.' });
    }
    res.send(appInfo);
});

module.exports = router;
