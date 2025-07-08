import React, { useState, useEffect } from 'react';
import './AuctionCarousel.css';

const AuctionCarousel = ({ items = [] }) => {
  const [current, setCurrent] = useState(0);
  const itemCount = items.length;

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
          <AuctionCard item={cardItems[0]} />
        </div>
        {/* 가운데 카드 - 플립 효과 */}
        <div className="carousel-card center flip-card">
          <div className="flip-card-inner">
            <div className="flip-card-front">
              <AuctionCard item={cardItems[1]} />
            </div>
            <div className="flip-card-back">
              <AuctionCard item={cardItems[1]} isBack={true} />
            </div>
          </div>
        </div>
        {/* 오른쪽 카드 */}
        <div className="carousel-card side right">
          <AuctionCard item={cardItems[2]} />
        </div>
      </div>
      <button className="carousel-arrow right" onClick={handleNext}>&gt;</button>
    </div>
  );
};

function AuctionCard({ item, isBack }) {
  if (!item) return null;
  return (
    <div className="auction-card-content">
      {item.thumbnailUrl && !isBack && (
        <img src={item.thumbnailUrl} alt="썸네일" className="auction-card-img" />
      )}
      <div className="auction-card-info">
        <div className="auction-card-title">{item.itemName}</div>
        <div className="auction-card-price">시작가: {item.start_price}P</div>
        {item.start_time && (
          <div className="auction-card-date">{item.start_time.slice(0, 16).replace('T', ' ')} 경매 시작</div>
        )}
        {isBack && item.auction_description && (
          <div style={{ marginTop: 12, color: '#444', fontSize: '1rem' }}>{item.auction_description}</div>
        )}
        {isBack && (
          <button className="auction-enter-btn" onClick={() => alert('경매 입장!')}>
            경매 입장
          </button>
        )}
      </div>
    </div>
  );
}

export default AuctionCarousel; 