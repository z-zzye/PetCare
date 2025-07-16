import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Header from '../Header.jsx';

const MyAuctionHistory = () => {
  const navigate = useNavigate();
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [toast, setToast] = useState('');
  const [deliveryDeadlines, setDeliveryDeadlines] = useState({}); // {historyId: deadline}

  // 탭 목록 정의 (문자열 key)
  const tabDefs = useMemo(() => [
    { key: 'ALL', label: '전체' },
    { key: 'WIN', label: '낙찰' },
    { key: 'LOSE', label: '미낙찰' },
    { key: 'DELIVERED', label: '배송대기' },
    { key: 'CANCELLED', label: '취소' }
  ], []);

  // 탭별 count 계산 (winner + auctionWinStatus 조합으로 정확히 분류)
  const tabCounts = useMemo(() => ({
    ALL: histories.length,
    WIN: histories.filter(h => h.winner && h.auctionWinStatus === 'WIN').length,
    LOSE: histories.filter(h => !h.winner).length,
    DELIVERED: histories.filter(h => h.winner && h.auctionWinStatus === 'DELIVERED').length,
    CANCELLED: histories.filter(h => h.winner && h.auctionWinStatus === 'CANCELLED').length
  }), [histories]);

  // 입찰내역 조회
  useEffect(() => {
    const fetchHistories = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('로그인이 필요합니다.');
          return;
        }
        const response = await axios.get('/auction/history/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setHistories(response.data || []);
      } catch (err) {
        console.error('입찰내역 조회 실패:', err);
        if (err.response?.status === 401) {
          setError('로그인이 필요합니다.');
        } else {
          setError('입찰내역을 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchHistories();
  }, []);

  // 입찰내역 조회 후, 낙찰+배송대기 대상만 배송 정보 조회
  useEffect(() => {
    const fetchDeadlines = async () => {
      const targets = histories.filter(
        h => h.winner && h.auctionWinStatus === 'WIN' && !h.deliveryAddress
      );
      const newDeadlines = {};
      for (const h of targets) {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`/auction/delivery/${h.historyId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          newDeadlines[h.historyId] = res.data.deliveryDeadline;
        } catch (e) {
          newDeadlines[h.historyId] = null;
        }
      }
      setDeliveryDeadlines(newDeadlines);
    };
    if (histories.length > 0) fetchDeadlines();
  }, [histories]);

  // 필터링된 데이터 (winner + auctionWinStatus 조합으로 정확히 분류)
  const filteredHistories = useMemo(() => histories.filter(history => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'WIN') return history.winner && history.auctionWinStatus === 'WIN';
    if (activeTab === 'LOSE') return !history.winner;
    if (activeTab === 'DELIVERED') return history.winner && history.auctionWinStatus === 'DELIVERED';
    if (activeTab === 'CANCELLED') return history.winner && history.auctionWinStatus === 'CANCELLED';
    return true;
  }), [histories, activeTab]);

  // 배송 요청 처리
  const handleDeliveryRequest = async (historyId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/auction/history/${historyId}/delivery`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setToast('배송 요청이 완료되었습니다.');
      setTimeout(() => setToast(''), 2000);
      
      // 목록 새로고침
      const response = await axios.get('/auction/history/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setHistories(response.data || []);
    } catch (err) {
      alert('배송 요청에 실패했습니다.');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  };

  // 가격 포맷팅
  const formatPrice = (price) => {
    return price?.toLocaleString('ko-KR') || '0';
  };

  // 상태별 색상 및 텍스트 (문자열 key)
  const getStatusInfo = (history) => {
    if (!history.winner) {
      return { color: '#6c757d', text: '미낙찰', bgColor: '#f8f9fa' };
    }
    switch (history.auctionWinStatus) {
      case 'WIN':
        return { color: '#28a745', text: '낙찰', bgColor: '#d4edda' };
      case 'DELIVERED':
        return { color: '#fd7e14', text: '배송대기', bgColor: '#fff3cd' };
      case 'COMPLETED':
        return { color: '#28a745', text: '배송완료', bgColor: '#d4edda' };
      case 'CANCELLED':
        return { color: '#dc3545', text: '취소', bgColor: '#f8d7da' };
      default:
        return { color: '#28a745', text: '낙찰', bgColor: '#d4edda' };
    }
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
      marginBottom: '2rem',
      paddingTop: '1.25rem'
    },
    title: {
      color: '#333',
      margin: 0,
      fontSize: '1.5rem',
      fontWeight: 700
    },
    tabContainer: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '2rem',
      borderBottom: '1px solid #e9ecef',
      paddingBottom: '1rem'
    },
    tab: {
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 600,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    tabActive: {
      backgroundColor: '#223A5E',
      color: '#fff'
    },
    tabInactive: {
      backgroundColor: '#f8f9fa',
      color: '#6c757d'
    },
    count: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      color: 'inherit',
      borderRadius: '1rem',
      padding: '0.2rem 0.5rem',
      fontSize: '0.8rem',
      fontWeight: 700
    },
    card: {
      border: '1px solid #e9ecef',
      borderRadius: '0.75rem',
      marginBottom: '1rem',
      backgroundColor: '#fff',
      overflow: 'hidden',
      boxShadow: '0 2px 8px #0001'
    },
    cardHeader: {
      padding: '1rem',
      borderBottom: '1px solid #e9ecef',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    productImage: {
      width: '4rem',
      height: '4rem',
      objectFit: 'cover',
      borderRadius: '0.5rem'
    },
    productInfo: {
      flex: 1
    },
    productName: {
      fontWeight: 600,
      fontSize: '1.1rem',
      marginBottom: '0.25rem',
      color: '#333'
    },
    statusBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      fontSize: '0.8rem',
      fontWeight: 600
    },
    cardContent: {
      padding: '1rem'
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.5rem',
      fontSize: '0.9rem'
    },
    label: {
      color: '#666',
      fontWeight: 500
    },
    value: {
      color: '#333',
      fontWeight: 600
    },
    buttonContainer: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '1rem'
    },
    button: {
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 600,
      transition: 'all 0.2s'
    },
    primaryButton: {
      backgroundColor: '#223A5E',
      color: '#fff'
    },
    secondaryButton: {
      backgroundColor: '#6c757d',
      color: '#fff'
    },
    loading: {
      textAlign: 'center',
      padding: '3rem',
      fontSize: '1.1rem',
      color: '#666'
    },
    error: {
      textAlign: 'center',
      padding: '3rem',
      color: '#dc3545',
      fontSize: '1rem'
    },
    empty: {
      textAlign: 'center',
      padding: '3rem',
      color: '#666',
      fontSize: '1rem'
    },
    toast: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#223A5E',
      color: '#fff',
      padding: '1rem 2rem',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      zIndex: 9999,
      boxShadow: '0 4px 12px #0002'
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={styles.container}>
          <div style={styles.loading}>입찰내역을 불러오는 중...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div style={styles.container}>
          <div style={styles.error}>{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>내 입찰내역</h1>
        </div>

        {/* 탭 */}
        <div style={styles.tabContainer}>
          {tabDefs.map(tab => (
            <button
              key={tab.key}
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.tabActive : styles.tabInactive)
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} <span style={styles.count}>({tabCounts[tab.key]})</span>
            </button>
          ))}
        </div>

        {/* 입찰내역 리스트 */}
        {filteredHistories.length === 0 ? (
          <div style={styles.empty}>
            {activeTab === 'ALL' ? '입찰내역이 없습니다.' : `${tabDefs.find(t => t.key === activeTab)?.label} 내역이 없습니다.`}
          </div>
        ) : (
          filteredHistories.map((history, index) => {
            const statusInfo = getStatusInfo(history);
            
            return (
              <div key={index} style={styles.card}>
                <div style={styles.cardHeader}>
                  <img
                    src={history.auctionItemImage || '/images/default-product.png'}
                    alt="상품 이미지"
                    style={styles.productImage}
                  />
                  <div style={styles.productInfo}>
                    <div style={styles.productName}>
                      {history.auctionItemName || '상품명 없음'}
                    </div>
                  </div>
                  <div style={{
                    ...styles.statusBadge,
                    backgroundColor: statusInfo.bgColor,
                    color: statusInfo.color
                  }}>
                    {statusInfo.text}
                  </div>
                </div>

                <div style={styles.cardContent}>
                  {history.winner ? (
                    // 낙찰자인 경우
                    <div style={styles.infoRow}>
                      <span style={styles.label}>낙찰가:</span>
                      <span style={styles.value}>{history.finalPrice != null ? formatPrice(history.finalPrice) + 'P' : '-'}</span>
                    </div>
                  ) : (
                    // 미낙찰자인 경우
                    <>
                      {history.myHighestBid != null && (
                        <div style={styles.infoRow}>
                          <span style={styles.label}>내 입찰가:</span>
                          <span style={styles.value}>{formatPrice(history.myHighestBid)}P</span>
                        </div>
                      )}
                      <div style={styles.infoRow}>
                        <span style={styles.label}>최고 입찰가:</span>
                        <span style={styles.value}>{history.finalPrice != null ? formatPrice(history.finalPrice) + 'P' : '-'}</span>
                      </div>
                    </>
                  )}
                  
                  <div style={styles.infoRow}>
                    <span style={styles.label}>경매 종료:</span>
                    <span style={styles.value}>{history.auctionEndTime ? formatDate(history.auctionEndTime) : '-'}</span>
                  </div>

                  {history.winner && history.auctionWinStatus === 'WIN' && !history.deliveryAddress && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '0.5rem', fontSize: '0.9rem', color: '#856404' }}>
                      ⚠️ 배송지 입력 기한: {deliveryDeadlines[history.historyId] ? formatDate(deliveryDeadlines[history.historyId]) : '-'}
                    </div>
                  )}

                  <div style={styles.buttonContainer}>
                    {/* 상품 상세보기 버튼 제거 */}
                    {/*
                    <button
                      style={{ ...styles.button, ...styles.secondaryButton }}
                      onClick={() => navigate(`/shop/item/${history.auctionItemId}`)}
                    >
                      상품 상세보기
                    </button>
                    */}
                    {history.winner && history.auctionWinStatus === 'WIN' && !history.deliveryAddress && (
                      <button
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={() => navigate('/auction/delivery', {
                          state: {
                            item: {
                              itemName: history.auctionItemName,
                              thumbnailUrl: history.auctionItemImage,
                              finalPrice: history.finalPrice,
                              auctionEndTime: history.auctionEndTime
                            },
                            historyId: history.historyId
                          }
                        })}
                      >
                        배송지 입력
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default MyAuctionHistory;
