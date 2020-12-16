const fs = require('fs');
const path = require('path');
const { Place } = require('../../../models');

const initValue = JSON.parse(fs.readFileSync(path.join(__dirname, '../../json/ParkingLot.json')));
const initBusanValue = JSON.parse(fs.readFileSync(path.join(__dirname, '../../json/BUSAN_PARKINGLOT.json')));


const typeParser = type => {
    switch (type) {
        case '노외': return 1;
        case '노상': return 2;
        case '부설': return 3;
        default: return 0
    }
}

const init = () => {
    initValue.forEach(async value => {
        const { Parking_Name: place_name, Road_name_address, Location_number_address, Basic_parking_fee, Latitude, Longitude, Type } = value;

        const place_comment = place_name  + ' 주차장입니다.';
        const lat = parseFloat(Latitude);
        const lng = parseFloat(Longitude);
        const oper_start_time = new Date('2020/12/01');
        const oper_end_time = new Date('2021//12/31');
        const place_fee = parseInt(Basic_parking_fee);
        const place_type = typeParser(Type);
        const addr = Road_name_address !== "" ? Road_name_address : Location_number_address;
        if (lat && lng) {
            await Place.findOrCreate({
                where: { place_name },
                defaults: {
                    user_id: 1,
                    addr, addr_detail: '', lat, lng,
                    place_type,
                    place_name, place_comment, place_images: ['test1.png', 'test2.png', 'test3.png'],
                    place_fee,
                    oper_start_time, oper_end_time
                }
            }); // 주차공간 생성.
        }
    });
}

module.exports = {
    init
};