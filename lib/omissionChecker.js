/*
    누락된 데이터 검출 Library
*/

module.exports = function omissionChecker(dataObject) {
    const omissionArray = Object.keys(dataObject).filter(key => dataObject[key] === undefined);
    return omissionArray.length === 0 ? {
        result: true,
        message: '문제 없음.'
    } : {
        result: false,
        message: omissionArray.join(', ') + ' 데이터가 누락됨.'
    };
}