
module.exports = {
    isEmailForm: (asValue) => {
        const regExp = /^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
        return regExp.test(asValue); // 형식에 맞는 경우 true 리턴
    },
    isCellPhoneForm: (asValue) => {
        const regExp =  /^01(?:0|1|[6-9])(?:\d{3}|\d{4})\d{4}$/;
        const hyphenRegExp = /^01(?:0|1|[6-9])-(?:\d{3}|\d{4})-\d{4}$/
        return regExp.test(asValue) || hyphenRegExp.test(asValue); // 형식에 맞는 경우 true 리턴
    },
    isPasswordForm: (asValue) => {
        // const regExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,10}$/; //  8 ~ 10자 영문, 숫자 조합
        const regExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,}$/; // 8자 이상 영문, 숫자, 특수문자 조합
        return regExp.test(asValue); // 형식에 맞는 경우 true 리턴
    },
    isValidDataType: (dataObject) => {
        const validDataArray = Object.keys(dataObject).filter(
            key => isNaN(dataObject[key]) || dataObject[key] === undefined
        );
        return validDataArray.length === 0 ? {
            result: true,
            message: '문제 없음.'
        } : {
            result: false,
            message: validDataArray.join(', ') + ' 데이터의 형식이 올바르지 않음.'
        };
    }
}