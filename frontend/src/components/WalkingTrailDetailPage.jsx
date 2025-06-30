import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const { kakao } = window; // 카카오맵 API 사용

const WalkingTrailDetailPage = () => {
  const { trailId } = useParams();
  const [trail, setTrail] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const mapContainer = useRef(null);
  const [newComment, setNewComment] = useState('');

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

  // 카카오맵 그리기 (변경 없음)
  useEffect(() => {
    if (!trail || !trail.pathData) return;

    const options = {
      center: new kakao.maps.LatLng(37.4562557, 126.7052062),
      level: 5,
    };
    const map = new kakao.maps.Map(mapContainer.current, options);

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

      if(linePath.length > 0) {
        map.setCenter(linePath[0]);
      }
    } catch (e) {
      console.error("경로 데이터(pathData) 파싱 오류:", e);
    }
  }, [trail]);

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

  // ... (return 문은 기존과 동일)
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
      <h3>산책로 경로</h3>
      <div ref={mapContainer} style={{ width: '100%', height: '400px', border: '1px solid black' }}></div>
      <h1>{trail.name}</h1>
      <p>{trail.description}</p>
      <hr/>
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
      <p>❤️ 추천수: {trail.recommends}</p>
      <button>추천하기</button>
      <hr/>
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
        <input
            type="text"
            placeholder="댓글을 입력하세요"
            style={{width: '80%'}}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
        />
        <button onClick={handleCommentSubmit}>작성</button>
      </div>
    </div>
  );
};

export default WalkingTrailDetailPage;
