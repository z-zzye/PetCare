import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const { kakao } = window;

const WalkingTrailCreatePage = () => {
    const navigate = useNavigate();
    const mapContainer = useRef(null);
    const [map, setMap] = useState(null);
    const [polyline, setPolyline] = useState(null);
    const [path, setPath] = useState([]);
    const [distance, setDistance] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        time: 0,
        mainImage: ''
    });

    // 지도 생성 로직
    useEffect(() => {
        const options = {
            center: new kakao.maps.LatLng(37.566826, 126.9786567), // 초기 중심: 서울시청
            level: 5,
        };
        const mapInstance = new kakao.maps.Map(mapContainer.current, options);
        setMap(mapInstance);

        const polylineInstance = new kakao.maps.Polyline({
            strokeWeight: 6,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeStyle: 'solid'
        });
        setPolyline(polylineInstance);
    }, []);

    // 지도 클릭 이벤트 로직
    useEffect(() => {
        if (!map) return;
        const handleClick = (mouseEvent) => {
            setPath(prevPath => [...prevPath, mouseEvent.latLng]);
        };
        kakao.maps.event.addListener(map, 'click', handleClick);
        return () => kakao.maps.event.removeListener(map, 'click', handleClick);
    }, [map]);

    // 경로 변경 시 폴리라인 다시 그리기 및 거리 계산
    useEffect(() => {
        if (!polyline || !map) return;
        polyline.setPath(path);
        polyline.setMap(map);
        setDistance(Math.round(polyline.getLength()));
    }, [path, polyline, map]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUndo = () => setPath(prevPath => prevPath.slice(0, -1));
    const handleClear = () => setPath([]);

    // 폼 제출 로직
    const handleSubmit = (e) => {
        e.preventDefault();
        if (path.length < 2) {
            alert('경로를 2개 지점 이상 그려주세요.');
            return;
        }

        const pathDataForBackend = JSON.stringify(
            path.map(point => ({ lat: point.getLat(), lng: point.getLng() }))
        );

        const finalFormData = {
            ...formData,
            distance: distance,
            pathData: pathDataForBackend,
        };

        // API 호출
        fetch('/api/trails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 만약 로그인이 필요한 기능이라면 아래 주석을 해제하세요.
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(finalFormData),
        })
        .then(res => {
            if (res.ok) {
                alert('산책로가 성공적으로 생성되었습니다.');
                navigate('/trails');
            } else {
                // 서버에서 온 에러 메시지를 보여주면 더 좋습니다.
                alert('생성에 실패했습니다. 서버 상태를 확인해주세요.');
            }
        })
        .catch(error => {
            console.error("산책로 생성 오류:", error);
            alert("요청에 실패했습니다. 네트워크 연결 또는 서버 설정을 확인해주세요.");
        });
    };

    return (
        <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
            <div style={{ flex: 2 }}>
                <Link to="/trails">{'< 목록으로 돌아가기'}</Link>
                <h2>지도에 클릭하여 경로를 그려주세요</h2>
                <div ref={mapContainer} style={{ width: '100%', height: '500px', border: '1px solid black' }}></div>
                <div style={{ marginTop: '10px' }}>
                    <button onClick={handleUndo}>마지막 지점 취소</button>
                    <button onClick={handleClear} style={{ marginLeft: '10px' }}>전체 삭제</button>
                </div>
                <h3 style={{ marginTop: '20px' }}>경로 정보</h3>
                <p><strong>총 거리:</strong> {distance} m | <strong>총 지점 수:</strong> {path.length} 개</p>
            </div>
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
                    <button type="submit" style={{ width: '100%', padding: '10px' }}>산책로 저장하기</button>
                </form>
            </div>
        </div>
    );
};

export default WalkingTrailCreatePage;
