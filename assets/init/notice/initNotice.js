const { Notice } = require('../../../models');


const initValue = [
    { notice_id: 1, notice_title: 'TEST 공지사항', notice_body: 'Test Event 제목입니다. Test Event 제목입니다. Test Event 제목입니다.' },
    { notice_id: 2, notice_title: 'TEST 공지사항', notice_body: 'Test Event 제목입니다. Test Event 제목입니다. Test Event 제목입니다.' },
    { notice_id: 3, notice_title: 'TEST 공지사항', notice_body: 'Test Event 제목입니다. Test Event 제목입니다. Test Event 제목입니다.' },
    { notice_id: 4, notice_title: 'TEST 공지사항', notice_body: 'Test Event 제목입니다. Test Event 제목입니다. Test Event 제목입니다.' }
]

const init = () => {
    initValue.forEach(async value => {
        const { notice_id, notice_title, notice_body } = value;
        await Notice.findOrCreate({
            where: { notice_id },
            defaults: { notice_title, notice_body }
        }); // 공지사항 생성.
    });
}

module.exports = {
    init
};