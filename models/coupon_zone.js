module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'coupon_zone',
        {
            cz_id: {
                type: DataTypes.STRING(255),
                allowNull: false,
                primaryKey: true,
                comment: "쿠폰 존 id"
            },
            cz_subject: {
                type: DataTypes.STRING(255),
                allowNull: false,
                comment: "쿠폰 존 이름"
            },
            cz_target: {
                type: DataTypes.INTEGER,
                comment: "NULL이나 공백이면 전체 타겟"
            },
            cz_period: {
                type: DataTypes.INTEGER,
                comment: "쿠폰 다운로드 후 기간"
            },
            cz_start_date: {
                type: DataTypes.DATE,
                comment: "쿠폰 존 시작일"
            },
            cz_end_date: {
                type: DataTypes.DATE,
                comment: "쿠폰 존 종료일"
            },
            cz_price: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "쿠폰 존 가격"
            },
            cz_minimum: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "쿠폰 존 최소 사용 가격"
            },
            cz_download: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "쿠폰 존 다운로드"
            },
            cz_limit: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "다운로드 수 제한"
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'coupon_zone',
        },
    );
};
