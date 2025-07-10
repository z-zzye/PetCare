import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AuctionRoom.css';

const AuctionRoom = () => {
  const { auctionItemId } = useParams();
  const [item, setItem] = useState(null);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 상품 상세 정보 fetch
    fetch(`/api/auction/items/${auctionItemId}`)
      .then(res => res.json())
      .then(data => setItem(data))
      .catch(err => console.error('상품 정보 조회 실패:', err));
  }, [auctionItemId]);

  // 남은 시간 계산
  const getTimeLeft = () => {
    if (!item?.end_time) return '-';
    const end = new Date(item.end_time);
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return '경매 종료';
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h}시간 ${m}분 ${s}초`;
  };

  if (!item) return <div>로딩 중...</div>;

  return (
    <div className="auction-room-root">
      <header className="auction-room-header">
        <button className="auction-room-back" onClick={() => navigate(-1)}>
          &lt; 뒤로가기
        </button>
        <h2 className="auction-room-title">실시간 경매방</h2>
      </header>
      <div className="auction-room-main">
        {/* 핵심 정보 상단 노출 */}
        <div className="auction-room-core-info">
          <img src={item.thumbnailUrl} alt="상품 이미지" className="auction-room-img" />
          <div className="auction-room-info-block">
            <div className="auction-room-item-name">{item.itemName}</div>
            <div>경매 시작가: <b>{item.start_price}P</b></div>
            <div>현재 가격: <b>{item.current_price}P</b></div>
            <div>입찰 최소 단위: <b>{item.bid_unit}P</b></div>
            <div>남은 시간: <b>{getTimeLeft()}</b></div>
            <div>경매 시작: {item.start_time?.slice(0,16).replace('T',' ')}</div>
            <div>경매 종료: {item.end_time?.slice(0,16).replace('T',' ')}</div>
          </div>
        </div>
        {/* 아코디언(토글) 영역 */}
        <div className="auction-room-accordion">
          <button className="accordion-toggle" onClick={() => setAccordionOpen(o => !o)}>
            {accordionOpen ? '▼ 상세 정보 닫기' : '▶ 상세 정보 보기'}
          </button>
          {accordionOpen && (
            <div className="accordion-content">
              {/* 입찰내역, 참여자수, 내 입찰정보 등은 실제 데이터 연동 필요 */}
              <div className="auction-room-section">
                <b>입찰 내역</b>
                <ul>
                  {/* 예시: 실제 입찰 내역 데이터로 대체 필요 */}
                  <li>홍길동 - 12,000P</li>
                  <li>김철수 - 11,500P</li>
                  <li>이영희 - 11,000P</li>
                </ul>
              </div>
              <div className="auction-room-section">
                <b>참여자 수</b>: 3명 {/* 실제 참여자 수로 대체 필요 */}
              </div>
              <div className="auction-room-section">
                <b>내 입찰 정보</b>
                <div>내 최고 입찰가: 12,000P</div> {/* 실제 내 입찰 정보로 대체 필요 */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionRoom;
