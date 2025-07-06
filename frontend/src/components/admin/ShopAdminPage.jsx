import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Header from '../Header.jsx';

const orderStatusList = [
    { key: 'ORDERED', label: '결제완료', color: '#FFF3CD', textColor: '#FFB300' },
    { key: 'SHIPPING', label: '배송중', color: '#D1ECF1', textColor: '#0C5460' },
    { key: 'DELIVERED', label: '배송완료', color: '#e9f7ef', textColor: '#1a936f' },
    { key: 'CONFIRMED', label: '구매확정', color: '#e3eaf6', textColor: '#223A5E' },
    { key: 'CANCEL', label: '취소완료', color: '#f8d7da', textColor: '#dc3545' },
];

const ShopAdminPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState('');

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
            fetchOrders();
            setToast('주문 상태가 배송완료로 변경되었습니다.');
            setTimeout(() => setToast(''), 1800);
        } catch (err) {
            alert('상태 변경에 실패했습니다.');
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await axios.get('/orders/admin/all-orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setOrders(response.data || []);
        } catch (err) {
            console.error('주문 내역 조회 실패:', err);
            if (err.response?.status === 401) {
                setError('관리자 권한이 필요합니다.');
            } else {
                setError('주문 내역을 불러오는데 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // 필터링된 주문 목록
    const filteredOrders = orders.filter(order => {
        const statusMatch = selectedStatus === 'ALL' || order.orderStatus === selectedStatus;
        const searchMatch = searchTerm === '' || 
            order.merchantUid.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.orderItems.some(item => 
                item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        return statusMatch && searchMatch;
    });

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
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
    };

    const formatPrice = (price) => {
        return price?.toLocaleString('ko-KR') || '0';
    };

    const getStatusStyle = (status) => {
        const statusInfo = orderStatusList.find(s => s.key === status);
        return statusInfo ? {
            backgroundColor: statusInfo.color,
            color: statusInfo.textColor,
            fontWeight: 700,
            fontSize: '0.93rem',
            borderRadius: '0.5rem',
            padding: '0.3rem 1.1rem',
            display: 'inline-block',
            letterSpacing: '0.02em',
        } : {};
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
            marginBottom: '1.88rem',
            paddingTop: '1.25rem'
        },
        title: {
            color: '#333',
            margin: 0,
            fontSize: '1.375rem'
        },
        controls: {
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            alignItems: 'center',
            flexWrap: 'wrap'
        },
        select: {
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #ddd',
            fontSize: '0.9rem'
        },
        input: {
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #ddd',
            fontSize: '0.9rem',
            minWidth: '200px'
        },
        statusBar: {
            display: 'flex',
            alignItems: 'center',
            background: '#fff',
            borderRadius: '0.125rem',
            padding: '1.2rem 2rem',
            gap: '1.5rem',
            marginBottom: '2rem',
            justifyContent: 'center',
            boxShadow: '0 2px 8px #0001'
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
            backgroundColor: '#FFB300', // 머스터드 색상으로 변경
            borderTopLeftRadius: '0.25rem',
            borderTopRightRadius: '0.25rem',
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        orderInfo: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
        },
        orderDate: {
            color: '#223A5E', // 머스터드 배경에서 잘 보이도록
            fontSize: '1.05rem',
            fontWeight: 600,
        },
        orderNumber: {
            color: '#223A5E', // 머스터드 배경에서 잘 보이도록
            fontSize: '0.94rem'
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
            backgroundColor: '#FFB300', // 머스터드
            color: '#223A5E', // 네이비
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 600,
            transition: 'background-color 0.3s, color 0.3s'
        },
        emptyMessage: {
            textAlign: 'center',
            padding: '3.13rem',
            color: '#666',
            fontSize: '1rem'
        },
        stats: {
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
        },
        statCard: {
            background: '#fff',
            padding: '1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px #0001',
            minWidth: '120px',
            textAlign: 'center'
        },
        statValue: {
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#223A5E',
            marginBottom: '0.25rem'
        },
        statLabel: {
            fontSize: '0.9rem',
            color: '#666'
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
            <Header />
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
                <div style={styles.header}>
                    <h1 style={styles.title}>
                        <i className="fas fa-shopping-bag" style={{ marginRight: 8, color: '#223A5E', fontSize: 22, verticalAlign: 'middle' }}></i>
                        쇼핑몰 관리
                    </h1>
                </div>

                {/* 통계 카드 + 상품 등록 버튼 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={styles.stats}>
                        <div style={styles.statCard}>
                            <div style={styles.statValue}>{orders.length}</div>
                            <div style={styles.statLabel}>전체 주문</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statValue}>{formatPrice(orders.reduce((sum, order) => sum + order.totalPrice, 0))}원</div>
                            <div style={styles.statLabel}>총 매출</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statValue}>{orders.filter(o => o.orderStatus === 'ORDERED').length}</div>
                            <div style={styles.statLabel}>배송 대기</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statValue}>{orders.filter(o => o.orderStatus === 'DELIVERED').length}</div>
                            <div style={styles.statLabel}>배송 완료</div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/shop/item/register')}
                        style={{
                            backgroundColor: '#FFB300',
                            color: '#223A5E',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.8rem 2.1rem',
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px #0001',
                            transition: 'background 0.2s, color 0.2s',
                        }}
                        onMouseOver={e => {
                            e.target.style.backgroundColor = '#e6a800';
                            e.target.style.color = '#fff';
                        }}
                        onMouseOut={e => {
                            e.target.style.backgroundColor = '#FFB300';
                            e.target.style.color = '#223A5E';
                        }}
                    >
                        + 상품 등록
                    </button>
                </div>

                {/* 상태바 */}
                <div style={styles.statusBar}>
                    {orderStatusList.map((status, idx) => (
                        <React.Fragment key={status.key}>
                            <div style={styles.statusStep}>
                                <div style={styles.statusLabel}>{status.label}</div>
                                <div style={styles.statusCount}>{statusCounts[status.key] || 0}</div>
                            </div>
                            {idx < orderStatusList.length - 2 && (
                                <div style={styles.statusArrow}>→</div>
                            )}
                            {idx === orderStatusList.length - 2 && (
                                <div style={{ fontSize: '1.5rem', color: '#bbb', margin: '0 0.5rem' }}>|</div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* 필터 컨트롤 */}
                <div style={styles.controls}>
                    <select 
                        value={selectedStatus} 
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        style={styles.select}
                    >
                        <option value="ALL">전체 상태</option>
                        {orderStatusList.map(status => (
                            <option key={status.key} value={status.key}>{status.label}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="주문번호 또는 상품명으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.input}
                    />
                </div>

                {filteredOrders.length === 0 ? (
                    <div style={styles.emptyMessage}>
                        {searchTerm || selectedStatus !== 'ALL' ? '검색 결과가 없습니다.' : '주문 내역이 없습니다.'}
                    </div>
                ) : (
                    [...filteredOrders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).map((order, index) => (
                        <div key={index} style={{ marginBottom: '2.5rem' }}>
                            <div style={styles.orderItem}>
                                <div style={styles.orderHeader}>
                                    <div style={styles.orderInfo}>
                                        <div style={styles.orderDate}>
                                            {formatDate(order.orderDate)}
                                        </div>
                                        <div style={styles.orderNumber}>
                                            주문번호: {order.merchantUid}
                                        </div>
                                    </div>
                                    <div style={getStatusStyle(order.orderStatus)}>
                                        {orderStatusList.find(s => s.key === order.orderStatus)?.label || order.orderStatus}
                                    </div>
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
                                                onMouseOver={e => {
                                                    e.target.style.backgroundColor = '#e6a800';
                                                    e.target.style.color = '#fff';
                                                }}
                                                onMouseOut={e => {
                                                    e.target.style.backgroundColor = '#FFB300';
                                                    e.target.style.color = '#223A5E';
                                                }}
                                            >
                                                상세보기
                                            </button>
                                            {order.orderStatus === 'ORDERED' && (
                                                <button
                                                    style={{
                                                        ...styles.viewDetailButton,
                                                        backgroundColor: '#e9f7ef',
                                                        color: '#1a936f',
                                                        border: '1.5px solid #1a936f'
                                                    }}
                                                    onClick={() => handleSetDelivered(order.merchantUid)}
                                                >
                                                    배송완료로 변경
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

export default ShopAdminPage; 