import React, { useEffect, useState, useRef } from 'react';
import '../components/css/MapContainer.css';

const MapContainer = ({ center, places }) => {
  // map, markers, infowindow를 state 대신 ref로 관리하여 불필요한 리렌더링을 방지합니다.
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infowindowRef = useRef(null);
  const mapContainerRef = useRef(null); // 지도를 담을 div를 위한 ref

  // 1. 지도 생성 (최초 한 번만 실행)
  useEffect(() => {
    if (!mapContainerRef.current || !window.kakao) return;

    const kakao = window.kakao;
    const options = {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    };
    // 지도를 ref에 저장합니다.
    mapRef.current = new kakao.maps.Map(mapContainerRef.current, options);
    // 인포윈도우를 ref에 저장합니다.
    infowindowRef.current = new kakao.maps.InfoWindow({ zIndex: 1 });
  }, []); // 의존성 배열이 비어있으므로 최초 렌더링 시에만 실행됩니다.

  // 2. 지도 중심좌표(center)가 변경되면 지도를 이동시킵니다.
  useEffect(() => {
    if (!mapRef.current) return;
    const kakao = window.kakao;
    const moveLatLng = new kakao.maps.LatLng(center.lat, center.lng);
    mapRef.current.panTo(moveLatLng);
  }, [center]);

  // 3. 검색된 장소 목록(places)이 변경되면 마커를 새로 그립니다.
  useEffect(() => {
    if (!mapRef.current || !infowindowRef.current) return;

    const kakao = window.kakao;
    const map = mapRef.current;
    const infowindow = infowindowRef.current;

    // 기존 마커들을 지도에서 제거합니다.
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = []; // 마커 배열 초기화

    if (places && places.length > 0) {
      const newMarkers = places.map(place => {
        const marker = new kakao.maps.Marker({
          map: map,
          position: new kakao.maps.LatLng(place.y, place.x),
        });

        // 마커에 클릭 이벤트를 등록합니다.
        kakao.maps.event.addListener(marker, 'click', () => {
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
      // 새로 생성된 마커들을 ref에 저장합니다.
      markersRef.current = newMarkers;
    }
  }, [places]); // places가 변경될 때마다 이 효과가 실행됩니다.

  // 지도를 표시할 div
  return (
    <div ref={mapContainerRef} className="map-container"></div>
  );
};

export default MapContainer;
