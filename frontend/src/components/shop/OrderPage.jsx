import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../Header.jsx';
import PortOne from '@portone/browser-sdk/v2';

// 배송지명 Enum 예시
const DELIVERY_NAMES = [
  { value: 'HOME', label: '집' },
  { value: 'COMPANY', label: '회사' },
  { value: 'SCHOOL', label: '학교' },
  { value: 'ETC', label: '기타' },
];

function OrderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderItems = location.state?.orderItems || [];

  // 배송지 정보 및 모달 상태
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressInfo, setAddressInfo] = useState(null);
  const [orderMemo, setOrderMemo] = useState('');

  const [availableMileage, setAvailableMileage] = useState(0);
  const [usedMileage, setUsedMileage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CARD');

  useEffect(() => {
    axios.get('/test').then(res => console.log('프록시 테스트 응답:', res.data)).catch(err => console.log('프록시 테스트 에러:', err));
  }, []);

  useEffect(() => {
    axios.get('/members/mileage')
      .then(res => setAvailableMileage(res.data.mileage ?? 0))
      .catch(() => setAvailableMileage(0));
  }, []);

  const totalPrice = orderItems.reduce((sum, i) => sum + i.orderPrice, 0);
  const shippingFee = orderItems.length > 0 ? 100 : 0;
  const finalPrice = totalPrice + shippingFee - usedMileage;

  const [saveHover, setSaveHover] = useState(false);
  const [addressBtnHover, setAddressBtnHover] = useState(false);
  const [changeBtnHover, setChangeBtnHover] = useState(false);

  const [focusField, setFocusField] = useState('');

  const handlePayment = () => {
    if (!addressInfo) {
      alert('배송지 정보를 입력해 주세요.');
      return;
    }
    if (orderItems.length === 0) {
      alert('주문 상품이 없습니다.');
      return;
    }

    // 1. 아임포트 객체 초기화
    const { IMP } = window;
    IMP.init(process.env.REACT_APP_PORTONE_STORE_ID); // 아임포트 가맹점 식별코드

    // 2. 결제 요청 파라미터 구성
    const orderId = 'ORDER-' + Date.now();
    const params = {
      pg: 'html5_inicis', // 결제대행사(PG사)설정: KG이니시스
      pay_method: paymentMethod === 'CARD' ? 'card' : 'vbank', //결제수단
      merchant_uid: orderId, //주문 고유번호
      name: orderItems.map(i => i.itemName).join(', '), //상품명
      amount: finalPrice, //결제 금액
      buyer_email: localStorage.getItem('email')?.trim() || 'test@portone.io', //구매자 이메일
      buyer_name: addressInfo.receiverName, //구매자 이름
      buyer_tel: addressInfo.receiverPhone, //구매자 연락처
      buyer_addr: addressInfo.address + ' ' + addressInfo.addressDetail, //주소
      buyer_postcode: '', // 필요시 추가
      m_redirect_url: `${window.location.origin}/payment/success?orderId=${orderId}`, //모바일 결제 리디렉션 URL - 모바일 웹에서만 사용됨
    };

    // 3. 결제창 호출
    IMP.request_pay(params, (rsp) => {
      console.log('아임포트 콜백:', rsp);
      if (rsp.success) {
        console.log('결제 성공! 주문/검증 API 호출');
        axios.post('/orders/verify-and-create-order', {
          impUid: rsp.imp_uid,
          merchantUid: rsp.merchant_uid,
          totalPrice: finalPrice,
          orderItems: orderItems,
          addressInfo: addressInfo,
          orderMemo: orderMemo,
          usedMileage: usedMileage
        }).then(() => {
          console.log('주문/검증 API 성공');
          navigate(`/order/complete?orderId=${rsp.merchant_uid}`);
        }).catch((err) => {
          console.log('주문/검증 API 실패', err);
          alert('결제 검증 또는 주문 생성에 실패했습니다.');
          navigate('/payment/fail');
        });
      } else {
        console.log('결제 실패:', rsp.error_msg);
        alert('결제에 실패했습니다: ' + rsp.error_msg);
        navigate('/payment/fail');
      }
    });
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 0', display: 'flex', gap: 32 }}>
        <div style={{ flex: 2 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 32 }}>주문/결제</h1>

          {/* 배송지 요약 + 변경 버튼 */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>배송지</h2>
              <button
                onClick={() => setShowAddressModal(true)}
                onMouseEnter={() => setChangeBtnHover(true)}
                onMouseLeave={() => setChangeBtnHover(false)}
                style={{
                  color: changeBtnHover ? '#223A5E' : '#FFB300',
                  background: 'none',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'color 0.15s'
                }}
              >
                변경
              </button>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '8px 0 16px 0' }} />
            {addressInfo ? (
              <div style={{ lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 2 }}>
                  {DELIVERY_NAMES.find(d => d.value === addressInfo.deliveryName)?.label || addressInfo.deliveryName}
                </div>
                <div>{addressInfo.address} {addressInfo.addressDetail}</div>
                <div style={{ color: '#888', fontSize: '0.98rem' }}>{addressInfo.receiverName} {addressInfo.receiverPhone}</div>
              </div>
            ) : (
              <div style={{ color: '#888', fontSize: '1rem' }}>배송지 정보를 입력해 주세요.</div>
            )}
            {/* 배송메세지 입력란 */}
            <div style={{ marginTop: 16 }}>
              <label htmlFor="orderMemo" style={{ color: '#888', fontWeight: 500, fontSize: '1rem', marginRight: 8 }}>배송메세지</label>
              <input
                id="orderMemo"
                type="text"
                value={orderMemo}
                onChange={e => setOrderMemo(e.target.value)}
                placeholder="예: 문 앞에 놓아주세요."
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginTop: 4 }}
                maxLength={50}
              />
            </div>
          </section>

          {/* 주문 상품 목록 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>
              주문상품
              <span style={{ fontSize: '1rem', fontWeight: 400, color: '#666', marginLeft: 12 }}>
                <span>{orderItems.length}</span>
                <span style={{ marginLeft: 2 }}>건</span>
              </span>
            </h2>
            <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
              {orderItems.length > 0 ? orderItems.map(item => (
                <div key={item.itemId + '-' + item.optionName} style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #f0f0f0', padding: '1.125rem 0', gap: '1.125rem' }}>
                  <img src={item.thumbnailUrl} alt="썸네일" style={{ width: '5rem', height: '5rem', objectFit: 'cover', borderRadius: '0.125rem', marginRight: '1.25rem' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '1.05rem', marginBottom: '0.375rem', color: '#222', wordBreak: 'break-all' }}>{item.itemName}</div>
                    <div style={{ color: '#888', fontSize: '0.97rem', marginBottom: '0.625rem' }}>{item.optionName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.15rem', color: '#222' }}>{(item.orderPrice).toLocaleString()}원</span>
                      <span style={{ color: '#bbb', fontSize: '1rem' }}>|</span>
                      <span style={{ color: '#888', fontSize: '1rem' }}>{item.quantity}개</span>
                    </div>
                  </div>
                </div>
              )) : <div>주문 상품이 없습니다.</div>}
            </div>
          </section>

          {/* 마일리지 사용 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>마일리지 사용</h2>
            <div style={{ marginBottom: 8, color: '#888' }}>사용 가능: {availableMileage.toLocaleString()}P</div>
            <input
              type="number"
              min={0}
              max={availableMileage}
              value={usedMileage}
              onChange={e => setUsedMileage(Math.max(0, Math.min(availableMileage, Number(e.target.value))))}
              style={{ width: 120, padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
            /> P
          </section>

        </div>
        {/* 우측: 결제 요약 */}
        <div style={{ flex: 1, background: '#fafbfc', borderRadius: 12, padding: '2rem 1.5rem', minWidth: 320, maxHeight: 400, alignSelf: 'flex-start', boxShadow: '0 2px 12px #0001' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 18 }}>결제금액 요약</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span>총 상품금액</span>
            <span>{totalPrice.toLocaleString()}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span>배송비</span>
            <span>{shippingFee.toLocaleString()}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span>마일리지 사용</span>
            <span>-{usedMileage.toLocaleString()}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem', margin: '18px 0' }}>
            <span>최종 결제금액</span>
            <span style={{ color: '#223A5E' }}>{finalPrice.toLocaleString()}원</span>
          </div>
          <button style={{ width: '100%', background: '#223A5E', color: '#fff', fontWeight: 700, fontSize: '1.1rem', border: 'none', borderRadius: 8, padding: '1rem 0', cursor: 'pointer' }} onClick={handlePayment}>
            결제하기
          </button>
        </div>
      </div>
      {/* 배송지 입력 모달 */}
      {showAddressModal && (
        <AddressModal
          onClose={() => setShowAddressModal(false)}
          onSave={info => { setAddressInfo(info); setShowAddressModal(false); }}
          initialValue={addressInfo}
        />
      )}
    </>
  );
}

// 내부 함수형 컴포넌트: 배송지 입력 모달
function AddressModal({ onClose, onSave, initialValue }) {
  const [receiverName, setReceiverName] = useState(initialValue?.receiverName || '');
  const [receiverPhone, setReceiverPhone] = useState(initialValue?.receiverPhone || '');
  const [address, setAddress] = useState(initialValue?.address || '');
  const [addressDetail, setAddressDetail] = useState(initialValue?.addressDetail || '');
  const [deliveryName, setDeliveryName] = useState(initialValue?.deliveryName || 'HOME');
  const [focusField, setFocusField] = useState('');
  const [saveHover, setSaveHover] = useState(false);
  const [addressBtnHover, setAddressBtnHover] = useState(false);
  const [invalidFields, setInvalidFields] = useState([]);

  // 연락처 하이픈 자동 추가 함수
  const formatPhone = (value) => {
    const num = value.replace(/[^0-9]/g, '');
    if (num.length < 4) return num;
    if (num.length < 8) return num.slice(0, 3) + '-' + num.slice(3);
    return num.slice(0, 3) + '-' + num.slice(3, 7) + '-' + num.slice(7, 11);
  };

  // 기본 네이비, 포커스(클릭) 시 머스터드
  const getBorderColor = (field) => focusField === field ? '#FFB300' : '#223A5E';

  // 입력란 스타일 동적 적용
  const inputStyle = field => ({
    flex: 1,
    padding: 8,
    borderRadius: 6,
    border: invalidFields.includes(field)
      ? '2px solid #C62828'
      : `2px solid ${getBorderColor(field)}`,
    outline: 'none',
    transition: 'border 0.15s'
  });

  // 카카오 우편번호 팝업 연동 함수
  const openDaumPostcode = () => {
    new window.daum.Postcode({
      oncomplete: function(data) {
        setAddress(data.roadAddress);
      }
    }).open();
  };

  // 저장 버튼 클릭 시 유효성 검사 및 깜빡임 처리
  const handleSave = () => {
    const emptyFields = [];  //배송지 입력 필드
    if (!receiverName) emptyFields.push('receiverName'); //받는 사람
    if (!receiverPhone) emptyFields.push('receiverPhone'); //연락처
    if (!address) emptyFields.push('address'); //도로명주소
    if (!addressDetail) emptyFields.push('addressDetail'); //상세주소
    if (!deliveryName) emptyFields.push('deliveryName'); //배송지명
    if (emptyFields.length > 0) {
      setInvalidFields(emptyFields);
      setTimeout(() => setInvalidFields([]), 300);
      return;
    }
    onSave({ receiverName, receiverPhone, address, addressDetail, deliveryName });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{ position: 'relative', background: '#fff', borderRadius: 12, padding: 32, minWidth: 400, boxShadow: '0 2px 16px #0002' }}>
        {/* X 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: '2rem', color: '#223A5E', cursor: 'pointer', zIndex: 10
          }}
          aria-label="닫기"
        >
          ×
        </button>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 28, color: '#223A5E', textAlign: 'left' }}>배송지 입력</h2>
        <div style={{ marginBottom: 14 }}>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: 80, color: '#888', fontWeight: 500, fontSize: '1rem', marginRight: 8 }}>받는사람</span>
            <input
              value={receiverName}
              onChange={e => setReceiverName(e.target.value)}
              onFocus={() => setFocusField('receiverName')}
              onBlur={() => setFocusField('')}
              style={inputStyle('receiverName')}
            />
          </div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: 80, color: '#888', fontWeight: 500, fontSize: '1rem', marginRight: 8 }}>연락처</span>
            <input
              value={receiverPhone}
              onChange={e => setReceiverPhone(formatPhone(e.target.value))}
              onFocus={() => setFocusField('receiverPhone')}
              onBlur={() => setFocusField('')}
              style={inputStyle('receiverPhone')}
              maxLength={13}
              inputMode="numeric"
            />
          </div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: 80, color: '#888', fontWeight: 500, fontSize: '1rem', marginRight: 8 }}>도로명주소</span>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              onFocus={() => setFocusField('address')}
              onBlur={() => setFocusField('')}
              style={inputStyle('address')}
              readOnly
            />
            <button
              type="button"
              onClick={openDaumPostcode}
              onMouseEnter={() => setAddressBtnHover(true)}
              onMouseLeave={() => setAddressBtnHover(false)}
              style={{
                marginLeft: 8,
                padding: '7px 14px',
                borderRadius: 6,
                border: '2px solid #223A5E',
                background: addressBtnHover ? '#3a4a6a' : '#223A5E',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s'
              }}
            >
              <i className="fas fa-home" style={{ fontSize: '1.1rem', color: '#fff' }}></i>
            </button>
          </div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: 80, color: '#888', fontWeight: 500, fontSize: '1rem', marginRight: 8 }}>상세주소</span>
            <input
              value={addressDetail}
              onChange={e => setAddressDetail(e.target.value)}
              onFocus={() => setFocusField('addressDetail')}
              onBlur={() => setFocusField('')}
              style={inputStyle('addressDetail')}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ minWidth: 80, color: '#888', fontWeight: 500, fontSize: '1rem', marginRight: 8 }}>배송지명</span>
            <select
              value={deliveryName}
              onChange={e => setDeliveryName(e.target.value)}
              onFocus={() => setFocusField('deliveryName')}
              onBlur={() => setFocusField('')}
              style={inputStyle('deliveryName')}
            >
              {DELIVERY_NAMES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        {/* 저장 버튼 오른쪽 하단 정렬 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
          <button
            onClick={handleSave}
            style={{
              padding: '7px 18px',
              borderRadius: 6,
              border: 'none',
              background: saveHover ? '#3a4a6a' : '#223A5E',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.97rem',
              boxShadow: '0 1px 4px #0001',
              transition: 'background 0.15s'
            }}
            onMouseEnter={() => setSaveHover(true)}
            onMouseLeave={() => setSaveHover(false)}
          >저장</button>
        </div>
      </div>
    </div>
  );
}

export default OrderPage;
