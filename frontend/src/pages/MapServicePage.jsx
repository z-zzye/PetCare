import React, { useState, useEffect, useContext } from 'react';
import KakaoMapsScriptContext from '../contexts/KakaoMapsScriptContext';
import MapContainer from '../components/MapContainer';
import Header from '../components/Header';
import '../components/css/CommonBoard.css';
import '../components/css/MapServicePage.css';

const MapServicePage = () => {
    const { isLoaded } = useContext(KakaoMapsScriptContext);
    const [mapCenter, setMapCenter] = useState({ lat: 37.4894, lng: 126.7243 });
    const [initialLoading, setInitialLoading] = useState(true);
    const [places, setPlaces] = useState([]);
    const [category, setCategory] = useState('동물병원');
    const [keyword, setKeyword] = useState('');
    const [searchTitle, setSearchTitle] = useState('동물병원');

    const handleLocationCategorySearch = () => {
        if (!isLoaded || !keyword.trim()) {
            alert("검색할 지역/장소를 입력해주세요.");
            return;
        }

        const kakao = window.kakao;
        const ps = new kakao.maps.services.Places();

        ps.keywordSearch(keyword, (locationData, locationStatus) => {
            if (locationStatus === kakao.maps.services.Status.OK) {
                const firstPlace = locationData && locationData.length > 0 ? locationData[0] : null;

                if (firstPlace) {
                    const newCenter = {
                        lat: parseFloat(firstPlace.y),
                        lng: parseFloat(firstPlace.x),
                    };

                    setMapCenter(newCenter);
                    setSearchTitle(`'${keyword}' 주변 '${category}'`);
                    searchNearby(category, newCenter);
                } else {
                    alert(`'${keyword}'에 대한 장소 검색 결과가 없습니다.`);
                }
            } else if (locationStatus === kakao.maps.services.Status.ZERO_RESULT) {
                alert(`'${keyword}'에 대한 장소 검색 결과가 없습니다.`);
            } else {
                alert('장소 검색 중 오류가 발생했습니다.');
            }
        });
    };

    const searchNearby = (term, center) => {
        if (!isLoaded) return;
        setSearchTitle(`'${term}'`);

        const kakao = window.kakao;
        const ps = new kakao.maps.services.Places();
        const searchOptions = {
            location: new kakao.maps.LatLng(center.lat, center.lng),
            radius: 5000,
            sort: kakao.maps.services.SortBy.DISTANCE,
        };

        ps.keywordSearch(term, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                setPlaces(data);
            } else {
                setPlaces([]);
            }
        }, searchOptions);
    };

    useEffect(() => {
        if (!isLoaded || initialLoading) return;
        searchNearby(category, mapCenter);
    }, [category]);

    useEffect(() => {
        if (!isLoaded) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userPosition = { lat: position.coords.latitude, lng: position.coords.longitude };
                setMapCenter(userPosition);
                searchNearby(category, userPosition);
                setInitialLoading(false);
            },
            (error) => {
                console.error("Geolocation 에러:", error);
                searchNearby(category, mapCenter);
                setInitialLoading(false);
                alert("위치 정보 접근이 거부되었습니다. 기본 위치(부평역) 주변을 검색합니다.");
            }
        );
    }, [isLoaded]);

    if (!isLoaded || initialLoading) {
        return (
            <>
                <Header />
                <div className="common-container"><div>지도 및 위치 정보를 불러오는 중입니다...</div></div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="common-container">
                <h1 className="common-title">내 주변 편의시설 찾기</h1>
                <div className="map-search-bar">
                    <div className="map-category-btns">
                        <button className={`common-btn map-category-btn ${category === '동물병원' ? 'active' : ''}`} onClick={() => setCategory('동물병원')} type="button">동물병원</button>
                        <button className={`common-btn map-category-btn ${category === '펫샵' ? 'active' : ''}`} onClick={() => setCategory('펫샵')} type="button">펫샵</button>
                    </div>
                    <div className="map-region-search">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLocationCategorySearch()}
                            placeholder="지역/장소명 입력 (예: 주안역)"
                            className="map-region-input"
                        />
                        <button className="common-btn map-region-btn" onClick={handleLocationCategorySearch} type="button">검색</button>
                    </div>
                </div>
                <MapContainer center={mapCenter} places={places} />
                <div className="map-list-container">
                    <h3 className="map-list-title">{searchTitle} 검색 결과 ({places.length}건)</h3>
                    <ul className="map-list-ul">
                        {places.map(place => (
                            <li key={place.id} className="map-list-li">
                                <div className="map-list-item-header">
                                  <span className="map-list-place">{place.place_name}&nbsp;&nbsp;</span>
                                  <a href={`https://place.map.kakao.com/${place.id}`} target="_blank" rel="noopener noreferrer" className="map-list-detail-link">
                                      상세보기
                                  </a>
                                </div>
                                <p className="map-list-address">{place.road_address_name || place.address_name}</p>
                                {place.phone && <p className="map-list-phone">{place.phone}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default MapServicePage;
