module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'card',
        {
            card_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "카드 id"
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
                type: DataTypes.INTEGER,
                comment: "카드 타입"
            },
            cvc: {
                allowNull: false,
                type: DataTypes.STRING(5),
                comment: "CVC 코드"
            },
            valid_term: {
                allowNull: false,
                type: DataTypes.DATE,
                comment: "유효기간"
            },
        },
        {
            timestamps: true,
            underscored: true,
        },
    );
};
