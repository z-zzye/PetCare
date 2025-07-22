import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import KakaoMapsScriptContext from '../contexts/KakaoMapsScriptContext';

const WalkingTrailCreatePage = () => {
    const { isLoaded } = useContext(KakaoMapsScriptContext);
    const navigate = useNavigate();
    const mapContainer = useRef(null);

    // State 선언
    const [map, setMap] = useState(null);
    const [polyline, setPolyline] = useState(null);
    const [path, setPath] = useState([]);
    const [distance, setDistance] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        time: 0,
    });
    // ▼▼▼ 1. 검색어 입력을 위한 state 추가 ▼▼▼
    const [searchKeyword, setSearchKeyword] = useState('');

    // 지도와 폴리라인 초기화
    useEffect(() => {
        if (!isLoaded || !mapContainer.current) {
            return;
        }
        const kakao = window.kakao;
        kakao.maps.load(() => {
            const options = {
                center: new kakao.maps.LatLng(37.4894, 126.7243),
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
        });
    }, []);

    // ▼▼▼ 2. 장소 검색을 처리하는 함수 추가 ▼▼▼
    const handleSearch = () => {
        if (!searchKeyword.trim() || !window.kakao || !map) {
            return;
        }

        const kakao = window.kakao;
        const ps = new kakao.maps.services.Places(); // 장소 검색 객체 생성

        // 키워드로 장소를 검색
        ps.keywordSearch(searchKeyword, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                const firstPlace = data[0];
                const moveLatLng = new kakao.maps.LatLng(firstPlace.y, firstPlace.x);
                map.panTo(moveLatLng); // 검색된 위치로 지도 중심을 부드럽게 이동
            } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                alert('검색 결과가 존재하지 않습니다.');
            } else {
                alert('검색 중 오류가 발생했습니다.');
            }
        });
    };


    // 지도 클릭 이벤트 로직
    useEffect(() => {
        if (!map) return;
        const handleClick = (mouseEvent) => {
            setPath(prevPath => [...prevPath, mouseEvent.latLng]);
        };
        const kakao = window.kakao;
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
        const finalFormData = { ...formData, distance, pathData: pathDataForBackend };
        const token = localStorage.getItem('token');
        if (!token) {
            alert('산책로를 생성하려면 로그인이 필요합니다.');
            return;
        }
        fetch('/api/trails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(finalFormData),
        })
        .then(res => {
            if (res.ok) {
                alert('산책로가 성공적으로 생성되었습니다.');
                navigate('/trails');
            } else {
                alert('생성에 실패했습니다. 입력 내용을 확인해주세요.');
            }
        })
        .catch(error => {
            console.error("산책로 생성 오류:", error);
            alert("요청에 실패했습니다.");
        });
    };

    return (
        <div className="common-container trail-list-container" style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '400px' }}>
                <Link to="/trails" className="trail-list-link" style={{ color: '#223A5E', fontWeight: 600 }}>{'< 목록으로 돌아가기'}</Link>
                <h1 className="common-title" style={{ marginBottom: '18px' }}>지도에 클릭하여 경로를 그려주세요</h1>

                {/* ▼▼▼ 3. 검색창 UI 추가 ▼▼▼ */}
                <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="지역 입력 ex) 서울숲, 강남역"
                        className="trail-search-input"
                        style={{ flex: 1 }}
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    />
                    <button type="button" className="common-btn" onClick={handleSearch}>검색</button>
                </div>

                <div ref={mapContainer} style={{ width: '100%', height: '400px', border: '1.5px solid #e9ecef', borderRadius: '14px', marginBottom: '16px' }}></div>
                <div style={{ marginBottom: '18px', display: 'flex', gap: '10px' }}>
                    <button type="button" className="common-btn" onClick={handleUndo}>마지막 지점 취소</button>
                    <button type="button" className="common-btn" onClick={handleClear}>전체 삭제</button>
                </div>
                <h3 className="trail-list-title" style={{ color: '#223A5E', marginTop: '20px' }}>경로 정보</h3>
                <p className="trail-list-info"><strong>총 거리:</strong> {distance} m | <strong>총 지점 수:</strong> {path.length} 개</p>
            </div>
            <div style={{ flex: 1, minWidth: '300px' }}>
                <h2 className="common-title" style={{ fontSize: '1.3rem', marginBottom: '18px' }}>산책로 정보 입력</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label className="trail-list-info" style={{ color: '#223A5E', fontWeight: 600 }}>산책로 이름</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="trail-search-input" style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label className="trail-list-info" style={{ color: '#223A5E', fontWeight: 600 }}>부가 설명</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required className="trail-search-input" style={{ width: '100%', height: '80px', resize: 'vertical' }} />
                    </div>
                    <div>
                        <label className="trail-list-info" style={{ color: '#223A5E', fontWeight: 600 }}>예상 소요 시간(분)</label>
                        <input type="number" name="time" value={formData.time} onChange={handleChange} className="trail-search-input" style={{ width: '100%' }} />
                    </div>
                    <button type="submit" className="common-btn trail-create-btn" style={{ width: '100%' }}>산책로 저장하기</button>
                </form>
            </div>
        </div>
    );
};

export default WalkingTrailCreatePage;
