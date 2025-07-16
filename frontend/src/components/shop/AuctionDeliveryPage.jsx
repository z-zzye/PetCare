import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../Header.jsx';
import axios from '../../api/axios';

// 배송지명 Enum 예시
const DELIVERY_NAMES = [
  { value: 'HOME', label: '집' },
  { value: 'COMPANY', label: '회사' },
  { value: 'SCHOOL', label: '학교' },
  { value: 'ETC', label: '기타' },
];

function AuctionDeliveryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // 낙찰 상품 정보는 location.state로 전달받는다고 가정
  const item = location.state?.item || {};
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressInfo, setAddressInfo] = useState(null);
  const [orderMemo, setOrderMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 토스트 메시지 표시 함수 (AuctionRoom.jsx에서 복사)
  const showToast = (message, type = 'info', duration = 4000) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      padding: 16px 32px;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
      max-width: 420px;
      min-width: 320px;
      width: auto;
      word-wrap: break-word;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
      transition: transform 0.2s ease;
      text-align: center;
      font-size: 1rem;
    `;
    const colors = {
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    };
    toast.style.background = '#223A5E';
    toast.innerHTML = message.replace(/\n/g, '<br/>');
    document.body.appendChild(toast);
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, duration);
  };

  useEffect(() => {
    showToast(
      '🎉 축하드립니다! 낙찰되었습니다.\n※ 5일 이내에 배송지를 입력하지 않으실 경우, 낙찰은 자동 취소되며 마일리지는 환불되지 않습니다.\n지금 바로 배송 정보를 등록해 주세요!',
      'success',
      6000
    );
  }, []);

  // 배송 요청 처리 함수
  const handleDeliveryRequest = async () => {
    if (!addressInfo) {
      showToast('배송지 정보를 입력해 주세요.', 'warning');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('로그인이 필요합니다.', 'error');
        return;
      }

      // historyId는 item에서 추출하거나 별도로 전달받아야 함
      // 현재는 임시로 1을 사용 (실제로는 location.state에서 전달받아야 함)
      const historyId = location.state?.historyId;
      
      if (!historyId) {
        showToast('경매 정보를 찾을 수 없습니다.', 'error');
        return;
      }

      const requestData = {
        receiverName: addressInfo.receiverName,
        receiverPhone: addressInfo.receiverPhone,
        deliveryAddress: addressInfo.address,
        deliveryAddressDetail: addressInfo.addressDetail,
        deliveryMemo: orderMemo,
        deliveryName: addressInfo.deliveryName
      };

      console.log('배송 요청 데이터:', requestData);

      const response = await axios.post(`/auction/delivery/${historyId}`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        showToast('배송 요청이 완료되었습니다!', 'success');
        // 성공 시 마이페이지로 이동
        setTimeout(() => {
          navigate('/mypage');
        }, 2000);
      }
    } catch (error) {
      console.error('배송 요청 실패:', error);
      let errorMessage = '배송 요청에 실패했습니다.';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = error.response.data || '잘못된 요청입니다.';
            break;
          case 403:
            errorMessage = '권한이 없습니다.';
            break;
          case 404:
            errorMessage = '경매 정보를 찾을 수 없습니다.';
            break;
          default:
            errorMessage = error.response.data || '서버 오류가 발생했습니다.';
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 0', display: 'flex', gap: 32 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 16 }}>경매/배송</h1>
          <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0', marginBottom: '20px', fontWeight: 400 }}>
            ※ 5일 이내에 배송지를 입력하지 않으실 경우, 낙찰은 자동 취소되며 마일리지는 환불되지 않습니다.
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #bbb', margin: '8px 0 32px 0' }} />

          {/* 배송지 요약 + 변경 버튼 */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>배송지</h2>
              <button
                onClick={() => setShowAddressModal(true)}
                style={{
                  color: '#FFB300',
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

          {/* 낙찰 상품 정보 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>낙찰 상품</h2>
            <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'flex-start', gap: '1.125rem' }}>
              <img src={item.thumbnailUrl} alt="썸네일" style={{ width: '5rem', height: '5rem', objectFit: 'cover', borderRadius: '0.125rem', marginRight: '1.25rem' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '1.05rem', marginBottom: '0.375rem', color: '#222', wordBreak: 'break-all' }}>{item.itemName}</div>
                <div style={{ color: '#888', fontSize: '0.97rem', marginBottom: '0.625rem' }}>낙찰가: <b>{item.finalPrice?.toLocaleString()}P</b></div>
                <div style={{ color: '#888', fontSize: '0.97rem' }}>경매 종료일: {item.auctionEndTime ? new Date(item.auctionEndTime).toLocaleString() : '-'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
              <button
                onClick={handleDeliveryRequest}
                disabled={!addressInfo || isSubmitting}
                style={{
                  padding: '12px 32px',
                  borderRadius: 8,
                  border: 'none',
                  background: (!addressInfo || isSubmitting) ? '#ccc' : '#223A5E',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  boxShadow: '0 1px 4px #0001',
                  transition: 'background 0.15s',
                  cursor: (!addressInfo || isSubmitting) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? '처리 중...' : '배송 요청'}
              </button>
            </div>
          </section>
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

// 내부 함수형 컴포넌트: 배송지 입력 모달 (OrderPage에서 복사)
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
    const emptyFields = [];
    if (!receiverName) emptyFields.push('receiverName');
    if (!receiverPhone) emptyFields.push('receiverPhone');
    if (!address) emptyFields.push('address');
    if (!addressDetail) emptyFields.push('addressDetail');
    if (!deliveryName) emptyFields.push('deliveryName');
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

export default AuctionDeliveryPage;
