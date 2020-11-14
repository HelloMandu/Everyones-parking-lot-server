module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'comment',
        {
            comment_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "댓글 id"
            },
            comment_body: {
                type: DataTypes.TEXT('medium'),
                comment: "댓글 내용"
            },
            deleted: {
                type: DataTypes.BOOLEAN(2),
                defaultValue: 0,
                comment: "0: 정상, 1: 삭제됨"
            },
        },
        {
            timestamps: true,
            underscored: true,
        },
    );
};
