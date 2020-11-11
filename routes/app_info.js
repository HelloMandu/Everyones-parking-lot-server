const express = require('express');

const { AppInfo } = require('../models');

const router = express.Router();

router.get('/', async (req, res, next) => {
    const appInfo = await AppInfo.findOne({ where: { id: 1 } });
    if (!appInfo) {
        res.send({ msg: '애플리케이션 정보가 없습니다.' });
    }
    res.send(appInfo);
});

module.exports = router;
