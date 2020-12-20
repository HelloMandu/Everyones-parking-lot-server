/*
    DB 시간 때문에 만든 Library
*/
const timeFormatter = date => new Date(date.setHours(date.getHours() - 9));
module.exports = timeFormatter;