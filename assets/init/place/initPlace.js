const fs = require('fs');
const path = require('path');
const { Place } = require('../../../models');

const initValue = JSON.parse(fs.readFileSync(path.join(__dirname, '../../json/ParkingLot.json')));

const init = () => {
    initValue.forEach(async value => {
        const { Parking_Name: place_name, Road_name_address, Location_number_address, Basic_parking_fee, Latitude, Longitude } = value;

        const place_comment = '테스트 주차장입니다.';
        const lat = parseFloat(Latitude);
        const lng = parseFloat(Longitude);
        const oper_start_time = new Date('2020/12/01');
        const oper_end_time = new Date('2021//12/31');
        const place_fee = parseInt(Basic_parking_fee);
        const addr = Road_name_address !== "" ? Road_name_address : Location_number_address;

        await Place.findOrCreate({
            where: { place_name },
            defaults: {
                addr, addr_detail: '', lat, lng,
                place_type: 0,
                place_name, place_comment, place_images: ['test1.png', 'test2.png', 'test3.png'],
                place_fee,
                oper_start_time, oper_end_time
            }
        }); // 주차공간 생성.
    });
}

module.exports = {
    init
};