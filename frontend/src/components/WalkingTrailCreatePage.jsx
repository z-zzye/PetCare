import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const { kakao } = window;

const WalkingTrailCreatePage = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null); // 지도를 담을 DOM 레퍼런스

  // 상태 관리
  const [map, setMap] = useState(null); // 지도 인스턴스
  const [polyline, setPolyline] = useState(null); // 지도에 표시될 경로 라인
  const [path, setPath] = useState([]); // 경로 좌표 배열
  const [distance, setDistance] = useState(0); // 총 거리 (미터 단위)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    time: 0,
    mainImage: ''
  });

  // 1. 컴포넌트 마운트 시 지도 생성
  useEffect(() => {
    const options = {
      center: new kakao.maps.LatLng(37.4562557, 126.7052062), // 초기 중심: 인천시청
      level: 5,
    };
    const mapInstance = new kakao.maps.Map(mapContainer.current, options);
    setMap(mapInstance);

    // 경로를 표시할 Polyline 객체 생성
    const polylineInstance = new kakao.maps.Polyline({
      strokeWeight: 6,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    });
    setPolyline(polylineInstance);

  }, []); // 처음 한 번만 실행

  // 2. 지도 클릭 이벤트 등록 및 해제
  useEffect(() => {
    if (!map) return;

    const handleClick = (mouseEvent) => {
      // 클릭한 위치의 좌표를 경로 배열에 추가
      const newPoint = mouseEvent.latLng;
      setPath(prevPath => [...prevPath, newPoint]);
    };

    kakao.maps.event.addListener(map, 'click', handleClick);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거 (메모리 누수 방지)
    return () => {
      kakao.maps.event.removeListener(map, 'click', handleClick);
    };
  }, [map]);

  // 3. 경로(path)가 변경될 때마다 폴리라인 다시 그리기 및 거리 계산
  useEffect(() => {
    if (!polyline || !map) return;

    // 새로운 경로로 폴리라인 설정
    polyline.setPath(path);
    polyline.setMap(map);

    // 경로의 총 거리 계산 (미터 단위)
    const totalDistance = Math.round(polyline.getLength());
    setDistance(totalDistance);

  }, [path, polyline, map]);

  // 4. 폼 데이터 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 5. 마지막 지점 취소
  const handleUndo = () => {
    setPath(prevPath => prevPath.slice(0, -1));
  };

  // 6. 경로 전체 삭제
  const handleClear = () => {
    setPath([]);
  };

  // 7. 폼 제출 (저장)
  const handleSubmit = (e) => {
    e.preventDefault();

    if (path.length < 2) {
      alert('경로를 2개 지점 이상 그려주세요.');
      return;
    }

    // 경로 좌표 배열을 백엔드에 저장할 JSON 문자열 형태로 변환
    const pathDataForBackend = JSON.stringify(
      path.map(point => ({
        lat: point.getLat(),
        lng: point.getLng()
      }))
    );

    const finalFormData = {
      ...formData,
      distance: distance, // 계산된 거리 포함
      pathData: pathDataForBackend, // JSON 문자열 경로 데이터 포함
    };

    fetch('/api/trails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalFormData),
    })
    .then(res => {
      if (res.ok) {
        alert('산책로가 성공적으로 생성되었습니다.');
        navigate('/trails');
      } else {
        alert('생성에 실패했습니다.');
      }
    })
    .catch(error => console.error("산책로 생성 오류:", error));
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      {/* 왼쪽: 지도 및 경로 정보 */}
      <div style={{ flex: 2 }}>
        <Link to="/trails">{'< 목록으로 돌아가기'}</Link>
        <h2>지도에 클릭하여 경로를 그려주세요</h2>
        <div ref={mapContainer} style={{ width: '100%', height: '500px', border: '1px solid black' }}></div>
        <div style={{ marginTop: '10px' }}>
          <button onClick={handleUndo}>마지막 지점 취소</button>
          <button onClick={handleClear} style={{ marginLeft: '10px' }}>전체 삭제</button>
        </div>
        <h3 style={{ marginTop: '20px' }}>경로 정보</h3>
        <p><strong>총 거리:</strong> {distance} m</p>
        <p><strong>총 지점 수:</strong> {path.length} 개</p>
      </div>

      {/* 오른쪽: 산책로 정보 입력 폼 */}
      <div style={{ flex: 1 }}>
        <h2>산책로 정보 입력</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>산책로 이름:</label><br />
            <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>부가 설명:</label><br />
            <textarea name="description" value={formData.description} onChange={handleChange} required style={{ width: '100%', height: '100px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>예상 소요 시간(분):</label><br />
            <input type="number" name="time" value={formData.time} onChange={handleChange} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>대표 이미지 URL:</label><br />
            <input type="text" name="mainImage" value={formData.mainImage} onChange={handleChange} style={{ width: '100%' }} />
          </div>
          <button type="submit" style={{ width: '100%', padding: '10px', fontSize: '16px' }}>산책로 저장하기</button>
        </form>
      </div>
    </div>
  );
};

export default WalkingTrailCreatePage;
