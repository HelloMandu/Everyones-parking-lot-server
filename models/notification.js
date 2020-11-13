module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'notification',
        {
            notification_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "알림 id"
            },
            notification_body: {
                type: DataTypes.STRING(255),
                comment: "알림 내용"
            },
            notification_type: {
                type: DataTypes.STRING(255),
                comment: "알림 타입"
            },
            url: {
                type: DataTypes.STRING(255),
                comment: "확인할 URL"
            },
            read_at: {
                type: DataTypes.DATE,
                comment: "알림 읽은 시간"
            },
        },
        {
            timestamps: true,
            underscored: true,
        },
    );
};
