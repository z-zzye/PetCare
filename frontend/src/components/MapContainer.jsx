import React, { useEffect, useState } from 'react';
import '../components/css/MapContainer.css';
import Header from '../components/Header';

const { kakao } = window;

const MapContainer = ({ center, places }) => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [infowindow, setInfowindow] = useState(null);

  // 1. 지도 생성
  useEffect(() => {
    const container = document.getElementById('map');
    const options = {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 3,
    };
    const newMap = new kakao.maps.Map(container, options);
    const newInfowindow = new kakao.maps.InfoWindow({ zIndex: 1 });

    setMap(newMap);
    setInfowindow(newInfowindow);
  }, []); // 이 useEffect는 처음 한 번만 실행됩니다.

  // 2. 검색된 장소 목록(places)이 변경될 때마다 마커를 새로 그립니다.
  useEffect(() => {
    if (!map) return;

    // 기존 마커들을 지도에서 제거합니다.
    markers.forEach(marker => marker.setMap(null));

    const newMarkers = places.map(place => {
      // 새로운 마커를 생성합니다.
      const marker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(place.y, place.x),
      });

      // 마커에 클릭 이벤트를 등록합니다.
      kakao.maps.event.addListener(marker, 'click', function () {
              // 인포윈도우에 표시할 내용입니다.
              // 상세보기 링크를 포함하도록 HTML 내용을 구성합니다.
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

    // 새로운 마커들로 상태를 업데이트합니다.
    setMarkers(newMarkers);

    // 검색된 장소가 있다면, 첫 번째 장소를 중심으로 지도를 이동시킵니다.
    if (places.length > 0) {
      const newCenter = new kakao.maps.LatLng(places[0].y, places[0].x);
      map.setCenter(newCenter);
    }

  }, [places, map, infowindow]); // places, map, infowindow 상태가 변경될 때 실행됩니다.

  return (
    <div
      id="map"
      className="map-container"
    ></div>
  );
};

export default MapContainer;
