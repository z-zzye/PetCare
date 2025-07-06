import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Header from '../Header.jsx';

const OrderDetail = () => {
    const { orderId } = useParams(); // URL 파라미터에서 주문번호(merchantUid) 추출
    const navigate = useNavigate();
    const [orderDetail, setOrderDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const isAdmin = localStorage.getItem('member_Role') === 'ADMIN';
                const url = isAdmin
                    ? `/orders/admin/order-detail/${orderId}`
                    : `/orders/${orderId}`;
                const response = await axios.get(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setOrderDetail(response.data);
            } catch (err) {
                console.error('주문 상세 조회 실패:', err);
                if (err.response?.status === 404) {
                    setError('주문 정보를 찾을 수 없습니다.');
                } else if (err.response?.status === 401) {
                    setError('로그인이 필요합니다.');
                } else {
                    setError('주문 상세 정보를 불러오는데 실패했습니다.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetail();
        }
    }, [orderId]);

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
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.94rem',
            paddingTop: '1.25rem'
        },
        title: {
            color: '#333',
            margin: 0,
            fontSize: '1.375rem'
        },
        backButton: {
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.63rem 1.25rem',
            borderRadius: '0.31rem',
            cursor: 'pointer',
            fontSize: '0.88rem',
            transition: 'background-color 0.3s'
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
        section: {
            marginBottom: '1.88rem',
            padding: '1.56rem',
            backgroundColor: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: '0.125rem',
        },
        sectionTitle: {
            color: '#333',
            marginBottom: '1.25rem',
            fontSize: '1.19rem',
            borderBottom: '1px solid #eee',
            paddingBottom: '0.63rem'
        },
        infoGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(15.6rem, 1fr))',
            gap: '0.94rem'
        },
        infoItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.63rem 0',
            borderBottom: '1px solid #f5f5f5'
        },
        label: {
            fontWeight: 500,
            color: '#888',
            fontSize: '0.94rem',
            minWidth: '6.25rem'
        },
        value: {
            color: '#333',
            textAlign: 'right',
            fontSize: '0.94rem',
            padding: '0.63rem'
        },
        statusOrdered: {
            color: '#28a745',
            fontWeight: 600
        },
        itemsList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
        },
        orderItem: {
            display: 'flex',
            gap: '1.25rem',
            padding: '1.25rem',
            borderBottom: '1px solid #e9ecef',
            borderRadius: '0.125rem',
            backgroundColor: '#fff'
        },
        itemImage: {
            flexShrink: 0,
            width: '6.25rem',
            height: '6.25rem'
        },
        itemImageImg: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '0.125rem'
        },
        itemInfo: {
            flex: 1
        },
        itemName: {
            margin: '0.31rem 0 0.63rem 0',
            fontSize: '1.06rem',
            color: '#333'
        },
        itemOption: {
            margin: '0.31rem 0',
            color: '#666',
            fontSize: '0.88rem'
        },
        itemQuantity: {
            margin: '0.31rem 0',
            color: '#666',
            fontSize: '0.88rem'
        },
        itemPrice: {
            margin: '0.31rem 0',
            color: '#888',
            fontWeight: 400,
            fontSize: '0.94rem'
        },
        summaryGrid: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.63rem'
        },
        summaryItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.63rem 0',
            borderBottom: '1px solid #f5f5f5'
        },
        summaryItemTotal: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.63rem 0',
            borderTop: '0.13rem solid #333',
            paddingTop: '0.94rem',
            marginTop: '0.63rem',
            fontWeight: 600,
            fontSize: '1.125rem'
        },
        usedMileage: {
            color: '#dc3545'
        },
        memoText: {
            backgroundColor: '#f8f9fa',
            padding: '0.94rem',
            borderRadius: '0.31rem',
            color: '#666',
            lineHeight: 1.6
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div style={styles.container}>
                    <div style={styles.loading}>주문 정보를 불러오는 중...</div>
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
                    <button 
                        onClick={() => navigate('/shop/my-orders')} 
                        style={{
                            ...styles.backButton,
                            backgroundColor: '#223A5E',
                            color: '#fff'
                        }}
                        onMouseOver={e => e.target.style.backgroundColor = '#1a2d48'}
                        onMouseOut={e => e.target.style.backgroundColor = '#223A5E'}
                    >
                        <i className="fas fa-paw" style={{ marginRight: 8, color: '#FFB300', fontSize: 18, verticalAlign: 'middle' }}></i>
                        주문 내역으로 돌아가기
                    </button>
                </div>
            </>
        );
    }

    if (!orderDetail) {
        return (
            <>
                <Header />
                <div style={styles.container}>
                    <div style={styles.errorMessage}>주문 정보가 없습니다.</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div style={styles.container}>
                <div style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h1 style={styles.title}>주문 상세</h1>
                        {localStorage.getItem('member_Role') === 'ADMIN' && orderDetail.memberEmail && (
                            <span style={{ fontSize: '0.95em', color: '#888' }}>({orderDetail.memberEmail})</span>
                        )}
                    </div>
                    <button 
                        onClick={() => navigate('/shop/my-orders')} 
                        style={{
                            ...styles.backButton,
                            backgroundColor: '#223A5E',
                            color: '#fff'
                        }}
                        onMouseOver={e => e.target.style.backgroundColor = '#1a2d48'}
                        onMouseOut={e => e.target.style.backgroundColor = '#223A5E'}
                    >
                        <i className="fas fa-paw" style={{ marginRight: 8, color: '#FFB300', fontSize: 18, verticalAlign: 'middle' }}></i>
                        주문 내역으로 돌아가기
                    </button>
                </div>
                {/* 주문일자/주문번호 */}
                <div style={{marginBottom: 32, color: '#888', fontSize: 15, fontWeight: 400, borderBottom: '2px solid #f0f0f0'}}>
                    {orderDetail.orderDate && (
                        <span>
                            {formatDate(orderDetail.orderDate)}{orderDetail.merchantUid && (<span> (주문번호 {orderDetail.merchantUid})</span>)}
                        </span>
                    )}
                </div>

                {/* 배송지 정보 */}
                <div style={{...styles.section, marginBottom: 32}}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-home" style={{marginRight: 8, color: '#223A5E'}}></i>
                        배송지정보
                    </h2>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ minWidth: 80, color: '#888', fontWeight: 500 }}>받는사람</span>
                            <span style={{ marginLeft: 12 }}>{orderDetail.receiverName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ minWidth: 80, color: '#888', fontWeight: 500 }}>연락처</span>
                            <span style={{ marginLeft: 12 }}>{orderDetail.receiverPhone}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ minWidth: 80, color: '#888', fontWeight: 500 }}>주소</span>
                            <span style={{ marginLeft: 12 }}>{orderDetail.address}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ minWidth: 80, color: '#888', fontWeight: 500 }}>배송메모</span>
                            <span style={{ marginLeft: 12 }}>{orderDetail.orderMemo || ''}</span>
                        </div>
                    </div>
                </div>

                {/* 주문 상품 */}
                <div style={{...styles.section, marginBottom: 32}}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-box" style={{marginRight: 8, color: '#223A5E'}}></i>
                        주문상품
                    </h2>
                    <div style={styles.itemsList}>
                        {orderDetail.orderItems.map((item, index) => (
                            <div key={index} style={styles.orderItem}>
                                <div style={styles.itemImage}>
                                    <img
                                        src={item.thumbnailUrl}
                                        alt={item.itemName}
                                        style={{ ...styles.itemImageImg, cursor: 'pointer' }}
                                        onClick={() => navigate(`/shop/item/${item.itemId}`)}
                                    />
                                </div>
                                <div style={styles.itemInfo}>
                                    <h3 style={styles.itemName}>{item.itemName}</h3>
                                    {item.optionName && (
                                        <p style={styles.itemOption}>옵션: {item.optionName}</p>
                                    )}
                                    <p style={styles.itemPrice}>
  {formatPrice(item.orderPrice)}원
  <span style={{ color: '#bbb', fontWeight: 400, fontSize: '15px', margin: '0 8px' }}>|</span>
  <span style={{ color: '#888', fontWeight: 400, fontSize: '15px' }}>{item.quantity}개</span>
</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 주문 요약 */}
                <div style={{...styles.section, marginBottom: 32}}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-credit-card" style={{marginRight: 8, color: '#223A5E'}}></i>
                        결제정보
                    </h2>
                    <div style={styles.summaryGrid}>
                        <div style={styles.summaryItem}>
                            <span style={styles.label}>상품금액</span>
                            <span style={styles.value}>{formatPrice(orderDetail.totalPrice - orderDetail.deliveryFee)}원</span>
                        </div>
                        <div style={styles.summaryItem}>
                            <span style={styles.label}>배송비</span>
                            <span style={styles.value}>{formatPrice(orderDetail.deliveryFee)}원</span>
                        </div>
                        <div style={styles.summaryItem}>
                            <span style={styles.label}>사용 마일리지</span>
                            <span style={{...styles.value, ...styles.usedMileage}}>
                                -{formatPrice(orderDetail.usedMileage || 0)}원
                            </span>
                        </div>
                        <div style={styles.summaryItemTotal}>
                            <span style={styles.label}>주문금액</span>
                            <span style={styles.value}>{formatPrice(orderDetail.totalPrice)}원</span>
                        </div>
                    </div>
                </div>

                {/* 뒤로가기 버튼 */}
                {/* 하단의 기존 버튼 삭제 */}
            </div>
        </>
    );
};

export default OrderDetail;
