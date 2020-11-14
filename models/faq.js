module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'faq',
        {
            faq_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "자주 묻는 질문 id"
            },
            question: {
                type: DataTypes.STRING(255),
                comment: "질문 내용"
            },
            answer: {
                type: DataTypes.TEXT,
                comment: "답변 내용"
            },
            faq_type: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: "0: 회원가입, 1: 쿠폰, 2: 결제, 3: 포인트, 4: 주차공간, 5: 대여/연장"
            },
        },
        {
            timestamps: true,
            underscored: true,
        },
    );
};
