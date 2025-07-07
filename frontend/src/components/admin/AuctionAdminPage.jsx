import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header.jsx';
import './AdminPage.css';

const AuctionAdminPage = () => {
  const [auctionItems, setAuctionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 경매 상품 목록을 가져오는 로직
    fetchAuctionItems();
  }, []);

  const fetchAuctionItems = async () => {
    try {
      // API 호출 로직 (실제 구현 시 추가)
      setLoading(false);
    } catch (error) {
      console.error('경매 상품 목록을 가져오는데 실패했습니다:', error);
      setLoading(false);
    }
  };

  return (
    <>
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
                  <h3>진행 중</h3>
                  <p className="stat-number">0</p>
                </div>
                <div className="stat-card">
                  <h3>완료된 경매</h3>
                  <p className="stat-number">0</p>
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
                    {/* 경매 상품 목록이 여기에 표시됩니다 */}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AuctionAdminPage;
