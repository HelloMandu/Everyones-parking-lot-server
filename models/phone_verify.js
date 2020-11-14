module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'phone_verify',
        {
            pv_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "휴대폰 인증 id"
            },
            pv_phone_number: {
                type: DataTypes.STRING(12),
                unique: true,
                comment: "휴대폰 번호"
            },
            pv_verify_number: {
                type: DataTypes.STRING(10),
                comment: "인증 번호"
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'phone_verify',
        },
    );
};
