# parking-server

---------------------------------------
## 공통

#### 휴대폰 인증 번호 요청 API(POST): /api/mobile/auth
```
-	phone_number: 유저 휴대폰 번호(String, 필수)

	=> 응답: success / failure
```
#### 휴대폰 인증 번호 확인 API(POST): /api/mobile/confirm
```
-	phone_number: 유저 휴대폰 번호(String, 필수)
-	auth_number: 전달 받은 인증 번호(String, 필수)

	=> 응답: success / failure
```
#### 앱 정보 요청 API(GET): /api/app_info
```
	=> 응답: info = { 앱 정보 Object }
```
#### 유저 정보 요청 API(GET): /api/user
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)

	=> 응답: user = { 유저 정보 Object }
```

---------------------------------------
## 로그인 / 회원가입

### 이메일 로그인 페이지

#### 로그인 요청 API(POST): /api/user/signin
```
-	email: 유저 이메일(String, 필수)
-	password: 유저 패스워드(String, 필수)

	=> 응답: token = 유저 로그인 토큰
```

#### 카카오 로그인 요청 API(GET): /api/Oauth/kakao (저 링크로 리다이렉트 하면 됨)
#### 네이버 로그인 요청 API(GET): /api/Oauth/naver (저 링크로 리다이렉트 하면 됨)
#### 페이스북 로그인 요청 API(GET): /api/Oauth/facebook(저 링크로 리다이렉트 하면 됨)

#### 푸시알림 디바이스 토큰 등록 요청 API(PUT): /api/user/native_token
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	native_token: 디바이스의 Native Token(String, 필수)

	=> 응답: success / failure
```
---------------------------------------
### 회원가입 페이지

#### 회원가입 요청 API(POST): /api/user
```
-	email: 유저 이메일(String, 필수)
-	name: 유저 이름(String, 필수)
-	password: 유저 비밀번호(String, 필수)
-	birth: 유저 생년월일(DateString, 필수)
-	phone_number: 유저 휴대폰 번호(String, 필수)
-	agree_item: 선택 동의(bool, 필수)

	=> 응답: token = 유저 임시 토큰
```

---------------------------------------
### 차량정보 등록 페이지

#### 차량 정보 등록 요청 API(PUT): /api/user/car_info
```
+	{ headers }: JWT_TOKEN(유저 임시 토큰)
-	car_location: 차량 등록 지역(String, 필수)
-	car_num: 차량 등록 번호(String, 필수)
-	car_image: 차량 이미지(ImageFile, 필수)

	=> 응답: success / failure
```

---------------------------------------
### 아이디 찾기 페이지

#### 아이디 찾기 API(POST): /api/user/find/user_id
```
-	name: 유저 이름(String, 필수)
-	phone_number: 유저 휴대폰 번호(String, 필수)
	
	=> 응답: email = 유저 이메일 String
```

---------------------------------------
### 비밀번호 찾기 페이지

#### 비밀번호 찾기 API(POST): /api/user/find/user_pw
```
-	name: 유저 이름(String, 필수)
-	email: 유저 이메일(String, 필수)
-	phone_number: 유저 휴대폰 번호(String, 필수)

	=> 응답: token = 유저 임시 토큰
```
#### 비밀번호 재설정 API(PUT): /api/user/password
```
+	{ headers }: JWT_TOKEN(유저 임시 토큰)
-	password: 새 비밀번호(String, 필수)

	=> 응답: success / failure
```

---------------------------------------
## 메인 페이지

#### 로그아웃 요청 API(POST): /api/user/logout
```
+	{ headers }: JWT_TOKEN(유저 임시 토큰)

	=> 응답: success / failure
```

### 기본 지도 페이지

#### 주차공간 리스트 요청 API(GET): /api/place
```
-	lat: 요청할 주차공간의 기준 위도(Float, 필수)
-	lng: 요청할 주차공간의 기준 경도(Float, 필수)
-	range: 요청할 주차공간의 거리 범위(Float, km 단위, default 값은 1000km)
-	filter: 필터링 항목([Type Array...] 정보 요청할 Type을 배열에 넣으면 됨.)

	=> 응답: places = [주차공간 Array...]
```
#### 즐겨찾는 주차공간 리스트 요청 API(GET): /api/place/like
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	filter: 필터링(현재 정체를 모르겠음.)

	=> 응답: places = [주차공간 Array...]
```
#### 최근 이용 주차공간 리스트 요청 API(GET): /api/place/recently
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)

	=> 응답: places = [주차공간 Array...]
```

---------------------------------------
### 주차공간 상세보기 페이지

#### 주차공간 상세 정보 요청 API(GET): /api/place/:place_id
```
+	{ params: place_id }: 상세 보기할 주차공간 id
	
	=> 응답:
		place = { 주차공간 데이터 Object }
		reviews = [주차공간의 리뷰 Array...]
		likes = 주차공간 좋아요 수
```
#### 주차공간 좋아요 유무 요청 API(GET): /api/like
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	place_id: 좋아요 유무 확인할 주차공간 id(Integer, 필수)
	
	=> 응답: status = 좋아요 상태
```
#### 주차공간 좋아요 추가 요청 API(POST): /api/like
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	place_id: 주차공간 id(Integer, 필수)

	=> 응답: status = 변경된 좋아요 상태
```
#### 주차공간 좋아요 제거 요청 API(DELETE): /api/like
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	place_id: 주차공간 id(Integer, 필수)

	=> 응답: status = 변경된 좋아요 상태
```

---------------------------------------
### 결제 정보 확인 페이지

#### 결제 정보 요청 API(GET): /api/order
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	place_id: 결제할 주차공간 id(Integer, 필수)
-	rental_start_time: 대여 시작 시간(DateTimeString, 필수)
-	rental_end_time: 대여 종료 시간(DateTimeString, 필수)

	=> 응답: place = { 주차공간 정보 Object(요금, 보증금) }
```
#### 결제 및 대여 등록 요청 API(POST): /api/rental
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	place_id: 결제할 주차공간 id(Interger, 필수)
-	cp_id: 사용할 쿠폰 id(Integer)
-	rental_start_time: 대여 시작 시간(DateTimeString, 필수)
-	rental_end_time: 대여 종료 시간(DateTimeString, 필수)
-	rental_price: 대여비(UNSIGNED Integer, 필수)
-	point_price: 사용할 포인트 할인 금액(UNSIGNED Integer)
-	deposit: 보증금(UNSIGNED Integer, 필수)
-	payment_type: 결제 수단(Integer, 0: 카드 | 1: 카카오페이 | 2: 네이버페이 | 3: 페이코, 필수)
-	card_id: 결제 카드 id(Integer, payment_type이 0이면 필수)
-	phone_number: 대여자 연락처(String, 필수)

	=> 응답: rental_id = 대여 주문 번호
```

---------------------------------------
### 결제 수단 선택 모달

#### 등록된 카드 리스트 요청 API(GET): /api/card
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)

	=> 응답: cards = [사용 가능한 카드 Array...]
	* card_type은 이미지 번호
```
#### 카드 등록 요청 API(POST): /api/card
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	card_num: 카드 번호(String, 필수)
-	valid_term: 유효 기간(DateString, 필수)
-	card_password: 카드 비밀번호(String, 필수)
-	cvc: cvc 코드(String, 필수)

	=> 응답: card = { 카드 정보 Object }
```
#### 카드 삭제 요청 API(DELETE): /api/card/:card_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: card_id }: 삭제할 카드 id

	=> 응답: success / failure
```

---------------------------------------
### 적용 쿠폰 선택 모달

#### 사용 가능한 쿠폰 리스트 요청 API(GET): /api/coupon
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	place_id: 결제할 주차공간 id(Integer, 필수)

	=> 응답: coupons = [사용가능한 쿠폰 Array...]
```

---------------------------------------
### 대여/결제 완료 페이지

#### 결제 및 대여 확인 요청 API(GET): /api/rental/:rental_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	{ params: rental_id }: 대여 주문 번호
	
	=> 응답:
		order = { 대여 주문 정보 Object, 유저 Object, 주차공간 Object },
		review = { 리뷰 Object }
```

---------------------------------------
### 이용 내역 페이지

#### 이용 내역 리스트 요청 API(GET): /api/rental
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	filter: 필터링 항목(아마도 날짜?)

	=> orders: = [대여 주문 정보(주차공간 포함) Array...]
```

---------------------------------------
### 이용 내역 상세 보기 페이지

#### 이용 내역 상세 정보 요청 API(GET): /api/rental/:rental_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: rental_id }: 대여 주문 번호
	
	=> 응답:
		order = { 대여 주문 정보 Object, 유저 Object, 주차공간 Object },
		review = { 리뷰 Object }
```

---------------------------------------
### 리뷰 작성 모달

#### 리뷰 작성 요청 API(POST): /api/review
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	rental_id: 대여 주문 번호(Integer, 필수)
-	place_id: 대여한 주차공간 id(Integer, 필수)
-	review_body: 리뷰 내용(String, 필수)
-	review_rating: 리뷰 평점(Float, 필수)

	=> 응답: success / failure
```
#### 리뷰 수정 요청 API(PUT): /api/review/:review_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: review_id }: 수정할 리뷰 id
-	review_body: 수정할 리뷰 내용(String)
-	review_rating: 수정할 리뷰 평점(Float)

	=> 응답: success / failure
```

---------------------------------------
### 대여 취소 신청 모달

#### 대여 취소 신청 API(PUT): /api/rental/:rental_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: rental_id }: 삭제할 대여 주문 번호
	
	=> 응답: success / failure
```

---------------------------------------
### 연장 신청 모달

#### 연장 신청 API(POST): /api/extension
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	rental_id: 대여 주문 번호(Integer, 필수)
-	extension_end_time: 연장 종료 시간(DateTImeString, 필수)
-	payment_type: 결제 수단(Integer, 0: 카드 | 1: 카카오페이 | 2: 네이버페이 | 3: 페이코, 필수)
-	extension_price: 연장 추가비(UNSIGNED Integer, 필수)

	=> 응답: success / failure
```

---------------------------------------
### 내가 작성한 리뷰 페이지

#### 리뷰 리스트 요청 API(GET): /api/review
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
	
	=> 응답: reviews = [리뷰(주차공간 포함) Array...]
```

---------------------------------------
### 리뷰 상세 보기 페이지

#### 리뷰 상세 정보 요청 API(GET): /api/review/:review_id
```
+	{ params: review_id }: 상세 보기할 리뷰 id

	=> 응답:
		review = { 리뷰 상세 정보 Object, 주차공간 Object }
		comments = [리뷰에 속한 댓글 Array...]
	
```
#### 댓글 작성 요청 API(POST): /api/comment
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	review_id: 댓글을 작성할 리뷰 id(Integer, 필수)
-	comment_body: 댓글 내용(String, 필수)

	=> 응답: comment = { 댓글 정보 Object }
```
#### 댓글 수정 요청 API(PUT): /api/comment/:comment_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: comment_id }: 수정할 댓글 id(Integer, 필수)
-	comment_body: 수정할 댓글 내용(String, 필수)

	=> 응답: comment = { 댓글 정보 Object }
```
#### 댓글 삭제 요청 API(DELETE): /api/comment/:comment_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: comment_id }: 삭제할 댓글 id(Integer, 필수)

	=> 응답: success / failure
```

---------------------------------------
### 나의 수익금 페이지

#### 나의 수익금 기록 요청 API(GET): /api/point_log
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)

	=> 응답: point_logs = [포인트 사용 기록 Array…]
```
#### 출금 신청 API(POST): /api/withdraw
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	bank_name: 받을 은행 이름(String, 필수)
-	account_number: 받을 계좌 번호(String, 필수)
-	withdraw_point: 출금할 액수(UNSIGNED Integer, 필수)

	=> 응답: success / failure
```

---------------------------------------
### 내 정보 수정 페이지

#### 프로필 이미지 변경 요청 API(PUT): /api/user/profile_image
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	profile_image: 변경할 프로필 이미지(ImageFile, 필수)

	=> 응답: profile_image = 변경된 이미지 경로
```
#### 이름 변경 요청 API(PUT): /api/user/name
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	name: 변경할 이름(String, 필수)

	=> 응답: success / failure
```
#### 비밀번호 변경 요청 API(PUT): /api/user/password
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	prev_password: 현재 비밀번호(String, 필수)
-	password: 변경할 패스워드(String, 필수)

	=> 응답: success / failure
```
#### 휴대폰 번호 변경 요청 API(PUT): /api/user/phone_number
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	phone_number: 변경할 휴대폰 번호(String, 필수)

	=> 응답: success / failure
```
#### 차랑 정보 변경 요청 API(PUT): /api/user/car_info
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	car_location: 차량 등록 지역(String, 필수)
-	car_num: 차량 등록 번호(String, 필수)
-	car_image: 차량 이미지(ImageFile, 필수)

	=> 응답: success / failure
```
#### 생년월일 변경 요청 API(PUT): /api/user/birth
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	birth: 변경할 생년월일(DateString, 필수)

	=> 응답: success / failure
```

#### 회원 탈퇴 요청 API(DELETE): /api/user
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
	=> 응답: success / failure
```

---------------------------------------
### 내 주차공간 관리 페이지

#### 내 주차공간 리스트 요청 API(GET): /api/place/my
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)

	=> 응답: places = [주차공간 Array…]
```

---------------------------------------
### 주차공간 등록 페이지

#### 주차공간 등록 요청 API(POST): /api/place
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	addr: 주차공간 주소(String, 필수)
-	addr_detail: 주차공간 상세주소(String)
-	addr_extra: 주차공간 여분주소(String)
-	post_num: 주차공간 우편번호(String)
-	lat: 주차공간의 위도(Float, 필수) 	=> 세로
-	lng: 주차공간의 경도(Float, 필수) 	=> 가로
-	place_type: 주차공간 타입(Integer, 필수, 주차공간 타입 = 0: 주차타운, 1: 지하주차장, 2: 지상주차장, 3: 지정주차)
-	place_name: 주차공간 이름(String, 필수)
-	place_comment: 주차공간 설명(String, 필수)
-	place_images: 주차공간 이미지([ImageFileList], 필수)
-	place_fee: 주차공간 요금 / 30분 기준(UNSIGNED Integer, 필수)
-	oper_start_time: 운영 시작 시간(DateTimeString, 필수)
-	oper_end_time: 운영 종료 시간(DateTimeString, 필수)

	=> 응답: success / failure
```
#### 주차공간 수정 요청 API(PUT): /api/place/:place_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: place_id }: 수정할 주차공간 id
-	addr: 주차공간 주소(String)
-	addr_detail: 주차공간 상세주소(String)
-	addr_extra: 주차공간 여분주소(String)
-	post_num: 주차공간 우편번호(String)
-	lat: 주차공간의 위도(Float) 	=> 세로
-	lng: 주차공간의 경도(Float) 	=> 가로
-	place_type: 주차공간 타입(String, 주차공간 타입 = 0: 주차타운, 1: 지하주차장, 2: 지상주차장, 3: 지정주차)
-	place_name: 주차공간 이름(String)
-	place_comment: 주차공간 설명(String)
-	place_images: 주차공간 이미지([ImageFileList])
-	place_fee: 주차공간 요금 / 30분 기준(UNSIGNED Integer)
-	oper_start_time: 운영 시작 시간(DateTimeString)
-	oper_end_time: 운영 종료 시간(DateTimeString)
	
	=> 응답: success / failure
```
#### 주차공간 삭제 요청 API(DELETE): /api/place/:place_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: place_id }: 삭제할 주차공간 id
	
	=> 응답: success / failure
```

---------------------------------------
### 알림함 페이지

#### 알림 리스트 요청 API(GET): /api/notification
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
		
	=> 응답: notifications = [알림 Array...]
```
#### 알림 읽음 처리 요청 API(PUT): /api/notification/:notification_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: notification_id }: 읽음 처리할 알림 id

	=> 응답: success / failure
```
#### 알림 전체 읽음 처리 요청 API(PUT): /api/notification
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)

	=> 응답: success / failure
```
#### 알림 삭제 요청 API(DELETE): /api/notification/:notification_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: notification_id }: 삭제할 알림 id

	=> 응답: success / failure
```

---------------------------------------
### 환경설정 페이지

#### 메일 수신 동의 변경 API(PUT): /api/user/agree_mail
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	state: 변경할 동의 상태(Bool, 필수)

	=> 응답: state = 변경된 동의 상태
```
#### SMS 수신 동의 변경 API(PUT): /api/user/agree_sms
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	state: 변경할 동의 상태(Bool, 필수)
 
	=> 응답: state = 변경된 동의 상태
```
#### 푸시알림 수신 동의 변경 API(PUT): /api/user/agree_push
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	state: 변경할 동의 상태(Bool, 필수)

	=> 응답: state = 변경된 동의 상태
```

---------------------------------------
## 쿠폰 페이지

#### 내 쿠폰 리스트 요청 API(GET): /api/coupon/my
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	order_type: 정렬 방식
	
	=> 응답: coupons = [쿠폰 Array…]
```
#### 쿠폰 코드 입력 요청 API(POST): /api/coupon
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	cp_code: 쿠폰 코드(String, 필수)

	=> 응답: success / failure
```
#### 쿠폰북 리스트 요청 API(GET): /api/coupon/book
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	order_type: 정렬 방식

	=> 응답: coupons = [쿠폰북 Array…]
```
#### 쿠폰 사용 내역 리스트 요청 API(GET): /api/coupon/use
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)

	=> 응답: coupons = [쿠폰 사용 내역 Array…]
```

---------------------------------------
### 이벤트 페이지

#### 이벤트 리스트 요청 API(GET): /api/event
```
	=> 응답: events = [이벤트 Array…]
```
#### 이벤트 상세 정보 요청 API(GET): /api/event/:event_id
```
+	{ params: event_id }: 상세 보기할 이벤트 id(Integer, 필수)

	=> 응답: event = { 이벤트 상세 정보 Object }
```

---------------------------------------
### 공지사항 페이지

#### 공지사항 작성 요청 API(POST): /api/notice
```
-	notice_title: 공지사항 제목(String, 필수)
-	notice_body: 공지사항 내용(String)
-	notice_images: 공지사항 첨부 이미지([ImageFileList])
    
	=> 응답: success / failure
```
#### 공지사항 리스트 요청 API(GET): /api/notice
```
	=> 응답: notices = [공지사항 Array...]
```
#### 공지사항 상세 정보 요청 API(GET): /api/notice/:notice_id
```
+	{ params: notice_id }: 상세 정보를 가져올 공지사항 id(Integer, 필수)

	=> 응답: notice = { 공지사항 상세 정보 Object }
```
#### 공지사항 수정 요청 API(PUT): /api/notice/:notice_id
```
+	{ params: notice_id }: 수정할 공지사항 id(Integer, 필수)
-	notice_title: 공지사항 제목(String)
-	notice_body: 공지사항 내용(String)
-	notice_images: 공지사항 첨부 이미지([ImageFileList])

	=> 응답: success / failure
```
#### 공지사항 삭제 요청 API(DELETE): /api/notice/:notice_id
```
+	{ params: notice_id }: 삭제할 공지사항 id(Integer, 필수)

	=> 응답: success / failure
```

---------------------------------------
### 자주 묻는 질문 페이지

#### 자주 묻는 질문 리스트 요청 API(GET): /api/faq
```
-	faq_type: 가져올 자주 묻는 질문 타입(Integer, 필수)

	=> 응답: faqs = [자주 묻는 질문 Array…]
```

---------------------------------------
### 1:1 문의 페이지

#### 1:1 문의 리스트 요청 API(GET): /api/qna
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)

	=> 응답: qnas = [1:1 문의(유저 포함) Array…]
```
#### 1:1 문의 상세 정보 요청 API(GET): /api/qna/:qna_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: qna_id }: 상세 보기할 1:1 문의 id(Integer, 필수)

	=> 응답: qna = { 1:1 문의 상세 정보 Object, 유저 Object }
```
#### 1:1 문의 작성 요청 API(POST): /api/qna
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
-	email: 답변 받을 이메일(String, 필수)
-	subject: 1:1 문의 제목(String, 필수)
-	question: 1:1 문의 내용(String, 필수)
-	q_files: 1:1 문의 첨부 파일([FileList])

	=> 응답: success / failure
```
#### 1:1 문의 수정 요청 API(PUT): /api/qna/:qna_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: qna_id }: 수정할 1:1 문의 id(Integer, 필수)
-	email: 답변 받을 이메일(String)
-	subject: 1:1 문의 제목(String)
-	question: 1:1 문의 내용(String)
-	q_files: 1:1 문의 첨부 파일([FileList])

	=> 응답: success / failure
```
#### 1:1 문의 삭제 요청 API(DELETE): /api/qna/:qna_id
```
+	{ headers }: JWT_TOKEN(유저 로그인 토큰)
+	{ params: qna_id }: 삭제할 1:1 문의 id(Integer, 필수)

	=> 응답: success / failure
```
