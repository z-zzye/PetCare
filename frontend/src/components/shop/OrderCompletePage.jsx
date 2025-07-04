import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function OrderCompletePage() {
  const location = useLocation();
  const navigate = useNavigate();
  // 주문번호 쿼리스트링에서 추출
  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId');

  return (
    <div style={{ maxWidth: 480, margin: '5rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: '2.5rem 2rem', textAlign: 'center' }}>
      <h1 style={{ color: '#223A5E', fontWeight: 700, fontSize: '1.7rem', marginBottom: 24 }}>주문이 완료되었습니다!</h1>
      <div style={{ fontSize: '1.1rem', marginBottom: 18 }}>
        주문번호: <span style={{ fontWeight: 600 }}>{orderId || '-'}</span>
      </div>
      <div style={{ color: '#888', marginBottom: 32 }}>
        결제가 정상적으로 처리되었습니다.<br />
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          style={{ padding: '10px 22px', borderRadius: 6, border: 'none', background: '#223A5E', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          onClick={() => navigate('/members/mypage')}
        >주문내역 보기</button>
        <button
          style={{ padding: '10px 22px', borderRadius: 6, border: 'none', background: '#FFB300', color: '#223A5E', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >메인으로</button>
      </div>
    </div>
  );
}

export default OrderCompletePage; 