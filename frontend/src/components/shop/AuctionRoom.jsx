import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import Header from '../Header.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaGavel, FaPaw, FaPlay, FaStop, FaFlag, FaClock, FaChartBar, FaChartLine, FaUser, FaGem, FaTrophy, FaUsers } from 'react-icons/fa';
import './AuctionRoom.css';

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
  const [isMobile, setIsMobile] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const navigate = useNavigate();
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);
  const [isWinner, setIsWinner] = useState(null); // null: 미확인, true: 낙찰, false: 비낙찰
  const [myHistory, setMyHistory] = useState(null); // 내 히스토리 상태 추가
  
  // WebSocket 연결 상태 관리 (중복 연결 방지)
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const connectionAttempted = useRef(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 알림 권한 상태 체크
  useEffect(() => {
    setNotificationPermission(Notification.permission);
    
    // 권한 상태 변경 감지
    const handlePermissionChange = () => {
      setNotificationPermission(Notification.permission);
    };
    
    // 권한 상태 변경 이벤트 리스너 (일부 브라우저에서 지원)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then(permissionStatus => {
        permissionStatus.addEventListener('change', handlePermissionChange);
      });
    }
    
    return () => {
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'notifications' }).then(permissionStatus => {
          permissionStatus.removeEventListener('change', handlePermissionChange);
        });
      }
    };
  }, []);

  // 토스트 알림 권한 요청 함수
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        console.log('✅ 알림 권한 허용됨');
        showToast('🔔 알림 권한이 허용되었습니다!', 'success');
      } else {
        console.log('❌ 알림 권한 거부됨');
        showToast('알림 권한이 거부되었습니다. 설정에서 변경할 수 있습니다.', 'warning');
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      showToast('알림 권한 요청에 실패했습니다.', 'error');
    }
  };

  // 토스트 메시지 표시 함수 (클릭 가능)
  const showToast = (message, type = 'info', duration = 3000, onClick = null) => {
    const toast = document.createElement('div');
    toast.className = `toast ${type} ${onClick ? 'clickable' : ''}`;
    toast.textContent = message;
    
    // 클릭 이벤트 추가
    if (onClick) {
      toast.addEventListener('click', () => {
        onClick();
        // 클릭 시 즉시 제거
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      });
    }
    
    document.body.appendChild(toast);
    
    // 자동 제거 (클릭 가능한 토스트는 더 오래 표시)
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, duration);
  };

  // 브라우저 알림 보내기 함수
  const sendBrowserNotification = (title, options = {}) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'auction-notification', // 같은 알림 중복 방지
        requireInteraction: false,
        silent: false, // 소리 재생
        vibrate: [200, 100, 200], // 진동 패턴
        ...options
      });
      
      // 알림 클릭 시 경매방으로 이동
      notification.onclick = () => {
        window.focus();
        // 현재 경매방으로 이동
        window.location.href = `/auction/${auctionItemId}`;
        notification.close();
      };
      

      
      return notification;
    }
    return null;
  };



  useEffect(() => {
    // 상품 상세 정보 fetch
    const token = localStorage.getItem('token');
    fetch(`/api/auctions/${auctionItemId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('상품 정보 조회 실패');
      })
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

  // 경매 상태 및 내 낙찰 여부 fetch 함수
  const fetchAuctionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const sessionRes = await fetch(`/api/auction/sessions/auction/${auctionItemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!sessionRes.ok) return;
      const session = await sessionRes.json();
      setIsAuctionEnded(session.status === 'ENDED' || session.auctionItem?.status === 'SOLD');
      // 내 히스토리 fetch
      if (session.status === 'ENDED' || session.auctionItem?.status === 'SOLD') {
        const myHistoryRes = await fetch(`/api/auction/history/auction/${auctionItemId}/my`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (myHistoryRes.ok) {
          const myHistory = await myHistoryRes.json();
          setIsWinner(myHistory.winner);
          setMyHistory(myHistory); // 내 히스토리 상태 저장
        } else {
          setIsWinner(false);
          setMyHistory(null);
        }
      }
    } catch (e) {
      console.error('경매 상태 갱신 실패:', e);
    }
  };

  // WebSocket 연결
  useEffect(() => {
    // 이미 연결 시도를 했거나 연결 중이거나 참여한 경우 중복 연결 방지
    if (connectionAttempted.current || isConnecting || hasJoined) {
      console.log('⚠️ 이미 연결 시도했거나 연결 중이거나 참여 중입니다. 중복 연결 방지.');
      return;
    }

    const connectWebSocket = async () => {
      console.log('🔌 경매방 WebSocket 연결 시작...');
      console.log('📍 경매 상품 ID:', auctionItemId);
      
      setIsConnecting(true);
      connectionAttempted.current = true;
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ 토큰이 없습니다. 로그인이 필요합니다.');
        alert('로그인이 필요합니다.');
        navigate('/members/login');
        setIsConnecting(false);
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
          setIsConnecting(false);
          return;
        }

        const session = await sessionResponse.json();
        setSessionData(session);
        console.log('✅ 경매 세션 확인 완료:', session);
        console.log('🔑 세션 키:', session.sessionKey);
        
        // 경매 종료 상태 확인
        if (session.status === 'ENDED' || session.auctionItem?.status === 'SOLD') {
          setIsAuctionEnded(true);
          console.log('🏁 경매가 이미 종료된 상태입니다.');
        }

        // 2. WebSocket 연결
        console.log('🔌 WebSocket 연결 시도 중...');
        const socket = new SockJS(`http://localhost:80/ws/auction?token=${token}`);
        const client = Stomp.over(socket);

        client.connect(
          { Authorization: `Bearer ${token}` },
          () => {
            console.log('✅ 경매방 WebSocket 연결 성공!');
            console.log('📡 STOMP 클라이언트 상태:', client.connected ? '연결됨' : '연결 안됨');
            setIsConnected(true);
            
            // 3. 경매 세션 참여 메시지 전송
            if (!hasJoined) {
              console.log('👋 경매 세션 참여 메시지 전송:', auctionItemId);
              client.send('/app/auction.join', {}, auctionItemId);
              setHasJoined(true);
            }
            
            // 4. 경매 업데이트 구독
            const topicUrl = `/topic/auction/${session.sessionKey}`;
            console.log('📡 경매 업데이트 구독:', topicUrl);
            client.subscribe(topicUrl, (message) => {
              const data = JSON.parse(message.body);
              console.log('📨 경매 업데이트 수신:', data);
              
              // 입찰 정보 업데이트 등 처리
              if (data.type === 'BID_SUCCESS') {
                console.log('💰 새로운 입찰:', data.bid);
                // 입찰 기록에 새로운 입찰 추가 (중복 방지)
                setBidHistory(prev => {
                  if (prev.some(bid => bid.bidId === data.bid.bidId)) return prev;
                  return [data.bid, ...prev];
                });
                
                // 상품 정보 업데이트 (현재 가격)
                if (data.bid && data.bid.bidAmount) {
                  setItem(prev => prev ? {
                    ...prev,
                    current_price: data.bid.bidAmount
                  } : prev);
                }
                
                // 브라우저 알림: 상위 입찰 발생 시 (내가 입찰한 사용자가 아닌 경우)
                const currentMemberId = parseInt(localStorage.getItem('memberId'));
                if (data.bid && data.bid.memberId !== currentMemberId && document.visibilityState === 'hidden') {
                  sendBrowserNotification(
                    '🏆 새로운 입찰 발생!',
                    {
                      body: `${data.bid.memberNickname || '익명'}님이 ${data.bid.bidAmount.toLocaleString()}P로 입찰했습니다.`,
                      data: { auctionItemId, type: 'new_bid' }
                    }
                  );
                }
              } else if (data.type === 'AUCTION_END') {
                console.log('🏁 경매 종료 메시지 수신됨!');
                console.log('📨 받은 데이터:', data);
                console.log('🏁 경매 종료:', data.message);
                
                // 브라우저 알림을 먼저 실행 (다른 작업에 방해받지 않도록)
                console.log('🔍 경매 종료 알림 조건 확인:');
                console.log('- visibilityState:', document.visibilityState);
                console.log('- notificationPermission:', Notification.permission);
                console.log('- 브라우저 숨김 여부:', document.visibilityState === 'hidden');
                console.log('- Notification 객체 존재:', typeof Notification !== 'undefined');
                console.log('- sendBrowserNotification 함수 존재:', typeof sendBrowserNotification === 'function');
                
                if (document.visibilityState === 'hidden') {
                  console.log('📱 경매 종료 브라우저 알림 전송 시도');
                  const notification = sendBrowserNotification(
                    '🏁 경매 종료',
                    {
                      body: '경매가 종료되었습니다. 결과를 확인해보세요!',
                      data: { auctionItemId, type: 'auction_end' }
                    }
                  );
                  console.log('📱 경매 종료 알림 결과:', notification ? '성공' : '실패');
                } else {
                  console.log('📱 브라우저가 활성화되어 있어서 알림 전송 안함');
                }
                
                // 그 다음에 다른 작업들 실행
                setBidAmount(''); // 입찰 입력란 초기화
                fetchAuctionStatus(); // 상태 갱신
                
                // 서버에서 최신 낙찰 결과 조회 (내 히스토리만)
                const fetchMyHistory = async () => {
                  try {
                    const token = localStorage.getItem('token');
                    console.log('🔍 내 히스토리 조회 시작:', auctionItemId);
                    console.log('🔑 토큰 존재:', !!token);
                    
                    const response = await fetch(`/api/auction/history/auction/${auctionItemId}/my`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });

                    console.log('📡 히스토리 API 응답 상태:', response.status, response.statusText);

                    if (response.ok) {
                      const myHistory = await response.json();
                      setIsWinner(myHistory.winner);
                      setMyHistory(myHistory); // myHistory 상태에 저장
                      console.log('🏆 내 낙찰 여부:', myHistory.winner);
                      console.log('📊 내 히스토리:', myHistory);
                    } else {
                      setIsWinner(false);
                      setMyHistory(null);
                      console.log('❌ 내 히스토리 조회 실패:', response.status, response.statusText);
                      
                      // 응답 내용 확인
                      const errorText = await response.text();
                      console.log('📄 에러 응답 내용:', errorText);
                    }
                  } catch (error) {
                    setIsWinner(false);
                    console.error('❌ 내 히스토리 조회 중 예외 발생:', error);
                    console.error('🔍 에러 상세:', {
                      message: error.message,
                      stack: error.stack
                    });
                  }
                };

                fetchMyHistory();
                
                // 경매 종료 토스트 메시지
                showToast('🏁 경매가 종료되었습니다!', 'info', 5000);
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
                
                // 개별 알림 처리
                if (data.type === 'BID_SUCCESS') {
                  console.log('✅ 입찰 성공 알림:', data.message);
                  // 입찰 성공 시 마일리지는 차감되지 않으므로 새로고침 불필요
                } else if (data.type === 'AUCTION_WIN') {
                  console.log('🏆 낙찰 성공:', data.message);
                  
                  // 브라우저 알림: 낙찰 성공
                  if (document.visibilityState === 'hidden') {
                    sendBrowserNotification(
                      '🎉 낙찰 성공!',
                      {
                        body: '축하합니다! 경매에서 낙찰되었습니다!',
                        data: { auctionItemId, type: 'auction_win' }
                      }
                    );
                  }
                  
                  // 낙찰 시 마일리지 정보 새로고침
                  fetch('/api/members/mileage', {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  })
                  .then(res => res.json())
                  .then(data => setUserMileage(data.mileage || 0))
                  .catch(err => console.error('마일리지 조회 실패:', err));
                } else if (data.type === 'ERROR') {
                  console.error('❌ 입찰 실패:', data.message);
                  
                  // 브라우저 알림: 입찰 실패 (브라우저가 비활성화된 경우)
                  if (document.visibilityState === 'hidden') {
                    sendBrowserNotification(
                      '❌ 입찰 실패',
                      {
                        body: data.message,
                        data: { auctionItemId, type: 'bid_error' }
                      }
                    );
                  } else {
                    alert(data.message);
                  }
                }
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
            // 연결 실패 시에도 사용자에게 알림
            showToast('⚠️ 실시간 연결에 실패했습니다. 입찰은 가능하지만 실시간 업데이트가 제한됩니다.', 'warning', 5000);
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
      } finally {
        setIsConnecting(false);
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
      // 상태 초기화
      setHasJoined(false);
      setIsConnecting(false);
      connectionAttempted.current = false;
    };
  }, [auctionItemId]);

  // 남은 시간 계산 및 상태 갱신
  const getTimeLeft = () => {
    if (!item || !item.end_time) return '';
    const end = new Date(item.end_time).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) {
      // 경매 종료
      if (!isAuctionEnded) setIsAuctionEnded(true);
      return '경매 종료';
    }
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
        if (!isAuctionEnded) {
          setIsAuctionEnded(true);
          // 경매 종료 시 내 낙찰 여부 즉시 fetch (WebSocket이 없을 때 대비)
          (async () => {
            try {
              const token = localStorage.getItem('token');
              if (!token) return;
              const response = await fetch(`/api/auction/history/auction/${auctionItemId}/my`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              if (response.ok) {
                const myHistory = await response.json();
                setIsWinner(myHistory.winner);
              } else {
                setIsWinner(false);
              }
            } catch (error) {
              setIsWinner(false);
            }
          })();
        }
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
  }, [item?.end_time, isAuctionEnded, auctionItemId]);

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

    // 마일리지 잔액 확인 (입찰 가능 여부만 체크)
    if (amount > userMileage) {
      alert(`보유 마일리지가 부족합니다. 현재 보유: ${userMileage}P, 필요: ${amount}P\n\n💡 5분 경매이므로 사용 가능한 마일리지 내에서 입찰해주세요.`);
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
        auctionItemId: parseInt(auctionItemId),
        bidAmount: amount
      }));
      
      setBidAmount('');
      console.log('✅ 입찰 메시지 전송 완료');
      
      // 첫 입찰 시 토스트로 알림 권한 요청
      if (Notification.permission === 'default') {
        showToast('🔔 경매 알림을 받으시겠습니까?', 'info', 5000, () => {
          requestNotificationPermission();
        });
      }
      
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

  // 입찰 내역을 그래프 데이터로 변환 (시간 오름차순 정렬)
  const bidData = [...bidHistory]
    .sort((a, b) => new Date(a.bidTime) - new Date(b.bidTime))
    .map(bid => ({
      name: bid.memberNickname || '익명',
      입찰가: bid.bidAmount,
      시간: new Date(bid.bidTime).toLocaleString()
    }));

  // 입찰 내역이 없을 때 기본 데이터 생성
  const defaultData = [
    { name: '시작가', 입찰가: item?.start_price || 0, 시간: '시작' },
    { name: '현재가', 입찰가: item?.current_price || item?.start_price || 0, 시간: '현재' }
  ];



  if (!item) return <div>로딩 중...</div>;

  return (
    <>
      <Header />
      
      <div className="auction-room-layout">
        {/* 상품명: 전체 너비 */}
        <div className="product-title-full">
          <div className="breadcrumb">
            <span className="breadcrumb-icon">
              <FaGavel />
            </span>
            <span className="breadcrumb-separator">{'>'}</span>
            <span className="breadcrumb-category">경매</span>
          </div>
          <div className="item-title">{item.itemName}</div>
        </div>
        {/* 구분선: 전체 너비 */}
        <div className="full-width-divider">
          <hr className="item-divider" />
        </div>
        {/* 메인 컨텐츠: 2x2 그리드 레이아웃 */}
        <div className="auction-room-grid">
          {/* 상품 이미지 */}
          <div className="auction-room-image-section">
            <div className="image-container">
              <img 
                src={item.thumbnailUrl} 
                alt="상품 이미지" 
                className="auction-room-photo-img"
              />
            </div>
          </div>
          
          {/* 상품 정보 */}
          <div className="auction-room-info-section">
            <div className="product-info-card">
              <div className="price-info">
                <div className="price-item">
                  <span className="price-label current-price-label">현재 가격</span>
                  <span className="price-value current-price-value">{item.current_price}P</span>
                </div>
                <div className="price-item">
                  <span className="price-label">경매 시작가</span>
                  <span className="price-value">{item.start_price}P</span>
                </div>
                <div className="price-item">
                  <span className="price-label">입찰 최소 단위</span>
                  <span className="price-value">{item.bid_unit}P</span>
                </div>
              </div>
              <hr className="item-divider" />
              <div className="auction-time-info">
                <div className="time-item">
                  <span className="time-label">
                    <FaFlag style={{ marginRight: '6px', color: '#223A5E' }} />
                    경매 시작
                  </span>
                  <span className="time-value">{item.start_time ? new Date(item.start_time).toLocaleString() : '정보 없음'}</span>
                </div>
                <div className="time-item">
                  <span className="time-label">
                    <FaClock style={{ marginRight: '6px', color: '#223A5E' }} />
                    경매 종료
                  </span>
                  <span className="time-value">{item.end_time ? new Date(item.end_time).toLocaleString() : '정보 없음'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 그래프 */}
          <div className="auction-room-graph-section">
            <div className="graph-container">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={bidData.length > 0 ? bidData : defaultData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <XAxis dataKey="시간" stroke="#ffc107" tick={{ fill: '#ffc107', fontSize: 12 }} />
                  <YAxis domain={[item.start_price, 'auto']} stroke="#ffc107" tick={{ fill: '#ffc107', fontSize: 12 }} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const bid = payload[0].payload;
                        return (
                          <div style={{ 
                            background: '#ffc107', 
                            color: '#223A5E', 
                            border: '2px solid #ffc107', 
                            padding: 10, 
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
                            fontSize: '0.85rem',
                            fontWeight: 'normal'
                          }}>
                            <div style={{ marginBottom: '3px' }}>💰 {bid.입찰가.toLocaleString()}P</div>
                            <div style={{ marginBottom: '3px' }}><FaUser style={{ marginRight: '4px', color: '#223A5E' }} />{bid.name}</div>
                            <div>🕐 {bid.시간}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="입찰가" 
                    stroke="#ffc107" 
                    strokeWidth={4} 
                    dot={{ 
                      r: 6, 
                      stroke: '#ffc107', 
                      fill: '#fff',
                      strokeWidth: 2
                    }} 
                    activeDot={{ 
                      r: 8, 
                      stroke: '#ffc107', 
                      fill: '#ffc107',
                      strokeWidth: 3
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="graph-legend">
                 입찰 시간별 변동 추이
              </div>
            </div>
          </div>
          
          {/* 입찰 섹션 */}
          <div className="auction-room-bid-section">
            <div className="bid-section">
              <h3 className="bid-title">
                {!isAuctionEnded && <><FaPaw style={{ marginRight: '8px', color: '#223A5E' }} />마일리지 입찰하기</>}
              </h3>
              <div className="timer-container">
                <div className="timer-label">남은 시간</div>
                <div className="timer-value">{timeLeft}</div>
              </div>
                {!isAuctionEnded && (
                  <>
                    <div className="bid-form">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`최소 ${getMinBidAmount()}P`}
                        className="bid-input"
                        min={getMinBidAmount()}
                        max={userMileage}
                        step={item?.bid_unit || 100}
                      />
                      <button
                        onClick={handleBid}
                        disabled={isBidding || !bidAmount || parseInt(bidAmount) > userMileage || !isConnected}
                        className="bid-button"
                      >
                        {isBidding ? '입찰 중...' : isConnected ? '입찰하기' : '입찰대기'}
                      </button>
                    </div>
                    <div className="bid-info">
                      <div>• 최소 입찰 금액: <b className="min-bid">{getMinBidAmount()}P</b></div>
                      <div className="description">
                        💡 5분 경매: 입찰 시 마일리지 확인, 낙찰 시 실제 차감
                      </div>
                      {parseInt(bidAmount) > userMileage && (
                        <div className="error">
                          ⚠️ 보유 마일리지가 부족합니다!
                        </div>
                      )}
                      {!isConnected && (
                        <div style={{ color: '#ff9800', fontSize: '0.9rem', marginTop: '8px' }}>
                          🔌 실시간 연결 중... 잠시만 기다려주세요
                        </div>
                      )}
                    </div>
                  </>
                )}
                {/* 경매 종료/낙찰 알림 */}
                {isAuctionEnded && isWinner === true && (
                  <div className="winner-alert">
                    🎉 축하합니다! 낙찰되었습니다!
                    <button
                      className="delivery-button"
                      onClick={() => {
                        if (!myHistory || !myHistory.historyId) {
                          alert('경매 정보를 찾을 수 없습니다.');
                          return;
                        }
                        navigate('/auction/delivery', {
                          state: {
                            item: {
                              itemName: item.itemName,
                              thumbnailUrl: item.thumbnailUrl,
                              finalPrice: item.current_price,
                              auctionEndTime: item.end_time
                            },
                            historyId: myHistory.historyId
                          }
                        });
                      }}
                    >
                      배송지 입력
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
        
        {/* 입찰 내역 (전체 너비) */}
        <div className="auction-room-history-section">
          <div className="bid-history-section">
            <div className="bid-history-header">
              <div className="bid-history-title">
                <FaChartLine style={{ marginRight: '8px', color: '#223A5E' }} />
                입찰 내역 ({bidHistory.length}건)
              </div>
              <div className={`notification-status ${notificationPermission}`}>
                🔔 알림: {notificationPermission === 'granted' ? '허용' : notificationPermission === 'denied' ? '거부' : '요청 대기 중'}
              </div>
            </div>
            {bidHistory.length > 0 ? (
              <div className="bid-history-container">
                {bidHistory.map((bid, index) => {
                  // 최고 입찰가 계산
                  const maxBidAmount = Math.max(...bidHistory.map(b => b.bidAmount));
                  const isHighestBid = bid.bidAmount === maxBidAmount;
                  
                  return (
                    <div key={index} className={`bid-history-item ${isHighestBid ? 'highest' : ''}`}>
                      <div className="bidder-info">
                        <span className="bidder-icon">
                          {isHighestBid ? <FaTrophy style={{ color: '#223A5E' }} /> : <FaUser style={{ color: '#223A5E' }} />}
                        </span>
                        {bid.memberNickname || '익명'}
                      </div>
                      <div className="bid-amount">
                        {bid.bidAmount?.toLocaleString()}P
                      </div>
                      <div className="bid-time">
                        {new Date(bid.bidTime).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bid-history-empty">
                아직 입찰 기록이 없습니다.
              </div>
            )}
            {/* 참여자 수, 내 입찰 정보 */}
            <div className="participant-info">
              <b><FaUsers style={{ marginRight: '6px', color: '#223A5E' }} />참여자 수</b>
              <span className="participant-count">: {new Set(bidHistory.map(bid => bid.memberId)).size}명</span>
            </div>
            <div className="my-bid-info">
              <b><FaGem style={{ marginRight: '6px', color: '#223A5E' }} />내 입찰 정보</b>
              {(() => {
                const myBids = bidHistory.filter(bid => 
                  bid.memberId === parseInt(localStorage.getItem('memberId'))
                );
                const myHighestBid = myBids.length > 0 ? 
                  Math.max(...myBids.map(bid => bid.bidAmount)) : 0;
                return (
                  <div className="bid-detail">
                    <div>내 최고 입찰가: <b>{myHighestBid.toLocaleString()}P</b></div>
                    <div>내 입찰 횟수: <b>{myBids.length}회</b></div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuctionRoom;
