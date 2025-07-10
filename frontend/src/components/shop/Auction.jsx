import React, { useEffect, useState } from 'react';
import Header from '../Header.jsx';
import AuctionCarousel from './AuctionCarousel.jsx';
import axios from '../../api/axios';

const Auction = () => {
  const [scheduledItems, setScheduledItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // SCHEDULED와 ACTIVE 상태인 경매 상품을 예정일 순서대로 3개 가져오기
    const fetchScheduled = async () => {
      try {
        const res = await axios.get('/auctions/list');
        // SCHEDULED와 ACTIVE 상품 필터링하고 예정일 순서대로 정렬
        const filtered = res.data
          .filter(item => item.auction_status === 'SCHEDULED' || item.auction_status === 'ACTIVE')
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .slice(0, 3);
        setScheduledItems(filtered);
      } catch (err) {
        setScheduledItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchScheduled();
  }, []);

  return (
    <>
      <Header />
      <div style={{ marginTop: 32 }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.4rem', marginBottom: 18 }}>
          경매 상품
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', margin: '60px 0', fontSize: '1.2rem' }}>로딩 중...</div>
        ) : scheduledItems.length === 0 ? (
          <div style={{ textAlign: 'center', margin: '60px 0', fontSize: '1.1rem', color: '#888' }}>
            이번 주 경매 예정 상품이 없습니다.
          </div>
        ) : (
          <AuctionCarousel items={scheduledItems} />
        )}
      </div>
    </>
  );
};

export default Auction;

