module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'point_log',
        {
            pl_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "포인트 사용 기록 id"
            },
            user_id: {
                type: DataTypes.INTEGER,
                comment: "포인트 사용 유저 id"
            },
            rental_id: {
                type: DataTypes.STRING(45),
                comment: "포인트 사용 대여 주문 번호"
            },
            extension_id: {
                type: DataTypes.STRING(45),
                comment: "포인트 사용 연장 주문 번호"
            },
            use_point: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "사용 포인트"
            },
            remain_point: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "남은 포인트"
            },
            point_text: {
                type: DataTypes.STRING(255),
                comment: "포인트 사용 설명"
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'point_log',
        },
    );
};
