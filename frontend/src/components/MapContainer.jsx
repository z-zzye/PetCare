import React, { useEffect } from 'react';

// 카카오 맵 SDK가 전역 window 객체에 등록되므로, window.kakao로 접근합니다.
const { kakao } = window;

const MapContainer = ({ center }) => {
  useEffect(() => {
    const container = document.getElementById('map'); // 지도를 담을 영역의 DOM 레퍼런스
    const options = { // 지도를 생성할 때 필요한 기본 옵션
      center: new kakao.maps.LatLng(center.lat, center.lng), // 지도의 중심좌표.
      level: 4 // 지도의 레벨(확대, 축소 정도)
    };

    // 지도 객체를 생성합니다.
    const map = new kakao.maps.Map(container, options);

    // 이 부분은 지도가 리렌더링될 때 기존 지도를 제거하는 로직이지만,
    // 여기서는 간단하게 한 번만 생성되도록 구성했습니다.
    // 복잡한 상호작용이 필요할 경우, 지도를 state로 관리하는 등의 추가 작업이 필요합니다.

  }, [center]); // center 값이 바뀔 때마다 지도를 다시 그립니다.

  return (
    <div
      id="map"
      style={{
        width: '100%',
        height: '500px' // 지도 영역의 크기를 지정합니다.
      }}
    ></div>
  );
};

export default MapContainer;
