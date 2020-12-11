const express = require('express');
const moment = require('moment');
const router = express.Router();


router.post('/', async (req, res, next) => {
    res.send({
        msg: 'success',
        body: req.ip
    });
});

module.exports = router;