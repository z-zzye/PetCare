import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';// BrowserRouter를 직접 사용합니다.
import { AuthProvider } from './contexts/AuthContext';
import { KakaoMapsScriptProvider } from './contexts/KakaoMapsScriptContext';
import MemberLogin from './components/MemberLogin.jsx';
import MemberSignUp from './components/MemberSignUp.jsx';
import MemberUpdate from './components/MemberUpdate.jsx';
import MemberSocialExtra from './components/MemberSocialExtra.jsx';
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler.jsx';
import MainPage from './components/MainPage.jsx';
import FindId from './components/FindId.jsx';
import FindPw from './components/FindPw.jsx';
import ResetPw from './components/ResetPw.jsx';
import ShoppingPage from './components/shop/Shopping.jsx';
import AuctionPage from './components/shop/Auction.jsx';
import ItemRegister from './components/shop/ItemRegister.jsx';
import ItemDetail from './components/shop/ItemDetail.jsx';
import WhatsInMyCart from './components/shop/WhatsInMyCart.jsx';
import ItemModify from './components/shop/ItemModify.jsx';
import OrderPage from './components/shop/OrderPage';
import OrderCompletePage from './components/shop/OrderCompletePage.jsx';
import WalkingTrailListPage from './components/WalkingTrailListPage';
import WalkingTrailDetailPage from './components/WalkingTrailDetailPage';
import WalkingTrailCreatePage from './components/WalkingTrailCreatePage';
import MyPage from './components/mypage/Mypage.jsx';
import OAuthRedirect from './components/OAuthRedirect.jsx';
import PetRegister from './components/mypage/PetRegister.jsx';
import PetUpdate from './components/mypage/PetUpdate.jsx';
import MapServicePage from './pages/MapServicePage';
import PaymentMethodPage from './pages/PaymentMethodPage';//결제창
import TossAuthSuccessPage from './pages/TossAuthSuccessPage';//토스관련완료확인창
import PaymentFailPage from './pages/PaymentFailPage.jsx'; //토스페이먼츠 쇼핑몰 구매 실패창


import { BoardMain, BoardDetail, BoardWrite, BoardEdit, BoardList } from './components/board';

function App() {
  return (
   <AuthProvider>
   <KakaoMapsScriptProvider>
    <BrowserRouter> {/* Router 대신 BrowserRouter 사용 */}
      <Routes>
        <Route path="/members/login" element={<MemberLogin />} />
        <Route path="/members/new" element={<MemberSignUp />} />
        <Route path="/members/update" element={<MemberUpdate />} />
        <Route path="/members/social-extra" element={<MemberSocialExtra />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
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
        <Route path="/shop/item/register" element={<ItemRegister />} />
        <Route path="/shop/shopping/item/:itemId" element={<ItemDetail />} />
        <Route path="/shop/cart" element={<WhatsInMyCart />} />
        <Route path="/shop/item/edit/:itemId" element={<ItemModify />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/order/complete" element={<OrderCompletePage />} />

        <Route path="/trails" element={<WalkingTrailListPage />} />
        <Route path="/trails/:trailId" element={<WalkingTrailDetailPage />} />
        <Route path="/create-trail" element={<WalkingTrailCreatePage />} />

        {/* 결제 시스템 관련 라우팅 */}
        <Route path="/payment-management" element={<PaymentMethodPage />} />
        <Route path="/toss-auth-success" element={<TossAuthSuccessPage />} />
        <Route path="/payment/fail" element={<PaymentFailPage />} />
        <Route path="/payment/success" element={<OrderCompletePage />} />
      </Routes>
    </BrowserRouter>
   </KakaoMapsScriptProvider>
   </AuthProvider>
  );
}

export default App;
