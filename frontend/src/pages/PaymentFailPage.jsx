import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PaymentFailPage() {
  const navigate = useNavigate();
  useEffect(() => {
    alert('결제에 실패했습니다. 다시 시도해주세요.');
    navigate(-1); // 이전 페이지(주문페이지)로 이동
  }, [navigate]);
  return null;
}

export default PaymentFailPage; 