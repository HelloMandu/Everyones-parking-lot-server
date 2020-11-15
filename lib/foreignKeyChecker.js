/*
    DB Table 오류 검출 Library
*/

module.exports = function foreignKeyChecker(table) {
    return table + ' 테이블 데이터가 유효하지 않음.';
};