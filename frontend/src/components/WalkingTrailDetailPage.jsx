import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';

const { kakao } = window; // 카카오맵 API 사용

const WalkingTrailDetailPage = () => {
  const { trailId } = useParams();
  const [trail, setTrail] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const mapContainer = useRef(null);
  const [newComment, setNewComment] = useState('');
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [currentInfoWindow, setCurrentInfoWindow] = useState(null);
  const mapRef = useRef();

  // ★★★★★ 1. 데이터 불러오기 로직을 재사용 가능한 함수로 분리합니다. ★★★★★
  const fetchTrailData = () => {
    fetch(`/api/trails/${trailId}`)
      .then(res => res.json())
      .then(data => {
        setTrail(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("상세 정보를 불러오는 중 오류 발생:", error);
        setIsLoading(false);
      });
  };

  // ★★★★★ 2. 컴포넌트가 처음 로드될 때 위에서 만든 함수를 호출합니다. ★★★★★
  useEffect(() => {
    fetchTrailData();
  }, [trailId]);

  // 지도 및 산책로 경로 표시 useEffect
  useEffect(() => {
    if (!trail || !trail.pathData) return;
    if (!mapRef.current) {
      console.warn('mapRef.current is null!');
      return;
    }
    const kakao = window.kakao;
    const path = JSON.parse(trail.pathData);
    const linePath = path.map(p => new kakao.maps.LatLng(p.lat, p.lng));
    const mapInstance = new kakao.maps.Map(mapRef.current, {
      center: linePath[0],
      level: 4,
    });
    new kakao.maps.Polyline({
      map: mapInstance,
      path: linePath,
      strokeWeight: 5,
      strokeColor: '#FF6600',
    });
    setMap(mapInstance);
  }, [trail]);

  // 편의시설 마커 표시 useEffect
  useEffect(() => {
    if (!map || !Array.isArray(amenities)) return;
    // 기존 마커/인포윈도우 제거
    markers.forEach(marker => marker.setMap(null));
    if (currentInfoWindow) currentInfoWindow.close();

    const kakao = window.kakao;
    const newMarkers = [];
    let infoWindowRef = null;

    amenities.forEach((amenity) => {
      try {
        if (
          typeof amenity.lat !== 'number' ||
          typeof amenity.lng !== 'number' ||
          isNaN(amenity.lat) ||
          isNaN(amenity.lng)
        ) {
          console.warn('잘못된 lat/lng:', amenity);
          return;
        }
        const marker = new kakao.maps.Marker({
          map,
          position: new kakao.maps.LatLng(amenity.lat, amenity.lng),
        });
        const iw = new kakao.maps.InfoWindow({
          content: `<div style="padding:8px;font-size:14px;font-weight:bold;">${amenity.name}</div>`,
        });
        kakao.maps.event.addListener(marker, 'click', () => {
          if (infoWindowRef) infoWindowRef.close();
          iw.open(map, marker);
          setCurrentInfoWindow(iw);
          infoWindowRef = iw;
        });
        newMarkers.push(marker);
      } catch (e) {
        console.error('마커 생성 중 에러:', e, amenity);
      }
    });
    setMarkers(newMarkers);
    // eslint-disable-next-line
  }, [amenities, map]);

  // 주변 편의시설 검색 함수 (변경 없음)
  const handleAmenitySearch = (category) => {
    fetch(`/api/trails/${trailId}/amenities?category=${category}`)
      .then(res => res.json())
      .then(data => setAmenities(data))
      .catch(error => console.error("주변 시설 검색 오류:", error));
  };

    /**
     * 댓글 작성 버튼 클릭 핸들러
     */
    const handleCommentSubmit = () => {
        if (!newComment.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }

        fetch(`/api/trails/${trailId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: newComment })
        })
        .then(res => {
            if (res.ok) {
                alert('댓글이 성공적으로 작성되었습니다.');
                setNewComment('');
                // ★★★★★ 3. 이제 정의된 함수를 여기서 호출할 수 있습니다. ★★★★★
                fetchTrailData(); // 댓글 목록 새로고침
            } else {
                alert('댓글 작성에 실패했습니다.');
            }
        })
        .catch(error => console.error("댓글 작성 중 오류 발생:", error));
    };

  // 추천 버튼 클릭 핸들러 추가
  const handleRecommend = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }
    fetch(`/api/trails/${trailId}/recommend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async res => {
        if (res.ok) {
          alert('추천이 완료되었습니다!');
          fetchTrailData(); // 추천수 갱신
        } else if (res.status === 409) {
          const msg = await res.text();
          alert(msg || '이미 추천하셨습니다.');
        } else if (res.status === 401) {
          alert('로그인이 필요합니다.');
        } else {
          alert('추천 처리 중 오류가 발생했습니다.');
        }
      })
      .catch(err => {
        alert('네트워크 오류로 추천에 실패했습니다.');
        console.error(err);
      });
  };

  // ... (return 문은 기존과 동일)
  if (isLoading) {
    return <div>상세 정보를 불러오는 중입니다...</div>;
  }

  if (!trail) {
    return <div>해당 산책로를 찾을 수 없습니다.</div>;
  }

  return (
    <>
      <Header />
      <div className="common-container trail-list-container">
        <Link to="/trails" className="trail-list-link" style={{ color: '#223A5E', fontWeight: 600 }}>{'< 목록으로 돌아가기'}</Link>
        <h1 className="common-title">산책로 상세 정보</h1>
        <h3 className="trail-list-title" style={{ color: '#223A5E' }}>산책로 경로</h3>
        <div ref={mapRef} style={{ width: '100%', height: '400px', border: '1.5px solid #e9ecef', borderRadius: '14px', marginBottom: '16px' }}></div>
        <h2 className="trail-list-title" style={{ color: '#223A5E', marginTop: '18px' }}>{trail.name}</h2>
        <p className="trail-list-info">{trail.description}</p>
        <h3 className="trail-list-title" style={{ color: '#223A5E', marginTop: '24px' }}>주변 편의시설 검색</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <button className="common-btn trail-search-btn" onClick={() => handleAmenitySearch('동물병원')}>동물병원</button>
          <button className="common-btn trail-search-btn" onClick={() => handleAmenitySearch('카페')}>카페</button>
          <button className="common-btn trail-search-btn" onClick={() => handleAmenitySearch('편의점')}>편의점</button>
        </div>
        <ul className="trail-list-ul">
          {Array.isArray(amenities) && amenities.map(place => (
            <li key={place.name + place.address} className="trail-list-card">
              <strong className="trail-list-title">{place.name}</strong> <span className="trail-list-info">({place.distance})</span><br/>
              <span className="trail-list-info">{place.address}</span> <a href={place.placeUrl} target="_blank" rel="noopener noreferrer">상세보기</a>
            </li>
          ))}
        </ul>
        <p className="trail-list-recommend" style={{ color: '#223A5E', marginTop: '18px' }}>❤️ 추천수: {trail.recommends}</p>
        <button className="common-btn trail-create-btn" onClick={handleRecommend}>추천하기</button>
        <h3 className="trail-list-title" style={{ color: '#223A5E', marginTop: '24px' }}>댓글 ({trail.comments.length})</h3>
        <div style={{ marginBottom: '10px' }}>
          {trail.comments.map(comment => (
            <div key={comment.id} className="trail-list-info" style={{borderBottom: '1px solid #eee', padding: '5px 0'}}>
              <strong style={{ color: '#223A5E' }}>{comment.authorNickName}: </strong>
              <span>{comment.content}</span>
            </div>
          ))}
        </div>
        <div style={{marginTop: '10px', display: 'flex', gap: '8px'}}>
          <input
              type="text"
              placeholder="댓글을 입력하세요"
              className="trail-search-input"
              style={{width: '80%'}}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
          />
          <button className="common-btn trail-search-btn" onClick={handleCommentSubmit}>작성</button>
        </div>
      </div>
    </>
  );
};

export default WalkingTrailDetailPage;
