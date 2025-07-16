// src/contexts/KakaoMapsScriptContext.jsx (최종 수정 버전)

import React, { createContext, useState, useEffect, useRef } from 'react';

const KakaoMapsScriptContext = createContext();

// 전역 변수로 스크립트 로드 상태 관리
let isScriptLoading = false;
let isScriptLoaded = false;

export const KakaoMapsScriptProvider = ({ children }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const hasInitialized = useRef(false);

    useEffect(() => {
        // 이미 초기화되었다면 중복 실행 방지
        if (hasInitialized.current) {
            return;
        }
        hasInitialized.current = true;

        // 이미 스크립트가 로드되었거나, 로딩 중이라면 중복 실행 방지
        if (isScriptLoaded) {
            setIsLoaded(true);
            return;
        }

        if (isScriptLoading) {
            // 로딩 중이라면 완료될 때까지 대기
            const checkLoaded = () => {
                if (isScriptLoaded) {
                    setIsLoaded(true);
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
            return;
        }

        // 이미 스크립트 태그가 존재하는지 확인
        const existingScript = document.querySelector(`script[src*="//dapi.kakao.com/v2/maps/sdk.js"]`);
        if (existingScript) {
            // 스크립트 태그는 있는데 window.kakao 객체가 준비되었는지 확인
            if (window.kakao && window.kakao.maps) {
                isScriptLoaded = true;
                setIsLoaded(true);
            } else {
                // 스크립트는 있지만 아직 로드 중
                isScriptLoading = true;
                const checkKakao = () => {
                    if (window.kakao && window.kakao.maps) {
                        isScriptLoaded = true;
                        isScriptLoading = false;
                        setIsLoaded(true);
                    } else {
                        setTimeout(checkKakao, 100);
                    }
                };
                checkKakao();
            }
            return;
        }

        // 새로운 스크립트 로드 시작
        isScriptLoading = true;
        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_MAP_API_KEY}&autoload=false&libraries=services`;
        script.async = true;

        script.onload = () => {
            window.kakao.maps.load(() => {
                isScriptLoaded = true;
                isScriptLoading = false;
                setIsLoaded(true);
            });
        };

        script.onerror = () => {
            console.error("Failed to load Kakao Maps script.");
            isScriptLoading = false;
            setIsLoaded(false);
        };

        document.head.appendChild(script);

    }, []); // 이 useEffect는 최초에 단 한 번만 실행되어야 합니다.

    return (
        <KakaoMapsScriptContext.Provider value={{ isLoaded }}>
            {children}
        </KakaoMapsScriptContext.Provider>
    );
};

export default KakaoMapsScriptContext;
