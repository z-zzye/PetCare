import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const PaymentMethodPage = () => {
    const { email, nickname } = useAuth();

    // ✅ [Debug 1] 컴포넌트가 렌더링될 때 AuthContext의 상태를 확인합니다.
    console.log('[Debug 1] AuthContext 값:', { email, nickname });

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://js.tosspayments.com/v1/payment';
        document.head.appendChild(script);
        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const handleRegisterCard = () => {
        // ✅ [Debug 2] 버튼 클릭 시점의 email 상태를 확인합니다.
        console.log('[Debug 2] 카드 등록 버튼 클릭 시 email 값:', email);

        if (!email) {
            alert("로그인 정보가 없습니다.");
            return;
        }

        const tossPayments = window.TossPayments(process.env.REACT_APP_TOSS_CLIENT_KEY);
        const customerKey = `petory_customer_${email}`;

        tossPayments.requestBillingAuth('카드', {
            customerKey: customerKey,
            successUrl: 'http://localhost:3000/toss-auth-success',
            failUrl: 'http://localhost:3000/mypage',
        }).catch(error => {
            console.error("토스페이먼츠 연동 에러:", error);
        });
    };

    return (
        <div>
            <Header />
            <div style={{ padding: '20px' }}>
                <h2>결제수단 관리</h2>
                <p>자동 예방접종 결제를 위해 카드를 등록해주세요.</p>
                <button onClick={handleRegisterCard} style={{ padding: '10px 20px', fontSize: '16px' }}>
                    새 카드 등록하기
                </button>
            </div>
        </div>
    );
};

export default PaymentMethodPage;
