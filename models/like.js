module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'like',
        {
            user_id: {
                allowNull: false,
                type: DataTypes.INTEGER,
                comment: "유저 id"
            },
            place_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "주차공간 id"
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'like',
        },
    );
};
