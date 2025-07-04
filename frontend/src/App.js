import React from 'react'; // useEffect를 React에서 임포트해야 합니다.
import { BrowserRouter, Route, Routes } from 'react-router-dom'; // BrowserRouter를 직접 사용합니다.
import FindId from './components/FindId.jsx';
import FindPw from './components/FindPw.jsx';
import ResetPw from './components/ResetPw.jsx';
import MainPage from './components/MainPage.jsx';
import MemberLogin from './components/MemberLogin.jsx';
import MemberSignUp from './components/MemberSignUp.jsx';
import MemberSocialExtra from './components/MemberSocialExtra.jsx';
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler.jsx';
import OAuthRedirect from './components/OAuthRedirect.jsx';
import AuctionPage from './components/Shop/Auction.jsx'; // 경로 및 대소문자 재확인
import ShoppingPage from './components/Shop/Shopping.jsx'; // 경로 및 대소문자 재확인
import WalkingTrailCreatePage from './components/WalkingTrailCreatePage';
import WalkingTrailDetailPage from './components/WalkingTrailDetailPage';
import WalkingTrailListPage from './components/WalkingTrailListPage';
import MyPage from './components/mypage/Mypage.jsx';
import PetRegister from './components/mypage/PetRegister.jsx';
import PetUpdate from './components/mypage/PetUpdate.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { KakaoMapsScriptProvider } from './contexts/KakaoMapsScriptContext';
import MapServicePage from './pages/MapServicePage'; // 경로 확인 필요 (src/pages/MapServicePage.jsx)

import PaymentMethodPage from './pages/PaymentMethodPage'; // 결제창
import TossAuthSuccessPage from './pages/TossAuthSuccessPage'; // 토스관련완료확인창

import BoardAdminPage from './components/admin/boards/BoardAdminPage';

import {
  BoardDetail,
  BoardEdit,
  BoardList,
  BoardMain,
  BoardWrite,
} from './components/board';

// 관리자 페이지 컴포넌트
import AdminPage from './components/admin/AdminPage.jsx';
import AdminRoute from './components/admin/AdminRoute.jsx';
import ProfanityManagePage from './components/admin/ProfanityManagePage.jsx';

function App() {
  return (
    <AuthProvider>
      <KakaoMapsScriptProvider>
        <BrowserRouter>
          {' '}
          {/* Router 대신 BrowserRouter 사용 */}
          <Routes>
            <Route path="/members/login" element={<MemberLogin />} />
            <Route path="/members/new" element={<MemberSignUp />} />
            <Route
              path="/members/social-extra"
              element={<MemberSocialExtra />}
            />
            <Route
              path="/oauth2/redirect"
              element={<OAuth2RedirectHandler />}
            />
            <Route path="/find-id" element={<FindId />} />
            <Route path="/find-pw" element={<FindPw />} />
            <Route path="/reset-pw" element={<ResetPw />} />
            <Route path="/" element={<MainPage />} />
            /*소셜로그인 리다이렉트용*/
            <Route path="/oauth2/redirect" element={<OAuthRedirect />} />
            /* 마이페이지*/
            <Route path="/members/mypage" element={<MyPage />} />
            <Route path="/members/pet-register" element={<PetRegister />} />
            <Route path="/members/pet-edit/:petId" element={<PetUpdate />} />
            <Route path="/place" element={<MapServicePage />} />
            <Route path="/board" element={<BoardMain />} />
            <Route path="/board/write" element={<BoardWrite />} />
            <Route path="/board/:category" element={<BoardList />} />
            <Route path="/board/:category/:id" element={<BoardDetail />} />
            <Route path="/board/edit/:category/:id" element={<BoardEdit />} />
            {/* 쇼핑 관련 라우팅 */}
            <Route path="/shop/shopping" element={<ShoppingPage />} />
            <Route path="/shop/auction" element={<AuctionPage />} />
            <Route path="/trails" element={<WalkingTrailListPage />} />
            <Route
              path="/trails/:trailId"
              element={<WalkingTrailDetailPage />}
            />
            <Route path="/create-trail" element={<WalkingTrailCreatePage />} />
            {/* 결제 시스템 관련 라우팅 */}
            <Route path="/payment-management" element={<PaymentMethodPage />} />
            <Route
              path="/toss-auth-success"
              element={<TossAuthSuccessPage />}
            />
            {/* 관리자 페이지 라우팅 */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/profanity"
              element={
                <AdminRoute>
                  <ProfanityManagePage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/boards"
              element={
                <AdminRoute>
                  <BoardAdminPage />
                </AdminRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </KakaoMapsScriptProvider>
    </AuthProvider>
  );
}

export default App;
