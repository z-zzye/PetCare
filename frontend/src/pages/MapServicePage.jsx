import React, { useState, useEffect } from 'react';
import MapContainer from '../components/MapContainer';
import Header from '../components/Header';
import '../components/css/CommonBoard.css';
import '../components/css/MapServicePage.css';

const { kakao } = window;

const MapServicePage = () => {
  // 상태 관리
  const [mapCenter, setMapCenter] = useState({ lat: 37.491025, lng: 126.720550 });
  const [isLoading, setIsLoading] = useState(true);
  const [places, setPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('동물병원'); // 기본 선택 카테고리
  const [regionKeyword, setRegionKeyword] = useState(''); // 지역 검색어

  // 1. 처음 렌더링 시 사용자의 현재 위치를 가져와서 해당 위치의 동물병원을 검색합니다.
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(newCenter);
        searchPlaces(selectedCategory, newCenter); // 현재 위치로 검색 실행
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation 에러:", error);
        searchPlaces(selectedCategory, mapCenter); // 거부 시 기본 위치로 검색 실행
        setIsLoading(false);
        alert("위치 정보 접근이 거부되었습니다. 기본 위치로 검색합니다.");
      }
    );
  }, []); // 이 useEffect는 처음 한 번만 실행됩니다.

  // 2. 장소 검색을 실행하는 핵심 함수
  const searchPlaces = (category, center) => {
    const ps = new kakao.maps.services.Places();
    const searchOptions = {
      location: new kakao.maps.LatLng(center.lat, center.lng),
      radius: 3000,
      sort: kakao.maps.services.SortBy.DISTANCE,
    };

    ps.keywordSearch(category, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        setPlaces(data);
      } else {
        alert('주변에 검색 결과가 없습니다.');
        setPlaces([]);
      }
    }, searchOptions);
  };

  // 3. 지역 검색 버튼 클릭 시 실행될 핸들러
  const handleRegionSearch = () => {
    if (!regionKeyword.trim()) {
      alert('지역명을 입력해주세요.');
      return;
    }

    // 주소-좌표 변환 객체를 생성합니다.
    const geocoder = new kakao.maps.services.Geocoder();

    // 주소로 좌표를 검색합니다.
    geocoder.addressSearch(regionKeyword, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const newCoords = {
          lat: result[0].y,
          lng: result[0].x,
        };
        setMapCenter(newCoords); // 지도의 중심을 검색된 지역으로 이동
        searchPlaces(selectedCategory, newCoords); // 검색된 지역 기준으로 장소 검색 실행
      } else {
        alert('지역 검색에 실패했습니다. 더 자세한 주소를 입력해주세요.');
      }
    });
  };

  // 카테고리 변경 시 검색
  useEffect(() => {
    searchPlaces(selectedCategory, mapCenter);
    // eslint-disable-next-line
  }, [selectedCategory]);

  return (
    <>
      <Header />
      <div className="common-container">
        <h1 className="common-title">내 주변 편의시설 찾기</h1>

        {/* 검색 UI */}
        <div className="map-search-bar">
          <div className="map-category-btns">
            <button
              className={`common-btn map-category-btn${selectedCategory === '동물병원' ? ' active' : ''}`}
              onClick={() => setSelectedCategory('동물병원')}
              type="button"
            >
              동물병원
            </button>
            <button
              className={`common-btn map-category-btn${selectedCategory === '펫샵' ? ' active' : ''}`}
              onClick={() => setSelectedCategory('펫샵')}
              type="button"
            >
              펫샵
            </button>
          </div>
          <div className="map-region-search">
            <input
              type="text"
              value={regionKeyword}
              onChange={(e) => setRegionKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegionSearch()}
              placeholder="찾고 싶은 지역을 입력하세요 (예: 강남역, 부산시청)"
              className="map-region-input"
            />
            <button className="common-btn map-region-btn" onClick={handleRegionSearch} type="button">
              지역 검색
            </button>
          </div>
        </div>

        {/* 지도 및 결과 표시 */}
        {isLoading ? (
          <div>위치 정보를 불러오는 중입니다...</div>
        ) : (
          <>
            <MapContainer center={mapCenter} places={places} />
            <div className="map-list-container">
              <h3 className="map-list-title">
                '{selectedCategory}' 검색 결과 ({places.length}건)
              </h3>
              <ul className="map-list-ul">
                {places.map(place => (
                  <li key={place.id} className="map-list-li">
                    <span className="map-list-place">{place.place_name}</span>
                    <p className="map-list-address">{place.road_address_name || place.address_name}</p>
                    {place.phone && <p className="map-list-phone">{place.phone}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
};
export default MapServicePage;
