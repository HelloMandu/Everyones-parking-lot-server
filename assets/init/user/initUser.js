const { User } = require('../../../models');

const initUser = {
    user_id: 1,
    email: 'parking@gmail.com',
    name: '테스터',
    password: '0',
    phone_number: '01012341234',
    birth: new Date('1993/12/11')
};


const init = () => {
    const { user_id } = initUser;
    const existUser = await User.findOne({
        where: { user_id }
    });
    if (!existUser) {
        await User.create(initUser);
    }
};

module.exports = {
    init
};