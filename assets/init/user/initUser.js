const { User } = require('../../../models');

const initUser = {
    user_id: 1,
    email: 'parking@gmail.com',
    name: '테스터',
    password: '0',
    phone_number: '01012341234',
    birth: new Date('1993/12/11')
};


const init = async () => {
    const { user_id } = initUser;
    await User.findOrCreate({
        where: { user_id },
        defaults: initUser
    });
};

module.exports = {
    init
};