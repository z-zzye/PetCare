import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import MemberLogin from './components/MemberLogin.jsx';
import MemberSignUp from './components/MemberSignUp.jsx';
import MemberSocialExtra from './components/MemberSocialExtra.jsx';
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler.jsx';
import MainPage from './components/MainPage.jsx';
import FindId from './components/FindId.jsx';
import FindPw from './components/FindPw.jsx';
import ResetPw from './components/ResetPw.jsx';
import ShoppingPage from './components/shop/Shopping.jsx';
import AuctionPage from './components/shop/Auction.jsx';
import ItemRegister from './components/shop/ItemRegister.jsx';
import MyPage from './components/mypage/Mypage.jsx';


// 문제 생기면 이 두줄이 문제일수있음
import MapServicePage from './pages/MapServicePage'; // 지도 서비스 페이지

import BoardMain from './components/BoardMain';
import BoardDetail from './components/BoardDetail';
import BoardWrite from './components/BoardWrite';
import BoardEdit from './components/BoardEdit';

function App() {
  // 소셜 추가정보 페이지는 실제로는 사용자 정보를 prop으로 받아야 하지만, 예시로 빈 객체 전달
  return (
   <AuthProvider>
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

        <Route path="/members/mypage" element={<MyPage />} />

        <Route path="/place" element={<MapServicePage />} />

        <Route path="/board" element={<BoardMain />} />
        <Route path="/board/:id" element={<BoardDetail />} />
        <Route path="/board/write" element={<BoardWrite />} />
        <Route path="/board/edit/:id" element={<BoardEdit />} />

        {/* 쇼핑 관련 라우팅 */}
        <Route path="/shop/shopping" element={<ShoppingPage />} />
        <Route path="/shop/auction" element={<AuctionPage />} />
        <Route path="/shop/item/register" element={<ItemRegister />} />
      </Routes>
    </Router>
   </AuthProvider>
  );
}

export default App;
