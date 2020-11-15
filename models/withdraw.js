module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'withdraw',
        {
            withdraw_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "출금 요청 id"
            },
            account_number: {
                type: DataTypes.String(255),
                allowNull: false,
                comment: "받을 계좌 번호"
            },
            withdraw_point: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                comment: "출금 요청 포인트"
            },
        }, 
        {
            timestamps: true,
            underscored: true,
        },
    );
};
