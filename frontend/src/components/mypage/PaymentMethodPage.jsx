import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header';
import './PaymentMethodPage.css';

const PaymentMethodPage = () => {
  const { email, nickname } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // 로그인 체크
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: '로그인이 필요합니다',
        text: '결제 수단 관리 페이지는 로그인 후 이용 가능합니다.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: '로그인 페이지로 이동',
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/members/login', { replace: true });
        }
      });
    }
  }, [navigate]);

  // 등록된 결제 수단 조회
  useEffect(() => {
    fetchPaymentMethod();
  }, []);

  const fetchPaymentMethod = async () => {
    try {
      const response = await axios.get('/payments/mock/my-method');
      if (response.data && response.data.cardName) {
        setPaymentMethod(response.data);
      } else {
        setPaymentMethod(null);
      }
    } catch (error) {
      console.error('결제 수단 조회 실패:', error);
      setPaymentMethod(null);
    }
  };

  // 새로운 결제 수단 등록
  const handleRegisterNewCard = async () => {
    setIsRegistering(true);
    try {
      // 백엔드에 저장 요청 (백엔드에서 랜덤 카드 정보 생성)
      await axios.post('/payments/mock/register');

      // 저장 후 다시 조회
      await fetchPaymentMethod();

      await Swal.fire({
        title: '등록 완료!',
        text: '새로운 결제 수단이 성공적으로 등록되었습니다.',
        icon: 'success',
        timer: 3000,
      });
    } catch (error) {
      console.error('결제 수단 등록 실패:', error);
      Swal.fire({
        title: '등록 실패',
        text: '결제 수단 등록 중 오류가 발생했습니다.',
        icon: 'error',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // 결제 수단 삭제
  const handleDeleteCard = async () => {
    const result = await Swal.fire({
      title: '결제 수단 삭제',
      text: '등록된 결제 수단을 삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      try {
        // 백엔드에서 삭제
        await axios.delete('/payments/mock/my-method');

        // 삭제 후 상태 초기화
        setPaymentMethod(null);

        Swal.fire({
          title: '삭제 완료',
          text: '결제 수단이 삭제되었습니다.',
          icon: 'success',
          timer: 2000,
        });
      } catch (error) {
        console.error('결제 수단 삭제 실패:', error);
        Swal.fire({
          title: '삭제 실패',
          text: '결제 수단 삭제 중 오류가 발생했습니다.',
          icon: 'error',
        });
      }
    }
  };

  return (
    <>
      <Header />
      <div className="payment-method-page">
        <div className="payment-method-container">
          <h1 className="page-title">{nickname}님의 결제 수단 관리</h1>

          <div className="info-section">
            <div className="info-card">
              <h3>💳 결제 수단 관리</h3>
              <p>
                자동 예방접종 예약을 위한 결제 수단을 등록하고 관리할 수
                있습니다.
                <br />
                <small className="mock-notice">
                  ※ 현재는 모의 결제 시스템을 사용하고 있습니다.
                </small>
              </p>
            </div>
          </div>

          <div className="payment-method-content">
            {paymentMethod ? (
              // 등록된 결제 수단이 있는 경우
              <div className="registered-card">
                <div className="card-info">
                  <div className="card-icon">💳</div>
                  <div className="card-details">
                    <h3>{paymentMethod.cardName}</h3>
                    <p className="card-number">{paymentMethod.cardNumber}</p>
                    <p className="registration-date">
                      등록일: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={handleDeleteCard}
                    disabled={isLoading}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              // 등록된 결제 수단이 없는 경우
              <div className="no-card">
                <div className="no-card-icon">💳</div>
                <h3>등록된 결제 수단이 없습니다</h3>
                <p>자동 예방접종 예약을 위해 결제 수단을 등록해주세요.</p>
                <button
                  className="btn btn-primary"
                  onClick={handleRegisterNewCard}
                  disabled={isRegistering}
                >
                  {isRegistering ? '등록 중...' : '결제 수단 등록하기'}
                </button>
              </div>
            )}
          </div>

          <div className="usage-info">
            <h3>📋 사용 안내</h3>
            <ul>
              <li>등록된 결제 수단은 자동 예방접종 예약 시 사용됩니다.</li>
              <li>예약금과 접종 후 잔액이 자동으로 결제됩니다.</li>
              <li>결제 수단은 언제든지 변경하거나 삭제할 수 있습니다.</li>
              <li>
                현재는 모의 결제 시스템으로 실제 결제가 이루어지지 않습니다.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentMethodPage;
