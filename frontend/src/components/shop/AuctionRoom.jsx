import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import Header from '../Header.jsx';

const AuctionRoom = () => {
  const { auctionItemId } = useParams();
  const [item, setItem] = useState(null);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [userMileage, setUserMileage] = useState(0);
  const [bidHistory, setBidHistory] = useState([]);
  const navigate = useNavigate();

  // 스타일 정의
  const styles = {
    root: { padding: '24px' },
    header: { display: 'flex', alignItems: 'center', marginBottom: '16px' },
    backButton: { 
      marginRight: '16px', 
      background: '#eee', 
      border: 'none', 
      padding: '6px 12px', 
      borderRadius: '4px', 
      cursor: 'pointer' 
    },
    title: { fontSize: '1.5rem', fontWeight: 'bold' },
    main: { maxWidth: '600px', margin: '0 auto' },
    coreInfo: { display: 'flex', gap: '24px', marginBottom: '16px' },
    img: { 
      width: '160px', 
      height: '160px', 
      objectFit: 'cover', 
      borderRadius: '8px', 
      background: '#f5f5f5' 
    },
    infoBlock: { flex: 1 },
    itemName: { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' },
    accordion: { marginTop: '24px' },
    accordionToggle: { 
      background: '#eee', 
      border: 'none', 
      padding: '8px 16px', 
      cursor: 'pointer', 
      borderRadius: '4px', 
      fontSize: '1rem' 
    },
    accordionContent: { 
      background: '#fafafa', 
      border: '1px solid #ddd', 
      borderRadius: '4px', 
      padding: '16px', 
      marginTop: '8px' 
    },
    section: { marginBottom: '16px' },
    connectionStatus: {
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '0.9rem',
      marginBottom: '12px'
    },
    bidSection: {
      marginTop: '24px',
      padding: '20px',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    },
    bidForm: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      marginBottom: '16px'
    },
    bidInput: {
      flex: 1,
      padding: '8px 12px',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      fontSize: '1rem'
    },
    bidButton: {
      padding: '8px 16px',
      background: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: 'bold'
    },
    bidButtonDisabled: {
      background: '#6c757d',
      cursor: 'not-allowed'
    },
    bidInfo: {
      fontSize: '0.9rem',
      color: '#6c757d',
      marginTop: '8px'
    }
  };

  useEffect(() => {
    // 상품 상세 정보 fetch
    fetch(`/api/auctions/${auctionItemId}`)
      .then(res => res.json())
      .then(data => setItem(data))
      .catch(err => console.error('상품 정보 조회 실패:', err));
  }, [auctionItemId]);

  // 사용자 마일리지 정보 가져오기
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/members/mileage', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('마일리지 조회 실패');
      })
      .then(data => {
        console.log('💰 사용자 마일리지:', data);
        setUserMileage(data.mileage || 0);
      })
      .catch(err => {
        console.error('마일리지 조회 실패:', err);
        setUserMileage(0);
      });
  }, []);

  // 입찰 기록 가져오기
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !auctionItemId) return;

    fetch(`/api/auction/bids/${auctionItemId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('입찰 기록 조회 실패');
      })
      .then(data => {
        console.log('📊 입찰 기록:', data);
        setBidHistory(data || []);
      })
      .catch(err => {
        console.error('입찰 기록 조회 실패:', err);
        setBidHistory([]);
      });
  }, [auctionItemId]);

  // WebSocket 연결
  useEffect(() => {
    const connectWebSocket = async () => {
      console.log('🚀 경매방 WebSocket 연결 시작...');
      console.log('📍 경매 상품 ID:', auctionItemId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ 토큰이 없습니다. 로그인이 필요합니다.');
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }
      console.log('✅ 토큰 확인 완료');

      try {
        // 1. 경매 세션 정보 가져오기
        console.log('🔍 경매 세션 정보 조회 중...');
        const sessionResponse = await fetch(`/api/auction/sessions/auction/${auctionItemId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!sessionResponse.ok) {
          console.error('❌ 경매 세션 조회 실패:', sessionResponse.status, sessionResponse.statusText);
          alert('경매 세션이 생성되지 않았습니다.');
          navigate(-1);
          return;
        }

        const session = await sessionResponse.json();
        setSessionData(session);
        console.log('✅ 경매 세션 확인 완료:', session);
        console.log('🔑 세션 키:', session.sessionKey);

        // 2. WebSocket 연결
        console.log('🔌 WebSocket 연결 시도 중...');
        const socket = new SockJS(`/ws/auction?token=${token}`);
        const client = Stomp.over(socket);

        client.connect(
          { Authorization: `Bearer ${token}` },
          () => {
            console.log('✅ 경매방 WebSocket 연결 성공!');
            console.log('📡 STOMP 클라이언트 상태:', client.connected ? '연결됨' : '연결 안됨');
            setIsConnected(true);
            
            // 3. 경매 세션 참여 메시지 전송
            console.log('👋 경매 세션 참여 메시지 전송:', auctionItemId);
            client.send('/app/auction.join', {}, auctionItemId);
            
            // 4. 경매 업데이트 구독
            const topicUrl = `/topic/auction/${session.sessionKey}`;
            console.log('📡 경매 업데이트 구독:', topicUrl);
            client.subscribe(topicUrl, (message) => {
              const data = JSON.parse(message.body);
              console.log('📨 경매 업데이트 수신:', data);
              
              // 입찰 정보 업데이트 등 처리
              if (data.type === 'BID_SUCCESS') {
                console.log('💰 새로운 입찰:', data.bid);
                // 입찰 기록에 새로운 입찰 추가
                setBidHistory(prev => [data.bid, ...prev]);
              }
            });
            
            // 5. 개별 알림 구독
            const memberId = localStorage.getItem('memberId');
            if (memberId) {
              const queueUrl = `/queue/auction/${memberId}`;
              console.log('📡 개별 알림 구독:', queueUrl);
              client.subscribe(queueUrl, (message) => {
                const data = JSON.parse(message.body);
                console.log('📨 개별 알림 수신:', data);
              });
            } else {
              console.warn('⚠️ memberId가 없어서 개별 알림 구독을 건너뜁니다.');
            }
            
            setStompClient(client);
            console.log('🎉 경매방 WebSocket 설정 완료!');
          },
          (error) => {
            console.error('❌ 경매방 WebSocket 연결 실패:', error);
            console.error('🔍 연결 실패 상세 정보:', {
              auctionItemId,
              hasToken: !!token,
              errorMessage: error.message
            });
            alert('경매방 연결에 실패했습니다.');
          }
        );
      } catch (error) {
        console.error('❌ 경매 세션 확인 실패:', error);
        console.error('🔍 오류 상세 정보:', {
          auctionItemId,
          errorMessage: error.message,
          errorStack: error.stack
        });
        alert('경매방 입장에 실패했습니다.');
      }
    };

    if (auctionItemId) {
      console.log('🎯 경매방 컴포넌트 마운트됨, WebSocket 연결 시작');
      connectWebSocket();
    } else {
      console.warn('⚠️ auctionItemId가 없어서 WebSocket 연결을 건너뜁니다.');
    }

    // 컴포넌트 언마운트 시 WebSocket 연결 해제
    return () => {
      if (stompClient) {
        console.log('🔌 WebSocket 연결 해제 중...');
        stompClient.disconnect();
        console.log('✅ WebSocket 연결 해제 완료');
      } else {
        console.log('ℹ️ 해제할 WebSocket 연결이 없습니다.');
      }
    };
  }, [auctionItemId, navigate]);

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

  // 실시간 남은 시간 갱신을 위한 state
  const [timeLeft, setTimeLeft] = useState('');

  // 1초마다 남은 시간 갱신
  useEffect(() => {
    if (!item?.end_time) {
      setTimeLeft('-');
      return;
    }

    const updateTime = () => {
      const end = new Date(item.end_time);
      const now = new Date();
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeLeft('경매 종료');
        return;
      }
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}시간 ${m}분 ${s}초`);
    };

    // 초기 실행
    updateTime();
    
    // 1초마다 갱신
    const interval = setInterval(updateTime, 1000);

    // 컴포넌트 언마운트 시 interval 정리
    return () => clearInterval(interval);
  }, [item?.end_time]);

  // 입찰 처리 함수
  const handleBid = async () => {
    if (!bidAmount || !stompClient || !isConnected) {
      alert('입찰 금액을 입력해주세요.');
      return;
    }

    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('올바른 입찰 금액을 입력해주세요.');
      return;
    }

    // 마일리지 잔액 확인
    if (amount > userMileage) {
      alert(`보유 마일리지가 부족합니다. 현재 보유: ${userMileage}P, 필요: ${amount}P`);
      return;
    }

    // 최소 입찰 단위 확인
    if (amount < (item.current_price || item.start_price) + (item.bid_unit || 100)) {
      alert(`최소 입찰 금액은 ${(item.current_price || item.start_price) + (item.bid_unit || 100)}P입니다.`);
      return;
    }

    setIsBidding(true);
    
    try {
      console.log('💰 입찰 시도:', amount);
      
      // WebSocket을 통해 입찰 메시지 전송
      stompClient.send('/app/auction.bid', {}, JSON.stringify({
        auctionItemId: auctionItemId,
        bidAmount: amount,
        memberId: localStorage.getItem('memberId')
      }));
      
      setBidAmount('');
      console.log('✅ 입찰 메시지 전송 완료');
      
    } catch (error) {
      console.error('❌ 입찰 실패:', error);
      alert('입찰에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsBidding(false);
    }
  };

  // 최소 입찰 금액 계산
  const getMinBidAmount = () => {
    const currentPrice = item?.current_price || item?.start_price || 0;
    const bidUnit = item?.bid_unit || 100;
    return currentPrice + bidUnit;
  };

  if (!item) return <div>로딩 중...</div>;

  return (
    <>
      <Header />
      <div style={styles.root}>
        <header style={styles.header}>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            &lt; 뒤로가기
          </button>
          <h2 style={styles.title}>실시간 경매방</h2>
        </header>
        <div style={styles.main}>
          {/* 연결 상태 표시 */}
          <div style={{
            ...styles.connectionStatus,
            background: isConnected ? '#d4edda' : '#f8d7da',
            color: isConnected ? '#155724' : '#721c24'
          }}>
            {isConnected ? '🟢 실시간 연결됨' : '🔴 연결 중...'}
          </div>

          {/* 핵심 정보 상단 노출 */}
          <div style={styles.coreInfo}>
            <img 
              src={item.thumbnailUrl} 
              alt="상품 이미지" 
              style={styles.img}
            />
            <div style={styles.infoBlock}>
              <div style={styles.itemName}>{item.itemName}</div>
              <div>경매 시작가: <b>{item.start_price}P</b></div>
              <div>현재 가격: <b>{item.current_price}P</b></div>
              <div>입찰 최소 단위: <b>{item.bid_unit}P</b></div>
              <div>남은 시간: <b>{timeLeft}</b></div>
              <div>경매 시작: {item.start_time?.slice(0,16).replace('T',' ')}</div>
              <div>경매 종료: {item.end_time?.slice(0,16).replace('T',' ')}</div>
            </div>
          </div>

          {/* 입찰 섹션 */}
          {isConnected && (
            <div style={styles.bidSection}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>💰 마일리지 입찰하기</h3>
              
              {/* 마일리지 정보 */}
              <div style={{
                padding: '12px',
                background: '#e3f2fd',
                borderRadius: '4px',
                marginBottom: '16px',
                border: '1px solid #2196f3'
              }}>
                <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                  💎 내 보유 마일리지: <span style={{ fontSize: '1.1rem' }}>{userMileage.toLocaleString()}P</span>
                </div>
              </div>

              <div style={styles.bidForm}>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`최소 ${getMinBidAmount()}P`}
                  style={styles.bidInput}
                  min={getMinBidAmount()}
                  max={userMileage}
                  step={item?.bid_unit || 100}
                />
                <button
                  onClick={handleBid}
                  disabled={!isConnected || isBidding || !bidAmount || parseInt(bidAmount) > userMileage}
                  style={{
                    ...styles.bidButton,
                    ...((!isConnected || isBidding || !bidAmount || parseInt(bidAmount) > userMileage) && styles.bidButtonDisabled)
                  }}
                >
                  {isBidding ? '입찰 중...' : '입찰하기'}
                </button>
              </div>
              <div style={styles.bidInfo}>
                <div>• 현재 가격: <b>{item.current_price || item.start_price}P</b></div>
                <div>• 최소 입찰 단위: <b>{item.bid_unit || 100}P</b></div>
                <div>• 최소 입찰 금액: <b>{getMinBidAmount()}P</b></div>
                <div>• 보유 마일리지: <b>{userMileage.toLocaleString()}P</b></div>
                {parseInt(bidAmount) > userMileage && (
                  <div style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    ⚠️ 보유 마일리지가 부족합니다!
                  </div>
                )}
              </div>
            </div>
          )}
          {/* 아코디언(토글) 영역 */}
          <div style={styles.accordion}>
            <button style={styles.accordionToggle} onClick={() => setAccordionOpen(o => !o)}>
              {accordionOpen ? '▼ 상세 정보 닫기' : '▶ 상세 정보 보기'}
            </button>
            {accordionOpen && (
              <div style={styles.accordionContent}>
                {/* 입찰 내역 */}
                <div style={styles.section}>
                  <b>📊 입찰 내역 ({bidHistory.length}건)</b>
                  {bidHistory.length > 0 ? (
                    <div style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      marginTop: '8px'
                    }}>
                      {bidHistory.map((bid, index) => (
                        <div key={index} style={{
                          padding: '8px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          background: '#f9f9f9'
                        }}>
                          <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                            {bid.bidderName || '익명'} - {bid.bidAmount?.toLocaleString()}P
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            {new Date(bid.bidTime).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                      아직 입찰 기록이 없습니다.
                    </div>
                  )}
                </div>

                {/* 참여자 수 */}
                <div style={styles.section}>
                  <b>👥 참여자 수</b>: {new Set(bidHistory.map(bid => bid.bidderId)).size}명
                </div>

                {/* 내 입찰 정보 */}
                <div style={styles.section}>
                  <b>💎 내 입찰 정보</b>
                  {(() => {
                    const myBids = bidHistory.filter(bid => 
                      bid.bidderId === parseInt(localStorage.getItem('memberId'))
                    );
                    const myHighestBid = myBids.length > 0 ? 
                      Math.max(...myBids.map(bid => bid.bidAmount)) : 0;
                    
                    return (
                      <div>
                        <div>내 최고 입찰가: <b>{myHighestBid.toLocaleString()}P</b></div>
                        <div>내 입찰 횟수: <b>{myBids.length}회</b></div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuctionRoom;
