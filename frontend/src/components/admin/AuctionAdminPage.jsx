import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header.jsx';
import './AdminPage.css';
import axios from '../../api/axios';

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

const AuctionAdminPage = () => {
  const [auctionItems, setAuctionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAuction, setEditAuction] = useState(null);

  useEffect(() => {
    // 경매 상품 목록을 가져오는 로직
    fetchAuctionItems();
  }, []);

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

  // 카드 하단 버튼 핸들러 함수 추가
  function handleStartAuction(auctionItemId) {
    // TODO: 경매 시작 API 연동
    alert(`경매 시작: ${auctionItemId}`);
  }
  function handleEndAuction(auctionItemId) {
    // TODO: 경매 종료 API 연동
    alert(`경매 종료: ${auctionItemId}`);
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

  return (
    <>
      <style>{`
      .auction-items {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      .auction-item-card {
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        box-shadow: 0 2px 8px #0001;
        padding: 18px 22px;
        min-width: 220px;
        max-width: 260px;
        flex: 1 1 220px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .auction-item-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 8px;
      }
      .auction-status {
        font-size: 0.95rem;
        font-weight: bold;
        padding: 2px 10px;
        border-radius: 8px;
        color: #fff;
        background: #888;
      }
      .auction-status-예정 { background: #6c63ff; }
      .auction-status-진행 { background: #00b894; }
      .auction-status-완료 { background: #636e72; }
      `}</style>
      <Header />
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <h1 className="admin-title">경매 관리</h1>
            <Link to="/admin/auction/register" className="admin-button">
              🏷️ 경매상품등록
            </Link>
          </div>

        <div className="admin-content">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : (
            <div className="auction-admin-content">
              <div className="auction-stats">
                <div className="stat-card">
                  <h3>전체 경매</h3>
                  <p className="stat-number">{auctionItems.length}</p>
                </div>
                <div className="stat-card">
                  <h3>예정된 경매</h3>
                  <p className="stat-number">{auctionItems.filter(item => item.auction_status === 'SCHEDULED').length}</p>
                </div>
                <div className="stat-card">
                  <h3>진행 중</h3>
                  <p className="stat-number">{auctionItems.filter(item => item.auction_status === 'ACTIVE').length}</p>
                </div>
                <div className="stat-card">
                  <h3>완료된 경매</h3>
                  <p className="stat-number">{auctionItems.filter(item => item.auction_status === 'ENDED').length}</p>
                </div>
              </div>

              <div className="auction-list">
                <h2>경매 상품 목록</h2>
                {auctionItems.length === 0 ? (
                  <div className="empty-state">
                    <p>등록된 경매 상품이 없습니다.</p>
                  </div>
                ) : (
                  <div className="auction-items">
                    {auctionItems.map(item => {
                      let status = '예정';
                      if (item.auction_status === 'ACTIVE') status = '진행';
                      else if (item.auction_status === 'ENDED') status = '완료';
                      return (
                        <div className="auction-item-card" key={item.auction_item_id} onClick={() => handleCardClick(item)} style={{ cursor: 'pointer' }}>
                          <div className="auction-item-header">
                            <span className={`auction-status auction-status-${status}`}>{status}</span>
                          </div>
                          {item.thumbnailUrl && (
                            <div className="auction-item-thumbnail" style={{textAlign: 'center', marginBottom: 8}}>
                              <img src={item.thumbnailUrl} alt="썸네일" style={{maxWidth: '100%', maxHeight: 220, borderRadius: 3, objectFit: 'cover'}} />
                            </div>
                          )}
                          <div className="auction-item-body">
                            <div><b>상품명: </b> {item.itemName}</div>
                            <div><b>시작가: </b> {item.start_price}P</div>
                            <div><b>경매 기간: </b> {item.start_time?.slice(0,16).replace('T',' ')} ~ {item.end_time?.slice(0,16).replace('T',' ')}</div>
                            {item.currentWinnerName && (
                              <div><b>입찰자:</b> {item.currentWinnerName}</div>
                            )}
                          </div>
                          <div className="auction-item-actions" style={{marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center'}}>
                            <button onClick={e => { e.stopPropagation(); handleStartAuction(item.auction_item_id); }} disabled={item.auction_status !== 'SCHEDULED'} style={{padding: '6px 14px', borderRadius: 6, border: 'none', background: '#6c63ff', color: '#fff', fontWeight: 600, cursor: item.auction_status !== 'SCHEDULED' ? 'not-allowed' : 'pointer', opacity: item.auction_status !== 'SCHEDULED' ? 0.5 : 1}}>경매 시작</button>
                            <button onClick={e => { e.stopPropagation(); handleEndAuction(item.auction_item_id); }} disabled={item.auction_status !== 'ACTIVE'} style={{padding: '6px 14px', borderRadius: 6, border: 'none', background: '#636e72', color: '#fff', fontWeight: 600, cursor: item.auction_status !== 'ACTIVE' ? 'not-allowed' : 'pointer', opacity: item.auction_status !== 'ACTIVE' ? 0.5 : 1}}>경매 종료</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {selectedAuction && (
      <AuctionDetailModal auction={selectedAuction} onClose={closeModal} onEdit={() => handleEditAuction(selectedAuction)} />
    )}
    {editModalOpen && editAuction && (
      <AuctionEditModal auction={editAuction} onClose={() => setEditModalOpen(false)} onSave={fetchAuctionItems} />
    )}
    </>
  );
};

export default AuctionAdminPage;
