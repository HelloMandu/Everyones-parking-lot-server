module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'qna',
        {
            qna_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "1:1문의 id"
            },
            user_ip: {
                type: DataTypes.STRING(255),
                comment: "문의 유저 ip"
            },
            email: {
                type: DataTypes.STRING(255),
                comment: "답변 받을 email"
            },
            subject: {
                type: DataTypes.STRING(255),
                comment: "1:1 문의 제목"
            },
            question: {
                type: DataTypes.TEXT,
                comment: "1:1 문의 내용"
            },
            answer: {
                type: DataTypes.TEXT,
                comment: "1:1 문의 답변"
            },
            q_files: {
                type: DataTypes.JSON,
                comment: "1:1 문의 첨부 파일"
            },
            status: {
                type: DataTypes.BOOLEAN(4),
                defaultValue: 0,
                allowNull: false,
                comment: "0: 답변대기, 1: 답변완료"
            },
            hit: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "조회 수"
            },
            a_created_at: {
                type: DataTypes.DATE,
                comment: "답변 작성 일지"
            },
            a_updated_at: {
                type: DataTypes.DATE,
                comment: "답변 수정 일자"
            },
        },
        {
            timestamps: true,
            underscored: true,
        },
    );
};
