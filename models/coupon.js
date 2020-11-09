module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'coupon',
        {
            cp_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                comment: "쿠폰 번호"
            },
            cz_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "쿠폰 존 id"
            },
            user_id: {
                type: DataTypes.INTEGER,
                comment: "유저 id"
            },
            cp_subject: {
                type: DataTypes.STRING(255),
                comment: "쿠폰 제목"
            },
            cp_target: {
                type: DataTypes.INTEGER,
                comment: "쿠폰 타겟"
            },
            cp_start_date: {
                type: DataTypes.Date,
                comment: "사용 시작일"
            },
            cp_end_date: {
                type: DataTypes.date,
                comment: "사용 종료일"
            },
            cp_price: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "쿠폰 가격"
            },
            minimum_cost: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "사용 최소 비용"
            },
            use_state: {
                type: DataTypes.BOOLEAN(4),
                defaultValue: 0,
                comment: "사용 유무 = 0: 미사용, 1: 사용, 2: 회수"
            },
            use_date: {
                type: DataTypes.Date,
                comment: "쿠폰 사용 일자"
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'coupon',
        },
    );
};
