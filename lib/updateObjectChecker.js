/*
    Update할 때 Object 내에 value가 유효하지 않은(undefined, NaN) key를 제거.
*/

module.exports = (obj) => {
    Object.keys(obj).forEach(key => {
        const value = obj.key;
        if (value === undefined || isNaN(value)) {
            delete obj.key;
        }
    });
    return obj;
}