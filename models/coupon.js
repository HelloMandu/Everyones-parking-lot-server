module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'coupon',
        {
            cp_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "쿠폰 번호"
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
                type: DataTypes.DATE,
                comment: "사용 시작일"
            },
            cp_end_date: {
                type: DataTypes.DATE,
                comment: "사용 종료일"
            },
            cp_price: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "쿠폰 가격"
            },
            cp_minimum: {
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
                type: DataTypes.DATE,
                comment: "쿠폰 사용 일자"
            },
        },
        {
            timestamps: true,
            underscored: true,
        },
    );
};
