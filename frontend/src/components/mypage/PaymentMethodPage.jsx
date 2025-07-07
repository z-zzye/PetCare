import React from 'react';
import { useAuth } from '../../contexts/AuthContext'; // 사용자 정보 가져오기
import Header from '../Header'; // 헤더 컴포넌트
import Swal from 'sweetalert2';
import axios from '../../api/axios';

const PaymentMethodPage = () => {
    const { email, nickname } = useAuth();

    const handleRegisterCard = () => {
        // 1. 함수가 시작되자마자 환경 변수 값을 별도의 변수에 저장합니다.
        const storeId = process.env.REACT_APP_PORTONE_STORE_ID;

        // 2. 이 시점의 값을 콘솔에 출력합니다.
        console.log('[handleRegisterCard] 함수 내부 storeId 값:', storeId);

        // 3. 코드 실행을 여기서 잠시 멈춥니다. (개발자 도구가 열려 있어야 함)
        debugger;

        // 4. storeId가 문자열이 아니거나 없는 경우, 명확한 오류를 표시하고 중단합니다.
        if (!storeId || typeof storeId !== 'string') {
            Swal.fire(
                '설정 오류!',
                `가맹점 식별코드가 올바르지 않습니다. 현재 값: ${storeId}`,
                'error'
            );
            return;
        }

        // --- 이하 로직은 이전과 동일 ---
        if (!window.IMP) {
            alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        if (!email) {
            Swal.fire('오류', '로그인 정보가 없습니다. 다시 로그인해주세요.', 'error');
            return;
        }

        const { IMP } = window;
        IMP.init(storeId); // 변수에 저장된 값을 사용

        const customer_uid = `petory_customer_${email}`;

        IMP.request_pay({
            pg: "html5_inicis",
            pay_method: 'card',
            merchant_uid: `mid_${new Date().getTime()}`,
            name: '최초 인증결제',
            amount: 0,
            customer_uid: customer_uid,
            buyer_email: email,
            buyer_name: nickname,
        }, async (rsp) => { // 콜백 함수
            if (rsp.success) {
                // 빌링키 발급 성공
                try {
                    // 백엔드에 `imp_uid`를 보내 최종 처리 요청
                    await axios.post('/api/payments/portone/issue-billing-key', {
                        imp_uid: rsp.imp_uid
                    }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });

                    Swal.fire('성공!', '결제 수단이 성공적으로 등록되었습니다.', 'success');
                } catch (error) {
                    console.error("서버에 빌링키 발급 요청 실패", error);
                    Swal.fire('오류', '결제 수단 등록에 실패했습니다.', 'error');
                }
            } else {
                // 빌링키 발급 실패
                Swal.fire('실패', `카드 정보 인증에 실패했습니다. [${rsp.error_msg}]`, 'error');
            }
        });
    };

    return (
        <div>
            <Header />
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>결제수단 등록 테스트</h2>
                <p>자동 결제를 위한 카드 정보를 등록합니다.</p>
                <div style={{ marginTop: '30px', border: '1px solid #eee', padding: '20px' }}>
                    <p><strong>사용자:</strong> {nickname} ({email})</p>
                    <button
                        onClick={handleRegisterCard}
                        style={{
                            padding: '12px 25px',
                            fontSize: '18px',
                            cursor: 'pointer',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px'
                        }}
                    >
                        테스트용 카드 등록하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodPage;
