import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TossAuthSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const effectRan = useRef(false);

    useEffect(() => {
        // ✅ 3. ref의 값이 false일 때만 아래 로직을 실행하도록 조건문을 추가합니다.
        if (effectRan.current === false) {
            const queryParams = new URLSearchParams(location.search);
            const authKey = queryParams.get('authKey');
            const customerKey = queryParams.get('customerKey');

            if (!authKey || !customerKey) {
                alert("인증 정보가 올바르지 않습니다.");
                navigate('/payment-management');
                return;
            }

            const sendAuthDataToServer = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('/api/payments/toss/confirm-billing', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ authKey, customerKey })
                    });

                    if (response.ok) {
                        alert('결제 수단이 성공적으로 등록되었습니다.');
                        navigate('/members/mypage');
                    } else {
                        const errorText = await response.text();
                        throw new Error(errorText || '최종 승인에 실패했습니다.');
                    }
                } catch (error) {
                    alert(error.message);
                    navigate('/payment-management');
                }
            };

            sendAuthDataToServer();

            // ✅ 4. 로직이 실행된 후에는 ref의 값을 true로 변경하여, 다음에 또 실행되지 않도록 합니다.
            return () => {
                effectRan.current = true;
            }
        }
    }, [location, navigate]);

    return (
        <div>
            <h2>결제 정보 인증 중입니다...</h2>
            <p>잠시만 기다려주세요.</p>
        </div>
    );
};

export default TossAuthSuccessPage;
