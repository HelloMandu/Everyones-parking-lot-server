module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'phone_verify',
        {
            phone_number: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING(12),
                unique: true,
                comment: "휴대폰 번호"
            },
            auth_number: {
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
