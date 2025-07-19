import React, { useState, useEffect } from 'react';
import Header from '../Header.jsx';
import axios from '../../api/axios';
import './AdminPage.css';

const AuctionDeliveryAdminPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // 배송 통계 조회
      const statsResponse = await axios.get('/auction/delivery/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(statsResponse.data);

      // 배송 목록 조회
      const deliveriesResponse = await axios.get('/auction/delivery/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDeliveries(deliveriesResponse.data);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (searchTerm) params.append('searchTerm', searchTerm);

      const response = await axios.get(`/auction/delivery/admin/filter?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDeliveries(response.data);
    } catch (error) {
      console.error('필터링 실패:', error);
    }
  };

  const getStatusBadge = (delivery) => {
    if (delivery.deliveryAddress) {
      return <span style={{ backgroundColor: '#e9f7ef', color: '#1a936f', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>배송 완료</span>;
    } else if (delivery.deliveryDeadline && new Date(delivery.deliveryDeadline) < new Date()) {
      return <span style={{ backgroundColor: '#f8d7da', color: '#dc3545', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>기간 만료</span>;
    } else {
      return <span style={{ backgroundColor: '#fff3cd', color: '#ffb300', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>배송 대기</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  const formatPrice = (price) => {
    return price?.toLocaleString('ko-KR') || '0';
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff',
      borderRadius: '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginTop: '20px',
      marginBottom: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    title: {
      color: '#333',
      margin: 0,
      fontSize: '1.5rem',
      fontWeight: 700
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: '#fff',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#223A5E',
      marginBottom: '5px'
    },
    statLabel: {
      color: '#666',
      fontSize: '0.9rem'
    },
    controls: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    select: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #ddd',
      fontSize: '0.9rem'
    },
    input: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #ddd',
      fontSize: '0.9rem',
      minWidth: '200px'
    },
    button: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: '#667eea',
      color: 'white',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 600
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: '#fff',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    th: {
      background: '#f8f9fa',
      padding: '15px 10px',
      textAlign: 'left',
      fontWeight: 600,
      color: '#333',
      borderBottom: '1px solid #dee2e6'
    },
    td: {
      padding: '15px 10px',
      borderBottom: '1px solid #dee2e6'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: '#fff',
      padding: '30px',
      borderRadius: '10px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    closeButton: {
      position: 'absolute',
      top: '10px',
      right: '15px',
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#666'
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={styles.container}>
          <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <style>
        {`
          body {
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-15px);
            }
            60% {
              transform: translateY(-7px);
            }
          }
        `}
      </style>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            <i className="fas fa-truck" style={{ 
              marginRight: '10px', 
              color: '#1a365d',
              animation: 'bounce 2s ease-in-out infinite',
              fontSize: '1.2rem'
            }}></i>
            낙찰물품 배송관리
          </h1>
        </div>

        {/* 통계 카드 */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalCount || 0}</div>
            <div style={styles.statLabel}>전체 낙찰</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.waitingCount || 0}</div>
            <div style={styles.statLabel}>배송 대기</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.completedCount || 0}</div>
            <div style={styles.statLabel}>배송 완료</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.expiredCount || 0}</div>
            <div style={styles.statLabel}>기간 만료</div>
          </div>
        </div>

        {/* 필터 컨트롤 */}
        <div style={styles.controls}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">전체 상태</option>
            <option value="WAITING">배송 대기</option>
            <option value="COMPLETED">배송 완료</option>
            <option value="EXPIRED">기간 만료</option>
          </select>
          <input
            type="text"
            placeholder="낙찰자명 또는 상품명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleFilter} style={{...styles.button, backgroundColor: '#1a365d'}}>
            검색
          </button>
          <button onClick={fetchData} style={{...styles.button, backgroundColor: '#f6ad55'}}>
            새로고침
          </button>
        </div>

        {/* 배송 목록 테이블 */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>번호</th>
              <th style={styles.th}>상품명</th>
              <th style={styles.th}>낙찰자</th>
              <th style={styles.th}>낙찰가</th>
              <th style={styles.th}>배송지</th>
              <th style={styles.th}>마감일</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>상세보기</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={8} style={{...styles.td, textAlign: 'center', color: '#666'}}>
                  배송 정보가 없습니다.
                </td>
              </tr>
            ) : (
              deliveries.map((delivery, index) => (
                <tr key={delivery.deliveryId}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{delivery.itemName || '상품명 없음'}</td>
                  <td style={styles.td}>{delivery.winnerName || '낙찰자 정보 없음'}</td>
                  <td style={styles.td}>{formatPrice(delivery.finalPrice)}P</td>
                  <td style={styles.td}>
                    {delivery.deliveryAddress ?
                      `${delivery.deliveryAddress} ${delivery.deliveryAddressDetail || ''}` :
                      '미입력'
                    }
                  </td>
                  <td style={styles.td}>{formatDate(delivery.deliveryDeadline)}</td>
                  <td style={styles.td}>{getStatusBadge(delivery)}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => setSelectedDelivery(delivery)}
                      style={{...styles.button, padding: '4px 8px', fontSize: '0.8rem'}}
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 상세 정보 모달 */}
        {selectedDelivery && (
          <div style={styles.modal} onClick={() => setSelectedDelivery(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button style={styles.closeButton} onClick={() => setSelectedDelivery(null)}>&times;</button>
              <h2 style={{ marginBottom: '20px', color: '#333' }}>배송 상세 정보</h2>

              <div style={{ marginBottom: '15px' }}>
                <strong>상품명:</strong> {selectedDelivery.itemName || '상품명 없음'}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>낙찰자:</strong> {selectedDelivery.winnerName || '낙찰자 정보 없음'}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>낙찰가:</strong> {formatPrice(selectedDelivery.finalPrice)}P
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>배송지:</strong> {selectedDelivery.deliveryAddress || '미입력'}
              </div>
              {selectedDelivery.deliveryAddressDetail && (
                <div style={{ marginBottom: '15px' }}>
                  <strong>상세주소:</strong> {selectedDelivery.deliveryAddressDetail}
                </div>
              )}
              <div style={{ marginBottom: '15px' }}>
                <strong>수령인:</strong> {selectedDelivery.receiverName || '미입력'}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>연락처:</strong> {selectedDelivery.receiverPhone || '미입력'}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>배송메모:</strong> {selectedDelivery.deliveryMemo || '없음'}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>배송사:</strong> {selectedDelivery.deliveryName || '미입력'}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>입력일시:</strong> {formatDate(selectedDelivery.deliveryInputAt)}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>마감일시:</strong> {formatDate(selectedDelivery.deliveryDeadline)}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>상태:</strong> {getStatusBadge(selectedDelivery)}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AuctionDeliveryAdminPage;
