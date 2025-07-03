// src/contexts/KakaoMapsScriptContext.jsx (최종 수정 버전)

import React, { createContext, useState, useEffect } from 'react';

const KakaoMapsScriptContext = createContext();

export const KakaoMapsScriptProvider = ({ children }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 이미 스크립트가 로드되었거나, 로딩 중이라면 중복 실행 방지
        if (document.querySelector(`script[src*="//dapi.kakao.com/v2/maps/sdk.js"]`)) {
            // 스크립트 태그는 있는데 window.kakao 객체가 준비되었는지 확인
            if (window.kakao && window.kakao.maps) {
                setIsLoaded(true);
            }
            return;
        }

        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_MAP_API_KEY}&autoload=false&libraries=services`;
        script.async = true;

        script.onload = () => {
            window.kakao.maps.load(() => {
                setIsLoaded(true);
            });
        };

        script.onerror = () => {
            console.error("Failed to load Kakao Maps script.");
            setIsLoaded(false);
        };

        document.head.appendChild(script);

        // ★★★★★ StrictMode에서의 재마운트 문제를 해결하기 위해 클린업 함수에서 스크립트를 제거하지 않습니다. ★★★★★
        // 일단 한번 로드된 스크립트는 페이지를 떠날 때까지 유지되는 것이 일반적입니다.

    }, []); // 이 useEffect는 최초에 단 한 번만 실행되어야 합니다.

    return (
        <KakaoMapsScriptContext.Provider value={{ isLoaded }}>
            {children}
        </KakaoMapsScriptContext.Provider>
    );
};

export default KakaoMapsScriptContext;
