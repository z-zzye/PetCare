import React, { useState, useEffect } from 'react';
import MapContainer from '../components/MapContainer'; // 지도 컴포넌트

const MapServicePage = () => {
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation 에러:", error);
        setIsLoading(false);
        alert("위치 정보 접근이 거부되었습니다. 기본 위치로 지도를 표시합니다.");
      }
    );
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>내 주변 편의시설 찾기</h1>
      <p>
        {isLoading
          ? '위치 정보를 불러오는 중입니다...'
          : `현재 위치 또는 기본 위치의 중심 좌표: ${mapCenter.lat.toFixed(4)}, ${mapCenter.lng.toFixed(4)}`
        }
      </p>

      {!isLoading && <MapContainer center={mapCenter} />}
    </div>
  );
};

export default MapServicePage;
