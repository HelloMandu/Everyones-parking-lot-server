

/*
    특정 API Method를 수행한 후 그 행위에 대한 알림을
    디바이스 푸쉬로 전달하기 위한 Actions
*/


const sendPushNotification = async (native_token, title, body) => {
    // 푸쉬 알림을 보내기 위한 메소드.
    if (native_token) {
        try {
            // 알림 보냄
            
        } catch (err) {
            console.error(err);
        }
    }
};

module.exports = {
    sendPushNotification
};