const { Notification } = require('../models');

/*
    특정 API Method를 수행한 후 그 행위에 대한 알림을 전달하기 위해
    공용적으로 알림을 생성하기 위한 Actions
*/

const sendCreateNotification = (user_id, body, type, url) => {
    try {
        const createNotification = Notification.create({
            user_id,
            notification_body: body,
            notification_type: type,
            url
        }); // 유저 알림 생성.

        if (!createNotification) {
            return -1; // 알림 생성에 실패했을 경우 id값을 -1로.
        }
        return createNotification.dataValues.notification_id;
        // 알림 생성에 성공하면 id값을 반환.
    } catch (e) {
        return -1; // 알림 생성에 실패했을 경우 id값을 -1로.
    }
}

const sendReadNotification = (notification_id) => {
    try {
        const updateNotification = Notification.update({
            read_at: new Date()
        }, {
            where: { notification_id }
        }); // 읽음 처리로 변경 후 읽은 시간 생성.

        if (!updateNotification) {
            return -1; // 알림 수정에 실패했을 경우 id값을 -1로.
        }
        return updateNotification.dataValues.notification_id;
        // 알림 수정에 성공하면 id값을 반환.
    } catch (e) {
        return -1; // 알림 수정에 실패했을 경우 id값을 -1로.
    }
}

const sendDeleteNotification = (notification_id) => {
    try {
        const destroyNotification = Notification.destroy({
            where: { notification_id }
        }); // 알림 삭제.
        if (!destroyNotification) {
            return false; // 알림 삭제에 실패했을 경우 false.
        }
        return true; // 알림 삭제에 성공했을 경우 true.
    } catch (e) {
        return false; // 알림 삭제에 실패했을 경우 false.
    }
}

module.exports = {
    sendCreateNotification,
    sendReadNotification,
    sendDeleteNotification
};