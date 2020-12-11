const { Faq } = require('../../../models');


const initValue = [
    { faq_type: 0, question: '회원가입은 어떻게 하죠?', answer: '회원가입 페이지에서 하시면 됩니다.' },
    { faq_type: 0, question: '회원가입 할 때 필요한게 뭔가요?', answer: '이름, 연락처 등등 입니다.' },
    { faq_type: 0, question: '소셜 회원가입은 어떻게 하나요?', answer: '해당 소셜 로그인 버튼을 누르시면 됩니다.' },
    { faq_type: 1, question: '쿠폰은 어떻게 사용하나요?', answer: '대여하실 때 사용하실 쿠폰을 적용하면 됩니다.' },
    { faq_type: 1, question: '쿠폰은 어떻게 발급 받나요?', answer: '쿠폰함으로 가셔서 선택하시면 발급 받으실 수 있습니다.' },
    { faq_type: 2, question: '결제는 어떻게 하나요?', answer: '대여 신청에서 결제하실 방법을 선택한 후 진행하시면 됩니다.' },
    { faq_type: 2, question: '결제는 어떤 방법이 있나요?', answer: '카드 결제와 카카오페이, 네이버페이, 페이코 네 가지 방식이 있습니다.' },
    { faq_type: 3, question: '포인트는 어떻게 사용하나요?', answer: '대여하실 때 사용하실 포인트를 적용하면 됩니다.' },
    { faq_type: 3, question: '포인트는 어떻게 받나요?', answer: '이벤트 및 주차공간 대여 비용으로 받으실 수 있습니다.' },
    { faq_type: 4, question: '주차 공간은 어떻게 찾나요?', answer: '지도를 뒤적거리면 나옵니다.' },
    { faq_type: 4, question: '주차 공간은 어떻게 등록하나요?', answer: '주소와 사진으로 등록하면 됩니다.' },
    { faq_type: 5, question: '대여는 어떻게 하나요?', answer: '대여하실 주차공간을 선택 후 최소 시간 30분 이상으로 시간을 설정하여 대여 신청하면 됩니다.' },
    { faq_type: 5, question: '연장은 어떻게 하나요?', answer: '대여하신 주차공간의 이용내역에서 연장신청을 클릭하면 됩니다.' }
]

const init = () => {
    initValue.forEach(async value => {
        const { question, answer, faq_type } = value;
        await Faq.findOrCreate({
            where: { question, faq_type },
            defaults: { answer }
        }); // 자주 묻는 질문 생성.
    });
}

module.exports = {
    init
};