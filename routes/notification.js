const express = require('express');
const router = express.Router();

const { Notification } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { sendDeleteNotification, sendReadNotification } = require('../actions/notificationSender');


/* READ */
router.get('/', verifyToken, async (req, res, next) => {
    /*
        알림 리스트 요청 API(GET): /api/notification
        { headers }: JWT_TOKEN(유저 로그인 토큰)
		
	    응답: notifications = [알림 Array…]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const notifications = await Notification.findAll({
            where: { user_id },
            order: [['createdAt', 'DESC']]
        }); // 알림 리스트를 가져옴.
        return res.status(200).send({ msg: 'success', notifications });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.put('/', verifyToken, async (req, res, next) => {
    /*
        알림 전체 읽음 처리 요청 API(PUT): /api/notification
        { headers }: JWT_TOKEN(유저 로그인 토큰)
		
	    응답: success / failure
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */

    const updateNotification = await Notification.update({
        read_at: new Date()
    }, {
        where: { user_id, read_at: null }
    }); // 읽지 않은 알림을 읽음 처리 함.
    if (!updateNotification) {
        return res.status(202).send({ msg: 'failure' });
    }
    return res.status(202).send({ msg: 'success' });
});


router.put('/:notification_id', verifyToken, async (req, res, next) => {
    /*
        알림 읽음 처리 요청 API(PUT): /api/notification/:notification_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: notification_id }: 읽음 처리할 알림 id
		
	    응답: success / failure
    */
    // const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const { notification_id } = req.params;
    /* request 데이터 읽어 옴. */
    
    const notificationID = parseInt(notification_id); // int 형 변환
    const result = await sendReadNotification(notificationID);
    if (result === -1) {
        return res.status(202).send({ msg: 'failure' });
    }
    return res.status(202).send({ msg: 'success' });
});

router.delete('/:notification_id', verifyToken, async (req, res, next) => {
    /*
        알림 삭제 요청 API(DELETE): /api/notification/:notification_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: notification_id }: 삭제할 알림 id
		
	    응답: success / failure
    */
    // const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const { notification_id } = req.params;
    /* request 데이터 읽어 옴. */

    const notificationID = parseInt(notification_id); // int 형 변환
    const result = await sendDeleteNotification(notificationID);
    if (!result) {
        return res.status(202).send({ msg: 'failure' });
    }
    return res.status(202).send({ msg: 'success' });
});

module.exports = router;
