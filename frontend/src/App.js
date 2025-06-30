import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MemberLogin from './components/MemberLogin.jsx';
import MemberSignUp from './components/MemberSignUp.jsx';
import MemberSocialExtra from './components/MemberSocialExtra.jsx';
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler.jsx';
import MainPage from './components/MainPage.jsx';
import FindId from './components/FindId.jsx';
import FindPw from './components/FindPw.jsx';
import ResetPw from './components/ResetPw.jsx';
import MapServicePage from './pages/MapServicePage'; // 지도 서비스 페이지

import BoardMain from './components/BoardMain';
import BoardDetail from './components/BoardDetail';
import BoardWrite from './components/BoardWrite';
import BoardEdit from './components/BoardEdit';

import WalkingTrailListPage from './components/WalkingTrailListPage';
import WalkingTrailDetailPage from './components/WalkingTrailDetailPage';
import WalkingTrailCreatePage from './components/WalkingTrailCreatePage';

function App() {
  // 지도를 그릴 준비가 되었는지 여부를 관리하는 상태
  const [isMapReady, setIsMapReady] = useState(false);

  // 이 useEffect는 앱이 시작될 때 단 한 번만 실행됩니다.
  useEffect(() => {
    // 이미 스크립트가 로드되었는지 확인하여 중복 로드를 방지합니다.
    if (window.kakao && window.kakao.maps) {
      setIsMapReady(true);
      return;
    }

    // 1. 카카오 맵 스크립트를 동적으로 생성하고, head에 추가합니다.
    const script = document.createElement('script');
    script.async = true;
    // .env 파일에 저장된 API 키를 사용합니다.
    // autoload=false는 스크립트 로드 후 자동으로 지도를 그리지 않게 하는 중요한 옵션입니다.
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_APP_KEY}&libraries=services&autoload=false`;
    document.head.appendChild(script);

    // 2. 스크립트 로딩이 완료되면 실행될 콜백 함수를 등록합니다.
    script.onload = () => {
      // window.kakao.maps.load()를 사용하여 지도를 그릴 준비가 되었을 때를 확인합니다.
      window.kakao.maps.load(() => {
        setIsMapReady(true);
        console.log('카카오맵 그리기 준비 완료!');
      });
    };
  }, []); // 의존성 배열이 비어있으므로 한 번만 실행됩니다.

  // 소셜 추가정보 페이지는 실제로는 사용자 정보를 prop으로 받아야 하지만, 예시로 빈 객체 전달
  return (
    <Router>
      <Routes>
        <Route path="/members/login" element={<MemberLogin />} />
        <Route path="/members/new" element={<MemberSignUp />} />
        <Route path="/members/social-extra" element={<MemberSocialExtra />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
        <Route path="/find-id" element={<FindId />} />
        <Route path="/find-pw" element={<FindPw />} />
        <Route path="/reset-pw" element={<ResetPw />} />
        <Route path="/" element={<MainPage />} />

        <Route path="/board" element={<BoardMain />} />
        <Route path="/board/:id" element={<BoardDetail />} />
        <Route path="/board/write" element={<BoardWrite />} />
        <Route path="/board/edit/:id" element={<BoardEdit />} />

        <Route path="/walking" element={<WalkingTrailListPage />} />
        <Route path="/walking/:trailId" element={<WalkingTrailDetailPage />} />
        <Route path="/create-trail" element={<WalkingTrailCreatePage />} />

        <Route
          path="/place"
          element={
            // isMapReady가 true일 때만 지도 페이지를 보여주고,
            // 그렇지 않으면 로딩 메시지를 보여줍니다.
            isMapReady ? <MapServicePage /> : <div>지도를 불러오는 중입니다...</div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
