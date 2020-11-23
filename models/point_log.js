module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'point_log',
        {
            plog_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "포인트 사용 기록 id"
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
            use_type: {
                type: DataTypes.BOOLEAN,
                comment: "포인트 사용 타입(0: 입금, 1: 출금)"
            },
        }, 
        {
            timestamps: true,
            underscored: true,
        },
    );
};
