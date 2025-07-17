import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Header from '../Header.jsx';

const orderStatusList = [
    { key: 'ORDERED', label: '결제완료' },
    { key: 'SHIPPING', label: '배송중' },
    { key: 'DELIVERED', label: '배송완료' },
    { key: 'CONFIRMED', label: '구매확정' },
];

const MyOrders = ({ showHeader = true }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [memberMileage, setMemberMileage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // 관리자 여부 로컬스토리지에서 확인
    const isAdmin = localStorage.getItem('member_Role') === 'ADMIN';
    // 구매확정 툴팁용 state (fixed 위치)
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, idx: null });
    // 주문 취소 관련 state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [cancelOrderId, setCancelOrderId] = useState(null); //취소하려는 주문의 주문번호 저장
    const [cancelReason, setCancelReason] = useState(''); //사용자가 입력한 주문취소 사유 저장
    const [cancelLoading, setCancelLoading] = useState(false);
    const [toast, setToast] = useState('');

    const handleTooltipShow = (e, idx) => {
      const rect = e.target.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 10, // 버튼 위 10px
        idx
      });
    };
    const handleTooltipHide = () => {
      setTooltip({ visible: false, x: 0, y: 0, idx: null });
    };

    // 배송완료로 상태 변경 함수
    const handleSetDelivered = async (merchantUid) => {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`/orders/${merchantUid}/set-delivered`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        // 상태 변경 후 주문 목록 새로고침
        const response = await axios.get('/orders/my-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setOrders(response.data.orders || []);
        setToast('주문 상태가 배송완료로 변경되었습니다.');
        setTimeout(() => setToast(''), 1800);
      } catch (err) {
        alert('상태 변경에 실패했습니다.');
      }
    };
    // 구매확정 처리 함수
    const handleConfirmOrder = async (merchantUid) => {
      setTooltip({ visible: false, x: 0, y: 0, idx: null }); // 툴팁 강제 닫기
      try {
        const token = localStorage.getItem('token');
        await axios.post(`/orders/${merchantUid}/confirm`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        // 상태 변경 후 주문 목록 및 마일리지 새로고침
        const response = await axios.get('/orders/my-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setOrders(response.data.orders || []);
        setMemberMileage(response.data.memberMileage ?? 0);
        // 적립 마일리지 계산 (결제금액의 10%)
        const confirmedOrder = response.data.orders?.find(order => order.merchantUid === merchantUid);
        const totalPrice = confirmedOrder?.totalPrice || 0;
        const mileage = Math.floor(totalPrice * 0.1);
        setToast(`구매확정 및 마일리지 적립이 완료되었습니다.\n(적립된 마일리지: ${mileage.toLocaleString()}P)`);
        setTimeout(() => setToast(''), 1800);
      } catch (err) {
        alert('구매확정 처리에 실패했습니다.');
      }
    };

    // 주문 취소 처리 함수
    const handleCancelOrder = async () => {
      setCancelLoading(true); //1. 취소 처리 중임을 표시 (로딩상태 true)
      try {
        const token = localStorage.getItem('token'); //2. JWT 토큰 가져오기(로그인 인증)
        //3. 주문 취소 API 호출 (취소 사유와 함께)
        await axios.post(`/orders/${cancelOrderId}/cancel`, { reason: cancelReason }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        // 주문 목록 새로고침 (취소 후 최신 상태 반영)
        const response = await axios.get('/orders/my-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setOrders(response.data.orders || []); // 5. 주문 목록 state 갱신
        setShowReasonModal(false); // 6. 취소 사유 입력 모달 닫기
        setCancelOrderId(null); // 7. 취소할 주문 ID 초기화
        setCancelReason(''); // 8. 취소 사유 입력값 초기화
        alert('주문이 정상적으로 취소되었습니다.'); // 9. 성공 알림
      } catch (err) {
        alert('주문 취소에 실패했습니다.'); // 10. 실패시 알림
      } finally {
        setCancelLoading(false); // 11. 로딩 상태 해제
      }
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                const response = await axios.get('/orders/my-orders', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setOrders(response.data.orders || []);
                setMemberMileage(response.data.memberMileage ?? 0);
            } catch (err) {
                console.error('주문 내역 조회 실패:', err);
                if (err.response?.status === 401) {
                    setError('로그인이 필요합니다.');
                } else {
                    setError('주문 내역을 불러오는데 실패했습니다.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // 상태별 주문 건수 집계
    const statusCounts = orderStatusList.reduce((acc, status) => {
        acc[status.key] = orders.filter(order => order.orderStatus === status.key).length;
        return acc;
    }, {});

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}.${mm}.${dd}`;
    };

    const formatPrice = (price) => {
        return price?.toLocaleString('ko-KR') || '0';
    };

    const styles = {
        container: {
            maxWidth: '70rem',
            margin: '0 auto',
            padding: '1.25rem',
            fontFamily: 'Arial, sans-serif'
        },
        statusBarWrap: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center', // 중앙 정렬
            marginBottom: '2.5rem',
        },
        statusBar: {
            display: 'flex',
            alignItems: 'center',
            background: '#fff',
            borderRadius: '0.125rem',
            padding: '1.2rem 2rem',
            //boxShadow: '0 2px 8px #0001',
            gap: '1.5rem',
        },
        statusStep: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 80,
        },
        statusLabel: {
            fontSize: '1rem',
            color: '#223A5E',
            fontWeight: 600,
            marginBottom: 6,
        },
        statusCount: {
            fontSize: '1.25rem',
            color: '#FFB300',
            fontWeight: 700,
        },
        statusArrow: {
            fontSize: '1.5rem',
            color: '#bbb',
            margin: '0 0.5rem',
        },
        mileageBox: {
            background: '#FFB300',
            color: '#223A5E',
            borderRadius: '1.2rem',
            padding: '0.7rem 1.5rem',
            fontWeight: 700,
            fontSize: '1.1rem',
            marginLeft: '2rem',
            boxShadow: '0 2px 8px #0001',
            display: 'flex',
            alignItems: 'center',
            minWidth: 120,
            justifyContent: 'center',
        },
        floatingMileage: {
            position: 'fixed',
            right: '2rem',
            bottom: '2rem',
            background: '#FFB300', // 머스터드
            color: '#223A5E', // 네이비
            borderRadius: '1.2rem', // 기존 2rem에서 축소
            padding: '0.5rem 1rem', // 기존 0.8rem 1.5rem에서 축소
            boxShadow: '0 2px 12px #0002',
            zIndex: 1000,
            fontWeight: 700,
            fontSize: '0.98rem', // 기존 1.1rem에서 축소
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.88rem',
            paddingTop: '1.25rem'
        },
        title: {
            color: '#333',
            margin: 0,
            fontSize: '1.375rem'
        },
        loading: {
            textAlign: 'center',
            padding: '3.13rem',
            fontSize: '1.125rem',
            color: '#666'
        },
        errorMessage: {
            textAlign: 'center',
            padding: '3.13rem',
            color: '#dc3545',
            fontSize: '1rem'
        },
        orderItem: {
            border: '1px solid #e9ecef',
            borderRadius: '0.25rem',
            marginBottom: '1.25rem',
            backgroundColor: '#fff',
            overflow: 'hidden'
        },
        orderHeader: {
            padding: '1.25rem',
            borderBottom: '1px solid #e9ecef',
            backgroundColor: '#1a2d48',
            borderTopLeftRadius: '0.25rem',
            borderTopRightRadius: '0.25rem',
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        pawIcon: {
            position: 'absolute',
            top: '50%',
            left: '-2.2rem',
            transform: 'translateY(-50%)',
            width: '1.7rem',
            height: '1.7rem',
            zIndex: 2,
        },
        orderInfo: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.63rem'
        },
        orderDate: {
            color: '#666',
            fontSize: '0.94rem'
        },
        orderNumber: {
            color: '#333',
            fontWeight: 600,
            fontSize: '0.94rem'
        },
        orderStatus: {
            padding: '0.31rem 0.63rem',
            borderRadius: '0.25rem',
            fontSize: '0.88rem',
            fontWeight: 600
        },
        statusOrdered: {
            backgroundColor: '#d4edda',
            color: '#155724'
        },
        orderContent: {
            padding: '1.25rem'
        },
        productList: {
            marginBottom: '1.25rem'
        },
        productItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '0.94rem 0',
            borderBottom: '1px solid #f5f5f5'
        },
        productImage: {
            width: '4.75rem',
            height: '4.75rem',
            objectFit: 'cover',
            borderRadius: '0.25rem',
            marginRight: '0.94rem'
        },
        productInfo: {
            flex: 1
        },
        productName: {
            fontWeight: 600,
            color: '#333',
            marginBottom: '0.31rem'
        },
        productOption: {
            color: '#666',
            fontSize: '0.88rem',
            marginBottom: '0.31rem'
        },
        productPrice: {
            color: '#888',
            fontSize: '0.88rem'
        },
        orderSummary: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.94rem',
            borderTop: '1px solid #e9ecef'
        },
        totalPrice: {
            fontWeight: 600,
            color: '#333',
            fontSize: '1.06rem'
        },
        viewDetailButton: {
            backgroundColor: '#223A5E',
            color: '#fff',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 600,
            transition: 'background-color 0.3s'
        },
        emptyMessage: {
            textAlign: 'center',
            padding: '3.13rem',
            color: '#666',
            fontSize: '1rem'
        },
        // 모달 스타일
        modalOverlay: {
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.25)',
            zIndex: 20000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        modalContent: {
            background: '#fff',
            borderRadius: 12,
            padding: '2rem 2.5rem',
            minWidth: 320,
            boxShadow: '0 2px 16px #0002',
            textAlign: 'center'
        },
        modalButton: {
            background: '#223A5E',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '0.5rem 1.3rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            margin: '0 0.5rem'
        },
        modalButtonSecondary: {
            background: '#eee',
            color: '#333',
            border: 'none',
            borderRadius: 6,
            padding: '0.5rem 1.3rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            margin: '0 0.5rem'
        },
        textarea: {
            width: '100%',
            marginBottom: '1rem',
            borderRadius: 6,
            border: '1px solid #ccc',
            padding: 8,
            fontSize: '0.9rem',
            resize: 'vertical',
            minHeight: 80
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div style={styles.container}>
                    <div style={styles.loading}>주문 내역을 불러오는 중...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div style={styles.container}>
                    <div style={styles.errorMessage}>{error}</div>
                </div>
            </>
        );
    }

    return (
        <>
            {showHeader && <Header />}
            {toast && (
              <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: '#223A5E', color: '#fff', padding: '1rem 2.2rem', borderRadius: 16,
                fontSize: '1rem', zIndex: 9999, boxShadow: '0 2px 12px #0003', opacity: 0.97,
                textAlign: 'center', fontWeight: 700,
                whiteSpace: 'pre-line'
              }}>{toast}</div>
            )}
            <div style={styles.container}>
                {/* 상태바만 */}
                <div style={{maxWidth: '70rem', margin: '0 auto',...styles.statusBarWrap}}>
                    <div style={styles.statusBar}>
                        {orderStatusList.map((status, idx) => (
                            <React.Fragment key={status.key}>
                                <div style={styles.statusStep}>
                                    <div style={styles.statusLabel}>{status.label}</div>
                                    <div style={styles.statusCount}>{statusCounts[status.key] || 0}</div>
                                </div>
                                {idx < orderStatusList.length - 1 && (
                                    <div style={styles.statusArrow}>→</div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div style={styles.header}>
                    <h1 style={styles.title}>주문조회</h1>
                </div>

                {orders.length === 0 ? (
                    <div style={styles.emptyMessage}>
                        주문 내역이 없습니다.
                    </div>
                ) : (
                    [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).map((order, index) => (
                        <div key={index} style={{ marginBottom: '2.5rem' }}>
                            {/* 주문 카드 */}
                            <div style={styles.orderItem}>
                                <div style={styles.orderHeader}>
                                    <div style={styles.orderInfo}>
                                        <div>
                                            {/* 주문일자 + 주문 n건 (카드 내부, 주문번호 위) */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1.2rem',
                                                marginBottom: '0.2rem',
                                            }}>
                                                <span style={{
                                                    fontSize: '1.05rem',
                                                    fontWeight: 600,
                                                    color: '#fff' // 흰색
                                                }}>
                                                    {formatDate(order.orderDate)}
                                                </span>
                                                <span style={{
                                                    color: '#d3d7de', // 연한 회색
                                                    fontWeight: 400,
                                                    fontSize: '0.95rem'
                                                }}>
                                                    | 주문 {order.orderItems.length}건
                                                </span>
                                            </div>
                                            <div style={{ ...styles.orderNumber, color: '#fff' }}>
                                                <span style={{ color: '#d3d7de' }}>주문번호: {order.merchantUid}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 결제완료 상태일 때만 발바닥+뱃지 flex row로 */}
                                    {order.orderStatus === 'ORDERED' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{
                                                background: '#FFF3CD',
                                                color: '#FFB300',
                                                fontWeight: 700,
                                                fontSize: '0.93rem',
                                                borderRadius: '0.5rem',
                                                padding: '0.3rem 1.1rem',
                                                display: 'inline-block',
                                                letterSpacing: '0.02em',
                                            }}>
                                                결제완료
                                            </div>
                                        </div>
                                    ) : (
                                        order.orderStatus === 'DELIVERED' ? (
                                            <span style={{
                                                background: '#e9f7ef', // 연초록
                                                color: '#1a936f', // 카키
                                                fontWeight: 700,
                                                fontSize: '0.93rem',
                                                borderRadius: '0.5rem',
                                                padding: '0.3rem 1.1rem',
                                                display: 'inline-block',
                                                letterSpacing: '0.02em',
                                            }}>
                                                배송완료
                                            </span>
                                        ) : order.orderStatus === 'CONFIRMED' ? (
                                            <span style={{
                                                background: '#e3eaf6', // 연한 네이비
                                                color: '#223A5E', // 네이비
                                                fontWeight: 700,
                                                fontSize: '0.93rem',
                                                borderRadius: '0.5rem',
                                                padding: '0.3rem 1.1rem',
                                                display: 'inline-block',
                                                letterSpacing: '0.02em',
                                            }}>
                                                구매확정
                                            </span>
                                        ) : order.orderStatus === 'CANCEL' ? (
                                            <span style={{
                                                background: '#f8d7da', // 연한 빨강
                                                color: '#dc3545', // 진한 빨강
                                                fontWeight: 700,
                                                fontSize: '0.93rem',
                                                borderRadius: '0.5rem',
                                                padding: '0.3rem 1.1rem',
                                                display: 'inline-block',
                                                letterSpacing: '0.02em',
                                            }}>
                                                취소완료
                                            </span>
                                        ) : (
                                            order.orderStatus
                                        )
                                    )}
                                </div>

                                <div style={styles.orderContent}>
                                    <div style={styles.productList}>
                                        {order.orderItems.map((item, itemIndex) => (
                                            <div key={itemIndex} style={styles.productItem}>
                                                <img
                                                    src={item.thumbnailUrl}
                                                    alt={item.itemName}
                                                    style={styles.productImage}
                                                    onClick={() => navigate(`/shop/item/${item.itemId}`)}
                                                />
                                                <div style={styles.productInfo}>
                                                    <div style={styles.productName}>
                                                        {item.itemName}
                                                    </div>
                                                    {item.optionName && (
                                                        <div style={styles.productOption}>
                                                            옵션: {item.optionName}
                                                        </div>
                                                    )}
                                                    <div style={styles.productPrice}>
                                                        {formatPrice(item.orderPrice)}원 | {item.quantity}개
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={styles.orderSummary}>
                                        <div style={styles.totalPrice}>
                                            총 결제금액: {formatPrice(order.totalPrice)}원
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                style={styles.viewDetailButton}
                                                onClick={() => navigate(`/orders/${order.merchantUid}`)}
                                                onMouseOver={e => e.target.style.backgroundColor = '#1a2d48'}
                                                onMouseOut={e => e.target.style.backgroundColor = '#223A5E'}
                                            >
                                                상세보기
                                            </button>
                                            {order.orderStatus === 'ORDERED' && (
                                                <button
                                                    style={{
                                                        ...styles.viewDetailButton,
                                                        backgroundColor: '#fff',
                                                        color: '#dc3545',
                                                        border: '1.5px solid #dc3545',
                                                        marginLeft: 0,
                                                        transition: 'background 0.3s, color 0.3s',
                                                    }}
                                                    onClick={() => {
                                                        setCancelOrderId(order.merchantUid);
                                                        setShowCancelModal(true);
                                                    }}
                                                    onMouseOver={e => {
                                                        e.target.style.backgroundColor = '#dc3545';
                                                        e.target.style.color = '#fff';
                                                    }}
                                                    onMouseOut={e => {
                                                        e.target.style.backgroundColor = '#fff';
                                                        e.target.style.color = '#dc3545';
                                                    }}
                                                >
                                                    주문 취소하기
                                                </button>
                                            )}
                                           {/* 관리자만: 결제완료 상태에서 배송완료로 변경 버튼 */}
                                           {isAdmin && order.orderStatus === 'ORDERED' && (
                                               <button
                                                 style={{
                                                   ...styles.viewDetailButton,
                                                   backgroundColor: '#e9f7ef',
                                                   color: '#1a936f',
                                                   border: '1.5px solid #1a936f'
                                                 }}
                                                 onClick={() => handleSetDelivered(order.merchantUid)}
                                               >
                                                 배송완료로 상태 변경하기
                                               </button>
                                           )}
                                            {order.orderStatus === 'DELIVERED' && (
                                                <div style={{ display: 'inline-block' }}>
                                                    <button
                                                        style={{
                                                            ...styles.viewDetailButton,
                                                            backgroundColor: '#fff',
                                                            color: '#223A5E',
                                                            border: '1.5px solid #223A5E',
                                                            marginLeft: 0,
                                                            transition: 'background 0.3s, color 0.3s',
                                                        }}
                                                        onClick={() => handleConfirmOrder(order.merchantUid)}
                                                        onMouseEnter={e => handleTooltipShow(e, index)}
                                                        onMouseLeave={handleTooltipHide}
                                                    >
                                                        구매확정
                                                    </button>
                                                </div>
                                            )}
                    {/* position: fixed 툴팁 */}
                    {tooltip.visible && tooltip.idx === index && (
                        <div style={{
                            position: 'fixed',
                            left: tooltip.x,
                            top: tooltip.y,
                            transform: 'translate(-50%, -100%)',
                            background: '#FFB300',
                            color: '#223A5E',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.92rem',
                            whiteSpace: 'nowrap',
                            zIndex: 9999,
                            boxShadow: '0 2px 8px #0002',
                            pointerEvents: 'none'
                        }}>
                            구매확정 시 결제 금액의 10%가 마일리지로 적립됩니다!
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 0,
                                height: 0,
                                borderLeft: '8px solid transparent',
                                borderRight: '8px solid transparent',
                                borderTop: '8px solid #FFB300',
                                zIndex: 10000,
                            }} />
                        </div>
                    )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* 오른쪽 하단 플로팅 마일리지 위젯 */}
            <div style={styles.floatingMileage}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="#223A5E" style={{marginRight: '0.7rem', verticalAlign: 'middle'}}>
                <circle cx="8" cy="12" r="3.2" />
                <circle cx="24" cy="12" r="3.2" />
                <circle cx="16" cy="8.5" r="3.5" />
                <ellipse cx="12.5" cy="21" rx="4.2" ry="5.2" />
                <ellipse cx="19.5" cy="21" rx="4.2" ry="5.2" />
              </svg>
              내 마일리지: {formatPrice(memberMileage)}P
            </div>

            {/* 주문 취소 안내 모달 */}
            {showCancelModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={{marginBottom: '1.2rem', fontWeight: 600, fontSize: '1.05rem'}}>
                            주문 취소 시 환불 처리는 3일에서 최대 5일이 소요될 수 있습니다.
                        </div>
                        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                            <button
                                style={styles.modalButton}
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setShowReasonModal(true);
                                }}
                            >
                                계속하기
                            </button>
                            <button
                                style={styles.modalButtonSecondary}
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelOrderId(null);
                                }}
                            >
                                나가기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 취소 사유 입력 모달 */}
            {showReasonModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={{marginBottom: '0.7rem', fontWeight: 600}}>취소 사유를 입력해주세요</div>
                        <textarea
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            style={styles.textarea}
                            placeholder="예: 단순 변심, 배송 지연 등"
                        />
                        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                            <button
                                style={{
                                    ...styles.modalButton,
                                    opacity: cancelLoading || !cancelReason.trim() ? 0.6 : 1,
                                    cursor: cancelLoading || !cancelReason.trim() ? 'not-allowed' : 'pointer'
                                }}
                                disabled={cancelLoading || !cancelReason.trim()}
                                onClick={handleCancelOrder}
                            >
                                {cancelLoading ? '처리중...' : '확인'}
                            </button>
                            <button
                                style={styles.modalButtonSecondary}
                                onClick={() => {
                                    setShowReasonModal(false);
                                    setCancelOrderId(null);
                                    setCancelReason('');
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MyOrders;
