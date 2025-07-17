import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header.jsx';
import AuctionCarousel from './AuctionCarousel.jsx';
import axios from '../../api/axios';

const Auction = () => {
  const navigate = useNavigate();
  const [scheduledItems, setScheduledItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberMileage, setMemberMileage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // 중복 요청 방지 (컴포넌트 생명주기 동안 유지)
  const hasFetchedScheduled = useRef(false);
  const hasFetchedMileage = useRef(false);
  
  // 전역 중복 방지 (페이지 새로고침 시에만 초기화)
  if (!window.__auctionFetched) {
    window.__auctionFetched = { scheduled: false, mileage: false };
  }

  useEffect(() => {
    // 이미 요청했다면 중복 방지 (로컬 + 전역 체크)
    if (hasFetchedScheduled.current || window.__auctionFetched.scheduled) {
      console.log('⚠️ 이미 경매 목록을 요청했습니다. 중복 방지.');
      return;
    }
    
    // SCHEDULED와 ACTIVE 상태인 경매 상품을 예정일 순서대로 3개 가져오기
    const fetchScheduled = async () => {
      try {
        hasFetchedScheduled.current = true;
        window.__auctionFetched.scheduled = true;
        console.log('📡 경매 목록 요청 시작...');
        const res = await axios.get('/auctions/list');
        console.log('API 응답:', res.data); // 추가
        // SCHEDULED와 ACTIVE 상품 필터링하고 예정일 순서대로 정렬
        const filtered = res.data
          .filter(item => item.auction_status === 'SCHEDULED' || item.auction_status === 'ACTIVE')
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .slice(0, 3);
        console.log('필터링 후:', filtered); // 추가
        setScheduledItems(filtered);
      } catch (err) {
        setScheduledItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchScheduled();
  }, []);

  // 마일리지 조회
  useEffect(() => {
    // 이미 요청했다면 중복 방지 (로컬 + 전역 체크)
    if (hasFetchedMileage.current || window.__auctionFetched.mileage) {
      console.log('⚠️ 이미 마일리지를 요청했습니다. 중복 방지.');
      return;
    }
    
    const fetchMileage = async () => {
      try {
        hasFetchedMileage.current = true;
        window.__auctionFetched.mileage = true;
        console.log('💰 마일리지 요청 시작...');
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('/orders/my-orders', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setMemberMileage(response.data.memberMileage ?? 0);
        }
      } catch (err) {
        console.log('마일리지 조회 실패:', err);
        setMemberMileage(0);
      }
    };
    fetchMileage();
  }, []);

  useEffect(() => {
    console.log('렌더링 시점 scheduledItems:', scheduledItems);
  }, [scheduledItems]);

  // 마일리지 포맷팅 함수
  const formatPrice = (price) => {
    return price?.toLocaleString('ko-KR') || '0';
  };

  // 입찰내역 페이지로 이동
  const handleBidHistoryClick = () => {
    navigate('/shop/my-auction-history');
  };

  return (
    <>
      <Header />
      <div style={{ marginTop: 32 }}>
        {loading ? (
          <div style={{ textAlign: 'center', margin: '60px 0', fontSize: '1.2rem' }}>로딩 중...</div>
        ) : scheduledItems.length === 0 ? (
          <div style={{ textAlign: 'center', margin: '60px 0' }}>
            <img
              src={process.env.PUBLIC_URL + '/images/empty-auction.png'}
              alt="경매 없음"
              style={{ width: 480, maxWidth: '98vw', opacity: 0.98 }}
            />
          </div>
        ) : (
          <AuctionCarousel items={scheduledItems} />
        )}
      </div>
      
      {/* 로그인한 사용자에게만 플로팅 위젯 표시 */}
      {localStorage.getItem('token') && (
        <>
          {/* 입찰내역 플로팅 버튼 */}
          <div 
            style={{
              position: 'fixed',
              right: '3rem',
              bottom: '7rem', 
              background: '#223A5E',
              color: '#fff',
              borderRadius: '1.2rem',
              padding: isHovered ? '0.5rem 1.2rem' : '0.5rem',
              boxShadow: '0 2px 12px #0002',
              zIndex: 1000,
              fontWeight: 700,
              fontSize: '0.98rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              minWidth: isHovered ? 'auto' : '2.5rem',
              justifyContent: isHovered ? 'flex-start' : 'center',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleBidHistoryClick}
          >
            {isHovered ? (
              <>
                <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>+</span>
                내 입찰내역
              </>
            ) : (
              <span style={{ fontSize: '1.2rem' }}>+</span>
            )}
          </div>
          
          {/* 오른쪽 상단 플로팅 마일리지 위젯 */}
          <div style={{
            position: 'fixed',
            right: '3rem',
            top: '15rem',
            background: '#FFB300',
            color: '#223A5E',
            borderRadius: '1.2rem',
            padding: '0.5rem 1rem',
            boxShadow: '0 2px 12px #0002',
            zIndex: 1000,
            fontWeight: 700,
            fontSize: '0.98rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="#223A5E" style={{marginRight: '0.7rem', verticalAlign: 'middle'}}>
              <circle cx="8" cy="12" r="3.2" />
              <circle cx="24" cy="12" r="3.2" />
              <circle cx="16" cy="8.5" r="3.5" />
              <ellipse cx="12.5" cy="21" rx="4.2" ry="5.2" />
              <ellipse cx="19.5" cy="21" rx="4.2" ry="5.2" />
            </svg>
            내 마일리지: {formatPrice(memberMileage)}P
          </div>
        </>
      )}
    </>
  );
};

export default Auction;

