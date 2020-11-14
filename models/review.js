module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'review',
        {
            review_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "리뷰 id"
            },
            review_body: {
                type: DataTypes.TEXT('long'),
                comment: "리뷰 내용"
            },
            review_rating: {
                type: DataTypes.DECIMAL(18, 1),
                defaultValue: 0.0,
                comment: "리뷰 평점"
            },
            review_img: {
                type: DataTypes.JSON,
                comment: "리뷰 이미지"
            },
            hit: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "조회 수"
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
