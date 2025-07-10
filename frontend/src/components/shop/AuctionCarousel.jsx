import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { CompatClient, Stomp } from '@stomp/stompjs';
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
  const cardItems = [items[leftIdx], items[centerIdx], items[rightIdx]];

  // 화살표 클릭
  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + itemCount) % itemCount);
  };
  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % itemCount);
  };

  return (
    <div className="auction-carousel-root">
      <button className="carousel-arrow left" onClick={handlePrev}>&lt;</button>
      <div className="carousel-cards-flex">
        {/* 왼쪽 카드 */}
        <div className="carousel-card side left">
          <AuctionCard item={cardItems[0]} currentTime={currentTime} />
        </div>
        {/* 가운데 카드 - 플립 효과 */}
        <div className="carousel-card center flip-card">
          <div className="flip-card-inner">
            <div className="flip-card-front">
              <AuctionCard item={cardItems[1]} currentTime={currentTime} />
            </div>
            <div className="flip-card-back">
              <AuctionCard item={cardItems[1]} isBack={true} currentTime={currentTime} />
            </div>
          </div>
        </div>
        {/* 오른쪽 카드 */}
        <div className="carousel-card side right">
          <AuctionCard item={cardItems[2]} currentTime={currentTime} />
        </div>
      </div>
      <button className="carousel-arrow right" onClick={handleNext}>&gt;</button>
    </div>
  );
};

function AuctionCard({ item, isBack, currentTime }) {
  const [isEntered, setIsEntered] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const navigate = useNavigate();
  
  if (!item) return null;

  // 경매 시작 시간과 현재 시간 비교
  const isAuctionStarted = () => {
    if (!item.start_time) return false;
    const startTime = new Date(item.start_time);
    return currentTime >= startTime;
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

  // WebSocket 연결 및 경매 세션 입장
  const handleEnterAuction = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // 1. 먼저 경매 세션이 존재하는지 확인
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

      const sessionData = await sessionResponse.json();
      console.log('✅ 경매 세션 확인:', sessionData);

      // 2. WebSocket 연결
      const socket = new SockJS(`/ws/auction?token=${token}`);
      const client = Stomp.over(socket);

      client.connect(
        { Authorization: `Bearer ${token}` },
        () => {
          console.log('✅ 경매 WebSocket 연결 성공');
          
          // 3. 경매 세션 참여 메시지 전송
          client.send('/app/auction.join', {}, item.auction_item_id);
          
          // 4. 경매 업데이트 구독
          client.subscribe(`/topic/auction/${sessionData.sessionKey}`, (message) => {
            const data = JSON.parse(message.body);
            console.log('📨 경매 업데이트:', data);
            
            // 입찰 정보 업데이트 등 처리
            if (data.type === 'BID_SUCCESS') {
              console.log('새로운 입찰:', data.bid);
            }
          });
          
          // 5. 개별 알림 구독
          const memberId = localStorage.getItem('memberId');
          if (memberId) {
            client.subscribe(`/queue/auction/${memberId}`, (message) => {
              const data = JSON.parse(message.body);
              console.log('📨 개별 알림:', data);
            });
          }
          
          setStompClient(client);
          setIsEntered(true);
          
          // 6. 경매방 페이지로 이동
          navigate(`/auction/${item.auction_item_id}`);
        },
        (error) => {
          console.error('❌ 경매 WebSocket 연결 실패:', error);
          alert('경매 입장에 실패했습니다.');
        }
      );
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
        <div className="auction-card-title">{item.itemName}</div>
        <div className="auction-card-price">시작가: {item.start_price}P</div>
        {item.start_time && (
          <div className="auction-card-date">{item.start_time.slice(0, 16).replace('T', ' ')} OPEN</div>
        )}
        {isBack && item.auction_description && (
          <div style={{ marginTop: 12, color: '#444', fontSize: '1rem' }}>{item.auction_description}</div>
        )}
        {isBack && (
          <div style={{ marginTop: 12 }}>
            {!auctionStarted && timeUntilStart && (
              <div style={{ 
                color: '#ff6b6b', 
                fontSize: '0.9rem', 
                marginBottom: 8,
                textAlign: 'center'
              }}>
                경매 시작까지: {timeUntilStart}
              </div>
            )}
            <button 
              className={`auction-enter-btn ${!auctionStarted || isEntered ? 'disabled' : ''}`}
              onClick={() => {
                if (auctionStarted && !isEntered) {
                  handleEnterAuction();
                }
              }}
              disabled={!auctionStarted || isEntered}
            >
              {!auctionStarted ? '경매 대기중' : 
               isEntered ? '입장 완료' : '경매 입장'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuctionCarousel;
