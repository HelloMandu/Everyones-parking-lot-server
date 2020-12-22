const gcm = require('node-gcm');
const apn = require('apn');

/*
    특정 API Method를 수행한 후 그 행위에 대한 알림을
    디바이스 푸쉬로 전달하기 위한 Actions
*/


// Apple
const APPLE_OPTIONS = {
    gateway: "gateway.sandbox.push.apple.com", 
    cert: './keys/cert.pem',
    key: './keys/key.pem'
};
const APPLE_TOKEN_OPTION = {
    token: {
        key: '.p8 파일 경로',
        keyId: '키를 만들 때 표시된 아이디',
        teamId: 'parking'
    },
    production: false
}
// const appleProvider = new apn.Provider(APPLE_OPTIONS);


// Android
const ANDROID_SERVER_KEY = '서버키';
// const androidSender = new gcm.Sender(ANDROID_SERVER_KEY);

const sendPushNotification = async (native_token, title, body) => {
    // 푸쉬 알림을 보내기 위한 메소드.
    if (native_token) {
        try {
            // 안드로이드 알림 보냄
            const message = new gcm.Message({
                collapseKey: 'demo',
                priority: 'high',
                contentAvailable: true,
                delayWhileIdle: true,
                timeToLive: 3,
                restrictedPackageName: "somePackageName",
                dryRun: true,
                data: {
                    key1: 'message1',
                    key2: 'message2'
                },
                notification: {
                    title, body, icon: "ic_launcher",
                }
            }); // 메세지 생성
            androidSender.send(message, { registrationTokens: native_token }, (err, res) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(res);
                }
            })
        } catch (err) {
            console.error(err);
        }

        try {
            // ios 알림을 보냄
            const message = new apn.Notification(); // 보낼 데이터 객체 생성

            message.expiry = Math.floor(Date.now() / 1000) + 3600; // 보내기 실패할 경우 언제까지 재시도 할 것인지.
            message.badge = 3; // 앱의 아이콘에 표시될 숫자.
            message.sound = 'ping.aiff'; // 메세지가 도착했을 때 나는 소리.
            message.alert = body; // 메세지 내용
            message.payload = { "messageForm": "메시지" }; // 누가 보냈는지 여부.
            message.topic = "com.tistory.yselife.hello"; // ios app 번들 명.

            appleProvider.send(message, native_token).then(res => {
                console.log(res)
            }).catch(err => {
                console.error(err);
            });
        } catch (err) {
            console.error(err);
        }
    }
};

module.exports = {
    sendPushNotification
};