import React, { useState, useEffect } from 'react';
import './AuctionCarousel.css';
import { useNavigate } from 'react-router-dom';

const AuctionCarousel = ({ items = [] }) => {
  const [current, setCurrent] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const itemCount = items.length;

  // 현재 시간 업데이트 (1초마다)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 이미지 프리로드
  useEffect(() => {
    if (itemCount < 2) return;
    const preloadIdx = (current + 1) % itemCount;
    if (items[preloadIdx]?.thumbnailUrl) {
      const img = new window.Image();
      img.src = items[preloadIdx].thumbnailUrl;
    }
    const prevIdx = (current - 1 + itemCount) % itemCount;
    if (items[prevIdx]?.thumbnailUrl) {
      const img = new window.Image();
      img.src = items[prevIdx].thumbnailUrl;
    }
  }, [current, items, itemCount]);

  // 보여줄 3개 인덱스(왼쪽, 가운데, 오른쪽)
  const getIndices = () => {
    if (itemCount < 3) {
      return [current, (current + 1) % itemCount, (current + 2) % itemCount];
    }
    const left = (current - 1 + itemCount) % itemCount;
    const right = (current + 1) % itemCount;
    return [left, current, right];
  };
  const [leftIdx, centerIdx, rightIdx] = getIndices();

  // 화살표 클릭
  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + itemCount) % itemCount);
  };
  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % itemCount);
  };

  return (
    <div className="auction-carousel-root">
      {itemCount >= 2 && (
        <button className="carousel-arrow left" onClick={handlePrev}>&lt;</button>
      )}
      <div className="carousel-cards-flex">
        {itemCount >= 3 ? (
          // 3개 이상일 때만 캐러셀 방식
          <>
            <div className="carousel-card side left">
              <AuctionCard item={items[leftIdx]} currentTime={currentTime} />
            </div>
            <div className="carousel-card center flip-card">
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <AuctionCard item={items[centerIdx]} currentTime={currentTime} />
                </div>
                <div className="flip-card-back">
                  <AuctionCard item={items[centerIdx]} isBack={true} currentTime={currentTime} />
                </div>
              </div>
            </div>
            <div className="carousel-card side right">
              <AuctionCard item={items[rightIdx]} currentTime={currentTime} />
            </div>
          </>
        ) : itemCount === 2 ? (
          // 2개일 때도 캐러셀처럼 current 인덱스에 따라 카드가 넘어가도록
          <>
            <div className="carousel-card center flip-card">
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <AuctionCard item={items[current]} currentTime={currentTime} />
                </div>
                <div className="flip-card-back">
                  <AuctionCard item={items[current]} isBack={true} currentTime={currentTime} />
                </div>
              </div>
            </div>
            <div className="carousel-card right">
              <AuctionCard item={items[(current + 1) % 2]} currentTime={currentTime} />
            </div>
          </>
        ) : (
          // 1개일 때만 기존 map 사용
          items.map((item, idx) => {
            return (
              <div className="carousel-card center flip-card" key={item.auction_item_id}>
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <AuctionCard item={item} currentTime={currentTime} />
                  </div>
                  <div className="flip-card-back">
                    <AuctionCard item={item} isBack={true} currentTime={currentTime} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {itemCount >= 2 && (
        <button className="carousel-arrow right" onClick={handleNext}>&gt;</button>
      )}
      
      {/* 캐릭터 일러스트 */}
      <div className="character-illustrations">
        <img 
          src="/images/zzazan-dog.png" 
          alt="강아지 캐릭터" 
          className="character-illustration left-character"
        />
        <img 
          src="/images/zzazan-cat.png" 
          alt="고양이 캐릭터" 
          className="character-illustration right-character"
        />
      </div>
    </div>
  );
};

function AuctionCard({ item, isBack, currentTime }) {
  const navigate = useNavigate();
  
  if (!item) return null;

  // 경매 시작 시간과 현재 시간 비교
  const isAuctionStarted = () => {
    if (!item.start_time) return false;
    const startTime = new Date(item.start_time);
    const isStarted = currentTime >= startTime;
    
    // 디버깅용 로그
    console.log('경매 시간 체크:', {
      itemName: item.itemName,
      startTime: item.start_time,
      parsedStartTime: startTime,
      currentTime: currentTime,
      isStarted: isStarted
    });
    
    return isStarted;
  };

  // 경매 시작까지 남은 시간 계산
  const getTimeUntilStart = () => {
    if (!item.start_time) return null;
    const startTime = new Date(item.start_time);
    const timeDiff = startTime - currentTime;
    
    if (timeDiff <= 0) return null;
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    if (minutes > 0) return `${minutes}분 ${seconds}초`;
    return `${seconds}초`;
  };

  const auctionStarted = isAuctionStarted();
  const timeUntilStart = getTimeUntilStart();

  // 경매 입장 처리
  const handleEnterAuction = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // 경매 세션 존재 여부만 빠르게 확인
      const sessionResponse = await fetch(`/api/auction/sessions/auction/${item.auction_item_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!sessionResponse.ok) {
        alert('경매 세션이 생성되지 않았습니다. 관리자에게 문의해주세요.');
        return;
      }

      // 즉시 경매방 페이지로 이동 (WebSocket 연결은 AuctionRoom에서 처리)
      navigate(`/auction/${item.auction_item_id}`);
    } catch (error) {
      console.error('❌ 경매 세션 확인 실패:', error);
      alert('경매 입장에 실패했습니다.');
    }
  };

  return (
    <div className="auction-card-content">
      {item.thumbnailUrl && !isBack && (
        <img src={item.thumbnailUrl} alt="썸네일" className="auction-card-img" />
      )}
      <div className="auction-card-info">
        <div className="auction-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="#fff" style={{ flexShrink: 0 }}>
            <circle cx="8" cy="12" r="3.2" />
            <circle cx="24" cy="12" r="3.2" />
            <circle cx="16" cy="8.5" r="3.5" />
            <ellipse cx="12.5" cy="21" rx="4.2" ry="5.2" />
            <ellipse cx="19.5" cy="21" rx="4.2" ry="5.2" />
          </svg>
          {item.itemName}
        </div>
        {!isBack && item.start_time && (
          <div className="auction-card-date">{item.start_time.slice(0, 16).replace('T', ' ')} OPEN</div>
        )}
        {isBack && (
          <>
            <div className="auction-card-price">경매 시작가: {item.start_price}P</div>
            {item.auction_description && (
              <div style={{ marginTop: 12, color: '#fff', fontSize: '1rem' }}>{item.auction_description}</div>
            )}
            <div style={{ marginTop: 20 }}>
              {!auctionStarted && timeUntilStart && (
                <div style={{ 
                  color: '#FFB300', 
                  fontSize: '0.9rem', 
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  경매 OPEN 까지: {timeUntilStart}
                </div>
              )}
              {/* 안내 문구 */}
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#223A5E', 
                textAlign: 'center',
                lineHeight: '1.4',
                marginBottom: 12,
                padding: '12px 8px',
                backgroundColor: '#FFB300',
                borderRadius: '8px',
                fontWeight: 500
              }}>
                본 경매는 마일리지로만 참여하실 수 있으며,<br />
                경매 종료 시 최고 입찰자의 마일리지는 자동으로 차감됩니다.<br />
                ※낙찰 거부와 마일리지 환불이 불가하니<br />
                신중한 참여 부탁드립니다.
              </div>
              <button 
                className={`auction-enter-btn ${!auctionStarted ? 'disabled' : ''}`}
                onClick={() => {
                  if (auctionStarted) {
                    handleEnterAuction();
                  }
                }}
                disabled={!auctionStarted}
              >
                {!auctionStarted ? '경매 대기중' : '경매 입장'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AuctionCarousel;
