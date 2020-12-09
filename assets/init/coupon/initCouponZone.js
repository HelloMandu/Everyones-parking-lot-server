const { CouponZone } = require('../../../models');

const initialValue = [
    {
        cz_id: 'DEFA-12DJ-ACC6-45FG',
        cz_subject: '첫 대여 할인 쿠폰',
        cz_target: null,
        cz_period: 90,
        cz_start_date: new Date('2020/12/01'),
        cz_end_date: new Date('2021/12/31'),
        cz_price: 3000,
        cz_minimum: 10000,
        cz_limit: 1000
    },
    {
        cz_id: '65BA-Z6EE-BBFV-K75F',
        cz_subject: '주차공간 등록 기념 쿠폰',
        cz_target: null,
        cz_period: 90,
        cz_start_date: new Date('2020/12/01'),
        cz_end_date: new Date('2021/12/31'),
        cz_price: 1000,
        cz_minimum: 10000,
        cz_limit: 1000
    },
    {
        cz_id: 'BHGU-5462-BGY6-196F',
        cz_subject: '오픈 기념 할인 쿠폰',
        cz_target: null,
        cz_period: 90,
        cz_start_date: new Date('2020/12/01'),
        cz_end_date: new Date('2021/12/31'),
        cz_price: 5000,
        cz_minimum: 20000,
        cz_limit: 1000
    },
    {
        cz_id: 'L54L-1NG5-71PU-BOO2',
        cz_subject: '첫 리뷰 할인 쿠폰',
        cz_target: null,
        cz_period: 90,
        cz_start_date: new Date('2020/12/01'),
        cz_end_date: new Date('2021/12/31'),
        cz_price: 2000,
        cz_minimum: 10000,
        cz_limit: 1000
    },
    {
        cz_id: 'DEFA-12DJ-ACC6-45FG',
        cz_subject: '첫 대여 할인 쿠폰',
        cz_target: null,
        cz_period: 90,
        cz_start_date: new Date('2020/12/01'),
        cz_end_date: new Date('2021/12/31'),
        cz_price: 3000,
        cz_minimum: 10000,
        cz_limit: 1000
    },
    {
        cz_id: '65BA-Z6EE-BBFV-K75F',
        cz_subject: '주차공간 등록 기념 쿠폰',
        cz_target: null,
        cz_period: 90,
        cz_start_date: new Date('2020/12/01'),
        cz_end_date: new Date('2021/12/31'),
        cz_price: 1000,
        cz_minimum: 10000,
        cz_limit: 1000
    },
    {
        cz_id: 'BHGU-5462-BGY6-196F',
        cz_subject: '오픈 기념 할인 쿠폰',
        cz_target: null,
        cz_period: 90,
        cz_start_date: new Date('2020/12/01'),
        cz_end_date: new Date('2021/12/31'),
        cz_price: 5000,
        cz_minimum: 20000,
        cz_limit: 1000
    },
    {
        cz_id: 'L54L-1NG5-71PU-BOO2',
        cz_subject: '첫 리뷰 할인 쿠폰',
        cz_target: null,
        cz_period: 90,
        cz_start_date: new Date('2020/12/01'),
        cz_end_date: new Date('2021/12/31'),
        cz_price: 2000,
        cz_minimum: 10000,
        cz_limit: 1000
    },
    // {
    //     cz_id: '1111',
    //     cz_subject: '첫 리뷰 할인 쿠폰',
    //     cz_target: null,
    //     cz_period: 90,
    //     cz_start_date: new Date('2020/12/01'),
    //     cz_end_date: new Date('2021/12/31'),
    //     cz_price: 2000,
    //     cz_minimum: 10000,
    //     cz_limit: 1000
    // },
    // {
    //     cz_id: '2222',
    //     cz_subject: '첫 리뷰 할인 쿠폰',
    //     cz_target: null,
    //     cz_period: 90,
    //     cz_start_date: new Date('2020/12/01'),
    //     cz_end_date: new Date('2021/12/31'),
    //     cz_price: 2000,
    //     cz_minimum: 10000,
    //     cz_limit: 1000
    // },
    // {
    //     cz_id: '3333',
    //     cz_subject: '첫 리뷰 할인 쿠폰',
    //     cz_target: null,
    //     cz_period: 90,
    //     cz_start_date: new Date('2020/12/01'),
    //     cz_end_date: new Date('2021/12/31'),
    //     cz_price: 2000,
    //     cz_minimum: 10000,
    //     cz_limit: 1000
    // },
    // {
    //     cz_id: '4444',
    //     cz_subject: '첫 리뷰 할인 쿠폰',
    //     cz_target: null,
    //     cz_period: 90,
    //     cz_start_date: new Date('2020/12/01'),
    //     cz_end_date: new Date('2021/12/31'),
    //     cz_price: 2000,
    //     cz_minimum: 10000,
    //     cz_limit: 1000
    // },
    // {
    //     cz_id: '5555',
    //     cz_subject: '첫 리뷰 할인 쿠폰',
    //     cz_target: null,
    //     cz_period: 90,
    //     cz_start_date: new Date('2020/12/01'),
    //     cz_end_date: new Date('2021/12/31'),
    //     cz_price: 2000,
    //     cz_minimum: 10000,
    //     cz_limit: 1000
    // },
];

const init = () => {
    initialValue.forEach(async value => {
        const { cz_id } = value;
        await CouponZone.findOrCreate({
            where: { cz_id },
            defaults: value
        });
    });
}

module.exports = {
    init
};