module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'qna',
        {
            card_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "1:1문의 id"
            },
            bank_num: {
                allowNull: false,
                type: DataTypes.INTEGER,
                comment: "은행 번호"
            },
            bank_name: {
                allowNull: false,
                type: DataTypes.STRING(255),
                comment: "은행 이름"
            },
            card_num: {
                allowNull: false,
                type: DataTypes.STRING(255),
                comment: "카드 번호"
            },
            card_type: {
                allowNull: false,
                type: DataTypes.STRING(255),
                comment: "카드 타입"
            },
        },
        {
            timestamps: true,
            underscored: true,
        },
    );
};