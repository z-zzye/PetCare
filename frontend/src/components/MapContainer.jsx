import React, { useEffect, useState } from 'react';
import '../components/css/MapContainer.css';
import Header from '../components/Header';


const MapContainer = ({ center, places }) => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [infowindow, setInfowindow] = useState(null);

  // 1. 지도 생성
  // ✅ 카카오맵 스크립트 로드 및 지도 초기화
    useEffect(() => {
      console.log("🟡 useEffect 시작됨");
      const script = document.createElement('script');
      console.log("✅ API KEY:", process.env.REACT_APP_KAKAO_JS_KEY);
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_JS_KEY}&autoload=false&libraries=services`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        console.log("🟢 Kakao Maps 객체 로드 완료");
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            const container = document.getElementById('map');
            const options = {
              center: new window.kakao.maps.LatLng(center.lat, center.lng),
              level: 3,
            };
            const newMap = new window.kakao.maps.Map(container, options);
            const newInfowindow = new window.kakao.maps.InfoWindow({ zIndex: 1 });

            setMap(newMap);
            setInfowindow(newInfowindow);
          });
        }
      };
    }, [center]);// 이 useEffect는 처음 한 번만 실행됩니다.

  // 2. 검색된 장소 목록(places)이 변경될 때마다 마커를 새로 그립니다.
  // ✅ 장소 목록이 변경되면 마커 다시 그림
    useEffect(() => {
      if (!map || !window.kakao || !places) return;

      // 기존 마커 제거
      markers.forEach(marker => marker.setMap(null));

      const newMarkers = places.map(place => {
        const marker = new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(place.y, place.x),
        });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          const content = `
            <div style="padding:10px;width:280px;font-size:13px;line-height:1.6;">
              <div style="font-weight:bold;color:#333;margin-bottom:5px;">${place.place_name}</div>
              <div style="color:#666;">${place.road_address_name || place.address_name}</div>
              ${place.phone ? `<div style="color:#007bff;">${place.phone}</div>` : ''}
              <a href="https://place.map.kakao.com/${place.id}" target="_blank" rel="noopener noreferrer" style="display:block;margin-top:8px;color:#2a74e8;text-decoration:none;">카카오맵에서 상세보기</a>
            </div>`;

          infowindow.setContent(content);
          infowindow.open(map, marker);
        });

        return marker;
      });

      setMarkers(newMarkers);

      if (places.length > 0) {
        const newCenter = new window.kakao.maps.LatLng(places[0].y, places[0].x);
        map.setCenter(newCenter);
      }
    }, [places, map, infowindow]);

    return (
      <div id="map" className="map-container"></div>
    );
  };

  export default MapContainer;

