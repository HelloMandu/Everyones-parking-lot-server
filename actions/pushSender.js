const axios = require('axios');

/*
    특정 API Method를 수행한 후 그 행위에 대한 알림을
    디바이스 푸쉬로 전달하기 위한 Actions
*/

const URL = 'https://fcm.googleapis.com/fcm/send';


const sendPushNotification = async (native_token, url, title, body) => {
    // 푸쉬 알림을 보내기 위한 메소드.
    if (native_token) {
        try {
            // 알림 보냄
            const payload = {
                registration_ids: [native_token],
                notification: {
                    title, body,
                    click_action: 'OPEN_TOPIC',
                    sound: 'default',
                    icon: 'ic_launcher_alarm_round'
                },
                data: {
                    title, body,
                    redirectUrl: 'https://intospace.kr/' + url,
                }
            };
            const config = {
                headers: {
                    Authorization: `key=${process.env.PUSH_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
            const res = await axios.post(URL, payload, config);
            if (!res.data.success) {
                return false;
            }
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
};

module.exports = {
    sendPushNotification
};