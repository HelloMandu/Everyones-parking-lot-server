module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'user',
        {
            user_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
                comment: "유저 id"
            },
            email: {
                type: DataTypes.STRING(255),
                unique: true,
                allowNull: false,
                comment: "이메일"
            },
            email_verified_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                comment: "이메일인증날짜"
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
                comment: "고객이름"
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
                comment: "패스워드"
            },
            phone_number: {
                type: DataTypes.STRING(15),
                allowNull: false,
                comment: "휴대폰번호"
            },
            birth: {
                type: DataTypes.DATE,
                allowNull: false,
                comment: "생년월일"
            },
            car_location: {
                type: DataTypes.STRING(20),
                comment: "차량 등록 지역"
            },
            car_num: {
                type: DataTypes.STRING(20),
                comment: "차량 등록 번호"
            },
            car_image: {
                type: DataTypes.JSON,
                comment: "차량 이미지"
            },
            profile_image: {
                type: DataTypes.JSON,
                comment: "프로필 이미지"
            },
            agree_mail: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                comment: "0: 거부, 1: 동의"
            },
            agree_sms: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                comment: "0: 거부, 1: 동의"
            },
            agree_push: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                comment: "0: 거부, 1: 동의"
            },
            point: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "포인트"
            },
            level: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
                comment: "10: 관리자, 1: 유저"
            },
            register_type: {
                type: DataTypes.STRING(150),
                comment: "NULL: 일반가입자, naver:네이버, facebook:페이스북, kakao:카카오"
            },
            native_token: {
                type: DataTypes.STRING(255),
            },

        },
        {
            timestamps: true,
            underscored: true,
        },
    );
};
