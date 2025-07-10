import React, { useState } from 'react';
import axios from '../../api/axios';
import Swal from 'sweetalert2';
import Header from '../Header';

// 부모 컴포넌트로부터 등록 완료 후 실행할 함수(onComplete)를 받습니다.
const PaymentRegistration = ({ onComplete }) => {
    const [isLoading, setIsLoading] = useState(false);

    // '등록하기' 버튼 클릭 시 실행될 함수
    const handleRegisterClick = async () => {
        setIsLoading(true);
        try {
            // 이전에 만든 모의 빌링키 발급 API를 호출합니다.
            await axios.post('/payments/mock/register');

            await Swal.fire({
                title: '등록 완료!',
                text: '결제 수단이 성공적으로 등록되었습니다. (모의)',
                icon: 'success',
            });

            // 등록이 끝났으므로, 부모에게 받은 onComplete 함수를 실행합니다.
            if (onComplete) {
                onComplete();
            }

        } catch (error) {
            console.error("모의 결제 수단 등록 중 오류 발생", error);
            Swal.fire({
                title: '등록 실패',
                text: '결제 수단 등록 중 오류가 발생했습니다.',
                icon: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <>
        <Header />
        <div className="payment-registration-container">
            <h2>자동 결제 수단 등록</h2>
            <p className="description">
                자동 예방접종 예약을 위해 결제 수단을 등록합니다.<br />
                이 과정은 실제 결제가 이루어지지 않는 모의 등록입니다.
            </p>
            <button
                onClick={handleRegisterClick}
                disabled={isLoading}
                className="button-primary" // 기존 버튼 스타일 재사용
            >
                {isLoading ? '등록 중...' : '결제 수단 등록하기 (모의)'}
            </button>
        </div>
      </>
    );
};

export default PaymentRegistration;
