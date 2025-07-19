import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header.jsx';
import axios from '../../api/axios';
import { FaTrash } from 'react-icons/fa';

const AuctionDetailModal = ({ auction, onClose, onEdit }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{ background: '#fff', borderRadius: 12, minWidth: 340, maxWidth: 420, padding: 28, boxShadow: '0 8px 32px #0003', position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>&times;</button>
      <h2 style={{ marginBottom: 18, fontWeight: 700, fontSize: '1.3rem', color: '#223A5E' }}>경매 상세정보</h2>
      {auction.thumbnailUrl && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <img src={auction.thumbnailUrl} alt="썸네일" style={{ maxWidth: 280, maxHeight: 200, borderRadius: 2, objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ marginBottom: 8 }}><b>상품명:</b> {auction.itemName}</div>
      <div style={{ marginBottom: 8 }}><b>시작가:</b> {auction.start_price}P</div>
      <div style={{ marginBottom: 8 }}><b>경매 기간:</b> {auction.start_time?.slice(0,16).replace('T',' ')} ~ {auction.end_time?.slice(0,16).replace('T',' ')}</div>
      <div style={{ marginBottom: 8 }}><b>최소 입찰 단위:</b> {auction.bid_unit}P</div>
      <div style={{ marginBottom: 8 }}><b>상태:</b> {auction.auction_status === 'SCHEDULED' ? '예정' : auction.auction_status === 'ACTIVE' ? '진행' : '완료'}</div>
      {auction.currentWinnerName && (
        <div style={{ marginBottom: 8 }}><b>입찰자:</b> {auction.currentWinnerName}</div>
      )}
      {auction.auction_description && (
        <div style={{ marginBottom: 8 }}><b>설명:</b> {auction.auction_description}</div>
      )}
      {/* 상품 수정 버튼 (예정 상태일 때만) */}
      {auction.auction_status === 'SCHEDULED' && (
        <button onClick={onEdit} style={{ marginTop: 16, padding: '8px 18px', borderRadius: 8, background: '#667eea', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
          상품 수정
        </button>
      )}
    </div>
  </div>
);

// 간단한 수정 폼 모달 (DB 반영 X, 닫기만 가능)
const AuctionEditModal = ({ auction, onClose, onSave }) => {
  const [form, setForm] = useState({
    startPrice: auction.start_price || '',
    startDate: auction.start_time ? auction.start_time.slice(0,16) : '',
    endDate: auction.end_time ? auction.end_time.slice(0,16) : '',
    bidUnit: auction.bid_unit || '',
    description: auction.auction_description || ''
  });
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleApply = async () => {
    try {
      await axios.put(`/auctions/${auction.auction_item_id}`, {
        auction_item_id: auction.auction_item_id, // body에 추가
        start_price: form.startPrice,
        start_time: form.startDate,
        end_time: form.endDate,
        bid_unit: form.bidUnit,
        auction_description: form.description
      });
      alert('수정 완료!');
      if (onSave) onSave();
      onClose();
    } catch (err) {
      alert('수정 실패: ' + (err.response?.data?.message || '오류'));
    }
  };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, minWidth: 340, maxWidth: 420, padding: 28, boxShadow: '0 8px 32px #0003', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>&times;</button>
        <h2 style={{ marginBottom: 18, fontWeight: 700, fontSize: '1.3rem', color: '#223A5E' }}>경매 상품 수정</h2>
        <div style={{ marginBottom: 12 }}>
          <label>시작가</label>
          <input name="startPrice" value={form.startPrice} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
          <label>경매 시작일시</label>
          <input name="startDate" type="datetime-local" value={form.startDate} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
          <label>경매 종료일시</label>
          <input name="endDate" type="datetime-local" value={form.endDate} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
          <label>최소 입찰 단위</label>
          <input name="bidUnit" value={form.bidUnit} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
          <label>경매 설명</label>
          <textarea name="description" value={form.description} onChange={handleChange} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, background: '#636e72', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem' }}>닫기</button>
          <button onClick={handleApply} style={{ padding: '8px 18px', borderRadius: 8, background: '#667eea', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem' }}>적용</button>
        </div>
      </div>
    </div>
  );
};

// 토스트 팝업 컴포넌트
const ConfirmToast = ({ open, message, subMessage, nowString, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 400, padding: 28,
        boxShadow: '0 8px 32px #0003', border: '2px solid #e53935', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <div style={{ color: '#e53935', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{message}</div>
        {subMessage && <div style={{ color: '#b71c1c', marginBottom: 6, fontSize: '0.98rem' }}>{subMessage}</div>}
        {nowString && <div style={{ color: '#b71c1c', marginBottom: 18, fontSize: '0.98rem' }}>현재 시각: {nowString}</div>}
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <button onClick={onCancel} style={{ padding: '7px 18px', borderRadius: 6, background: '#eee', color: '#333', border: 'none', fontWeight: 600, cursor: 'pointer' }}>취소</button>
          <button onClick={onConfirm} style={{ padding: '7px 18px', borderRadius: 6, background: '#e53935', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>확인</button>
        </div>
      </div>
    </div>
  );
};

const AuctionAdminPage = () => {
  const [auctionItems, setAuctionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAuction, setEditAuction] = useState(null);
  const [confirmToast, setConfirmToast] = useState({ open: false, auction: null });
  const [confirmEndToast, setConfirmEndToast] = useState({ open: false, auction: null });
  const [nowString, setNowString] = useState('');
  const [confirmDeleteToast, setConfirmDeleteToast] = useState({ open: false, auction: null });

  useEffect(() => {
    // 경매 상품 목록을 가져오는 로직
    fetchAuctionItems();
  }, []);

  useEffect(() => {
    if (confirmToast.open || confirmEndToast.open) {
      const updateNow = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setNowString(`${yyyy}-${MM}-${dd} ${hh}:${mm}`);
      };
      updateNow();
      const interval = setInterval(updateNow, 1000);
      return () => clearInterval(interval);
    }
  }, [confirmToast.open, confirmEndToast.open]);

  const fetchAuctionItems = async () => {
    try {
      const res = await axios.get('/auctions/list');
      setAuctionItems(res.data);
      setLoading(false);
    } catch (error) {
      console.error('경매 상품 목록을 가져오는데 실패했습니다:', error);
      setLoading(false);
    }
  };

  // 로컬 타임존 기준 ISO 문자열 생성 함수
  function toLocalISOString(dt) {
    const pad = n => n.toString().padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  }

  // 카드 하단 버튼 핸들러 함수 추가
  async function handleStartAuction(auctionItemId) {
    try {
      const now = new Date();
      const startTime = toLocalISOString(now);
      const endTime = toLocalISOString(new Date(now.getTime() + 5 * 60 * 1000));
      await axios.post(`/auctions/${auctionItemId}/start`, {
        start_time: startTime,
        end_time: endTime
      });
      alert('경매가 시작되었습니다!');
      fetchAuctionItems(); // 목록 새로고침
    } catch (err) {
      alert('경매 시작 실패: ' + (err.response?.data?.message || '오류'));
    }
  }
  async function handleEndAuction(auctionItemId) {
    try {
      await axios.post(`/auctions/${auctionItemId}/force-end`);
      alert('경매가 강제 종료(유찰)되었습니다!');
      fetchAuctionItems(); // 목록 새로고침
    } catch (err) {
      alert('경매 강제 종료 실패: ' + (err.response?.data?.message || '오류'));
    }
  }

  // 경매 상품 삭제 함수
  async function handleDeleteAuction(auctionItemId) {
    try {
      await axios.delete(`/auctions/${auctionItemId}`);
      alert('경매 상품이 삭제되었습니다!');
      fetchAuctionItems(); // 목록 새로고침
    } catch (err) {
      alert('삭제 실패: ' + (err.response?.data?.message || '오류'));
    }
  }

  function handleCardClick(item) {
    setSelectedAuction(item);
  }
  function closeModal() {
    setSelectedAuction(null);
  }
  function handleEditAuction(auction) {
    setEditAuction(auction);
    setEditModalOpen(true);
    setSelectedAuction(null); // 상세 모달 닫기
  }

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
    button: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: '#667eea',
      color: 'white',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 600,
      textDecoration: 'none',
      display: 'inline-block'
    },
    auctionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px',
      marginTop: '20px'
    },
    auctionCard: {
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '18px',
      cursor: 'pointer',
      transition: 'transform 0.2s ease'
    },
    statusBadge: {
      fontSize: '0.9rem',
      fontWeight: 'bold',
      padding: '4px 12px',
      borderRadius: '8px',
      color: '#fff',
      display: 'inline-block',
      marginBottom: '10px'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'center',
      marginTop: '12px'
    },
    actionButton: {
      padding: '4px 10px',
      borderRadius: '6px',
      border: 'none',
      color: '#fff',
      fontWeight: 600,
      fontSize: '0.85rem',
      height: '28px',
      cursor: 'pointer'
    },
    deleteButton: {
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      border: 'none',
      background: '#e53935',
      color: '#fff',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      cursor: 'pointer'
    }
  };

  return (
    <>
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
          .delivery-button {
            background-color: #ffffff !important;
            color: #f6ad55 !important;
            border: 2px solid #f6ad55 !important;
            transition: all 0.3s ease !important;
          }
          .delivery-button:hover {
            background-color: #f6ad55 !important;
            color: #ffffff !important;
          }
          .register-button {
            background-color: #1a365d !important;
            transition: all 0.3s ease !important;
          }
          .register-button:hover {
            background-color: #2d5a8b !important;
          }
        `}
      </style>
      <Header />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            <i className="fas fa-gavel" style={{ 
              marginRight: '10px', 
              color: '#1a365d',
              animation: 'bounce 2s ease-in-out infinite',
              fontSize: '1.2rem'
            }}></i>
            경매 관리
          </h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link to="/admin/auction-delivery" className="delivery-button" style={styles.button}>
              🚚 배송관리
            </Link>
            <Link to="/admin/auction/register" className="register-button" style={styles.button}>
              🏷️ 경매상품등록
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{auctionItems.length}</div>
            <div style={styles.statLabel}>전체 경매</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{auctionItems.filter(item => item.auction_status === 'SCHEDULED').length}</div>
            <div style={styles.statLabel}>예정된 경매</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{auctionItems.filter(item => item.auction_status === 'ACTIVE').length}</div>
            <div style={styles.statLabel}>진행 중</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{auctionItems.filter(item => item.auction_status === 'ENDED').length}</div>
            <div style={styles.statLabel}>완료된 경매</div>
          </div>
        </div>

        {/* 경매 목록 */}
        <div>
          <h2 style={{ marginBottom: '0px', paddingTop: '20px', paddingBottom: '10px', color: '#333', fontSize: '1.3rem' }}>
            <i className="fas fa-gift" style={{ 
              marginRight: '10px', 
              marginLeft: '5px',
              color: '#1a365d',
              fontSize: '1.1rem'
            }}></i>
            경매 상품 목록
          </h2>
          <hr style={{ 
            border: 'none', 
            height: '2px', 
            background: '#1a365d', 
            marginTop: '0px',
            marginBottom: '20px',
            borderRadius: '1px'
          }} />
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>로딩 중...</div>
          ) : auctionItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
              등록된 경매 상품이 없습니다.
            </div>
          ) : (
            <div style={styles.auctionGrid}>
              {auctionItems.map(item => {
                let status = '예정';
                let statusColor = '#1a365d';
                if (item.auction_status === 'ACTIVE') {
                  status = '진행';
                  statusColor = '#f6ad55';
                } else if (item.auction_status === 'ENDED') {
                  status = '완료';
                  statusColor = '#636e72';
                }
                
                return (
                  <div key={item.auction_item_id} style={{
                    ...styles.auctionCard,
                    boxShadow: item.auction_status === 'ACTIVE' 
                      ? '0 4px 12px rgba(246, 173, 85, 0.6)' 
                      : '0 2px 8px rgba(0,0,0,0.1)'
                  }} onClick={() => handleCardClick(item)}>
                    <div style={{...styles.statusBadge, backgroundColor: statusColor}}>{status}</div>
                    {item.thumbnailUrl && (
                      <div style={{textAlign: 'center', marginBottom: '18px'}}>
                        <img src={item.thumbnailUrl} alt="썸네일" style={{maxWidth: '100%', maxHeight: '180px', borderRadius: '6px', objectFit: 'cover'}} />
                      </div>
                    )}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '3px', 
                          height: '14px', 
                          backgroundColor: '#1a365d', 
                          marginRight: '8px'
                        }}></span>
                        <span style={{ width: '60px', flexShrink: 0 }}><strong>상품명</strong></span>
                        <span>{item.itemName}</span>
                      </div>
                      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '3px', 
                          height: '14px', 
                          backgroundColor: '#1a365d', 
                          marginRight: '8px'
                        }}></span>
                        <span style={{ width: '60px', flexShrink: 0 }}><strong>시작가</strong></span>
                        <span>{item.start_price}P</span>
                      </div>
                      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '3px', 
                          height: '28px', 
                          backgroundColor: '#1a365d', 
                          marginRight: '8px',
                          marginTop: '2px'
                        }}></span>
                        <span style={{ width: '60px', flexShrink: 0, lineHeight: '1.2' }}><strong>경매<br/>기간</strong></span>
                        <span>
                          {item.start_time?.slice(0,16).replace('T',' ')}<br/>
                          ~ {item.end_time?.slice(0,16).replace('T',' ')}
                        </span>
                      </div>
                      {item.currentWinnerName && (
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '3px', 
                            height: '14px', 
                            backgroundColor: '#1a365d', 
                            marginRight: '8px'
                          }}></span>
                          <span style={{ width: '60px', flexShrink: 0 }}><strong>입찰자</strong></span>
                          <span>{item.currentWinnerName}</span>
                        </div>
                      )}
                    </div>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setConfirmToast({ open: true, auction: item });
                        }}
                        disabled={item.auction_status !== 'SCHEDULED'}
                        style={{
                          ...styles.actionButton,
                          background: item.auction_status === 'SCHEDULED' ? '#f6ad55' : '#cccccc',
                          color: item.auction_status === 'SCHEDULED' ? '#ffffff' : '#666666',
                          cursor: item.auction_status !== 'SCHEDULED' ? 'not-allowed' : 'pointer'
                        }}
                      >경매 시작</button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setConfirmEndToast({ open: true, auction: item });
                        }}
                        disabled={item.auction_status !== 'ACTIVE'}
                        style={{
                          ...styles.actionButton,
                          background: item.auction_status === 'ACTIVE' ? '#ffffff' : '#cccccc',
                          color: item.auction_status === 'ACTIVE' ? '#1a365d' : '#666666',
                          border: item.auction_status === 'ACTIVE' ? '2px solid #1a365d' : '2px solid #cccccc',
                          cursor: item.auction_status !== 'ACTIVE' ? 'not-allowed' : 'pointer'
                        }}
                      >경매 종료</button>
                      {item.auction_status === 'SCHEDULED' && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setConfirmDeleteToast({ open: true, auction: item });
                          }}
                          style={styles.deleteButton}
                          title="경매 상품 삭제"
                        >
                          <FaTrash style={{ fontSize: '1.1rem' }} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    {selectedAuction && (
      <AuctionDetailModal auction={selectedAuction} onClose={closeModal} onEdit={() => handleEditAuction(selectedAuction)} />
    )}
    {editModalOpen && editAuction && (
      <AuctionEditModal auction={editAuction} onClose={() => setEditModalOpen(false)} onSave={fetchAuctionItems} />
    )}
    <ConfirmToast
      open={confirmToast.open}
      message="정말 경매를 시작하시겠습니까?"
      subMessage={confirmToast.auction ? `예정 시작일: ${confirmToast.auction.start_time?.slice(0,16).replace('T',' ')}` : ''}
      nowString={nowString}
      onConfirm={() => {
        setConfirmToast({ open: false, auction: null });
        if (confirmToast.auction) handleStartAuction(confirmToast.auction.auction_item_id);
      }}
      onCancel={() => setConfirmToast({ open: false, auction: null })}
    />
    <ConfirmToast
      open={confirmEndToast.open}
      message="정말 종료하시겠습니까?"
      subMessage={confirmEndToast.auction ? `예정된 경매 종료 시간: ${confirmEndToast.auction.end_time?.slice(0,16).replace('T',' ')}` : ''}
      nowString={nowString}
      onConfirm={() => {
        setConfirmEndToast({ open: false, auction: null });
        if (confirmEndToast.auction) handleEndAuction(confirmEndToast.auction.auction_item_id);
      }}
      onCancel={() => setConfirmEndToast({ open: false, auction: null })}
    />
    <ConfirmToast
      open={confirmDeleteToast.open}
      message={`‘${confirmDeleteToast.auction?.itemName}’ 경매를 삭제하시겠습니까?`}
      nowString={nowString}
      onConfirm={() => {
        setConfirmDeleteToast({ open: false, auction: null });
        if (confirmDeleteToast.auction) handleDeleteAuction(confirmDeleteToast.auction.auction_item_id);
      }}
      onCancel={() => setConfirmDeleteToast({ open: false, auction: null })}
    />
    </>
  );
};

export default AuctionAdminPage;
