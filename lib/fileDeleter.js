const fs = require('fs');
const path = require('path');
/*
    파일 경로를 통해 존재를 확인하고 안전하게 삭제하는 Library
*/
const fileDeleter = p => {
    if (p) {
        const filePath = path.join(__dirname, '../', p);
        const isExist = fs.existsSync(filePath);
        if (isExist) {
            fs.unlinkSync(filePath);
        }
    }
};

const filesDeleter = pArray => {
    if (Array.isArray(pArray)) {
        pArray.forEach(p => fileDeleter(p));
    }
}

module.exports = {
    fileDeleter,
    filesDeleter
};