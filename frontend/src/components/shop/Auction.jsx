import React, { useEffect, useState } from 'react';
import Header from '../Header.jsx';
import AuctionCarousel from './AuctionCarousel.jsx';
import axios from '../../api/axios';

function getThisSaturday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);
  return saturday;
}

const Auction = () => {
  const [scheduledItems, setScheduledItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 이번 주 토요일에 시작하는 경매 예정 상품 3개만 가져오기
    const fetchScheduled = async () => {
      try {
        const res = await axios.get('/auctions/list');
        const saturday = getThisSaturday();
        // SCHEDULED 상품 중 이번 주 토요일에 시작하는 것만
        const filtered = res.data
          .filter(item => {
            if (item.auction_status !== 'SCHEDULED') return false;
            const itemDate = new Date(item.start_time);
            return (
              itemDate.getFullYear() === saturday.getFullYear() &&
              itemDate.getMonth() === saturday.getMonth() &&
              itemDate.getDate() === saturday.getDate()
            );
          })
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

  // 이번 주 토요일 날짜 텍스트
  const saturday = getThisSaturday();
  const saturdayText = `${saturday.getFullYear()}년 ${saturday.getMonth() + 1}월 ${saturday.getDate()}일(토)`;

  return (
    <>
      <Header />
      <div style={{ marginTop: 32 }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.4rem', marginBottom: 18 }}>
          {saturdayText} 경매 예정 상품
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

