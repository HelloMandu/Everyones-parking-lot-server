const conn = require(`./db`);
const parkingList = require(`../assets/json/BUSAN_PARKINGLOT.json`);

const userInsert = () => {
    const userSql = `INSERT INTO user (email, email_verified_at, name, password, phone_number, birth, car_location, car_num, car_img) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    conn.query(
        userSql,
        [
            'test_id@gmail.com',
            '2020-11-08 18:18:18',
            '조테스트',
            'password',
            '00000000000',
            '2020-11-08 18:18:18',
            '부산광역시 남구 중앙고',
            '24무 1564',
            JSON.stringify({ img: null }),
        ],
        (error) => {
            if (error) {
                throw error;
            }
        },
    );
    console.log('user inserted');
};

const parkingInsert = () => {
    const parkingSql = `INSERT INTO place (user_id, addr, addr_detail, lat, lng, place_name, place_comment, place_fee, oper_start_time, oper_end_time, place_status)VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    parkingList.forEach((parking) => {
        conn.query(
            parkingSql,
            [
                1,
                parking.ADDR_JIBUN,
                parking.ADDR_JIBUN,
                parking.LATITUDE,
                parking.LONGITUDE,
                parking.NAME,
                '테스트 주차공간입니당~',
                parking.BASIC_CHARGE,
                '2020-11-08 00:00:00',
                '2021-11-08 23:59:59',
                0,
            ],
            (error) => {
                if (error) {
                    throw error;
                }
            },
        );
    });
    console.log('parkingList inserted');
};

userInsert();
parkingInsert();
