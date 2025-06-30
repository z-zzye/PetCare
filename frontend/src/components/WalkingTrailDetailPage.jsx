import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const { kakao } = window; // 카카오맵 API 사용

const WalkingTrailDetailPage = () => {
  const { trailId } = useParams(); // URL에서 trailId를 가져옵니다.
  const [trail, setTrail] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const mapContainer = useRef(null); // 지도를 담을 DOM 레퍼런스

  // 1. 상세 정보 및 댓글 불러오기
  useEffect(() => {
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
  }, [trailId]);

  // 2. 카카오맵 그리기
  useEffect(() => {
    if (!trail || !trail.pathData) return; // 산책로 정보나 경로 데이터가 없으면 실행하지 않음

    const options = {
      center: new kakao.maps.LatLng(37.4562557, 126.7052062), // 우선 인천시청을 중심으로
      level: 5,
    };
    const map = new kakao.maps.Map(mapContainer.current, options);

    // 경로 데이터(pathData)를 파싱하여 지도에 폴리라인(경로)을 그립니다.
    // pathData가 '[{lat:37.123, lng:127.456}, ...]' 형식이라고 가정합니다.
    try {
      const linePath = JSON.parse(trail.pathData).map(
        coord => new kakao.maps.LatLng(coord.lat, coord.lng)
      );

      const polyline = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 5,
        strokeColor: '#FF0000',
        strokeOpacity: 0.7,
        strokeStyle: 'solid'
      });
      polyline.setMap(map);

      // 경로의 첫 번째 점을 지도의 중심으로 설정
      if(linePath.length > 0) {
        map.setCenter(linePath[0]);
      }
    } catch (e) {
      console.error("경로 데이터(pathData) 파싱 오류:", e);
    }

  }, [trail]); // trail 상태가 변경될 때마다 실행

  // 3. 주변 편의시설 검색 함수
  const handleAmenitySearch = (category) => {
    fetch(`/api/trails/${trailId}/amenities?category=${category}`)
      .then(res => res.json())
      .then(data => setAmenities(data))
      .catch(error => console.error("주변 시설 검색 오류:", error));
  };

  if (isLoading) {
    return <div>상세 정보를 불러오는 중입니다...</div>;
  }

  if (!trail) {
    return <div>해당 산책로를 찾을 수 없습니다.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/trails">{'< 목록으로 돌아가기'}</Link>
      <hr/>
      {/* 1. 지도가 표시될 영역 */}
      <h3>산책로 경로</h3>
      <div ref={mapContainer} style={{ width: '100%', height: '400px', border: '1px solid black' }}></div>

      {/* 2. 산책로 기본 정보 */}
      <h1>{trail.name}</h1>
      <p>{trail.description}</p>
      <hr/>

      {/* 3. 주변 편의시설 */}
      <h3>주변 편의시설 검색</h3>
      <button onClick={() => handleAmenitySearch('동물병원')}>동물병원</button>
      <button onClick={() => handleAmenitySearch('카페')}>카페</button>
      <button onClick={() => handleAmenitySearch('편의점')}>편의점</button>
      <ul>
        {amenities.map(place => (
          <li key={place.name + place.address}>
            <strong>{place.name}</strong> ({place.distance})<br/>
            <span>{place.address}</span> <a href={place.placeUrl} target="_blank" rel="noopener noreferrer">상세보기</a>
          </li>
        ))}
      </ul>
      <hr/>

      {/* 4. 추천 기능 */}
      <p>❤️ 추천수: {trail.recommends}</p>
      <button>추천하기</button>
      <hr/>

      {/* 5. 댓글 */}
      <h3>댓글 ({trail.comments.length})</h3>
      <div>
        {trail.comments.map(comment => (
          <div key={comment.id} style={{borderBottom: '1px solid #eee', padding: '5px 0'}}>
            <strong>{comment.authorNickName}: </strong>
            <span>{comment.content}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop: '10px'}}>
        <input type="text" placeholder="댓글을 입력하세요" style={{width: '80%'}}/>
        <button>작성</button>
      </div>
    </div>
  );
};

export default WalkingTrailDetailPage;
