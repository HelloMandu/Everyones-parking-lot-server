module.exports = (sequelize) => {
    return sequelize.define(
        'like',
        {},
        {
            timestamps: true,
            underscored: true,
        },
    );
};
