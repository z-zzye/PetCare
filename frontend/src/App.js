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
import WalkingTrailListPage from './components/WalkingTrailListPage';
import WalkingTrailDetailPage from './components/WalkingTrailDetailPage';
import WalkingTrailCreatePage from './components/WalkingTrailCreatePage';
import MyPage from './components/mypage/Mypage.jsx';
import OAuthRedirect from './components/OAuthRedirect.jsx';
import PetRegister from './components/mypage/PetRegister.jsx';
import PetUpdate from './components/mypage/PetUpdate.jsx';
import MapServicePage from './pages/MapServicePage';
import PaymentFailPage from './pages/PaymentFailPage.jsx'; //토스페이먼츠 쇼핑몰 구매 실패창
import PaymentMethodPage from './components/mypage/PaymentMethodPage';
import ChatPage from './components/chat/ChatPage.jsx'; //채팅창

//쇼핑/경매
import ItemRegister from './components/shop/ItemRegister.jsx';
import ItemDetail from './components/shop/ItemDetail.jsx';
import WhatsInMyCart from './components/shop/WhatsInMyCart.jsx';
import ItemModify from './components/shop/ItemModify.jsx';
import OrderPage from './components/shop/OrderPage.jsx';
import OrderCompletePage from './components/shop/OrderCompletePage.jsx';
import OrderDetail from './components/shop/OrderDetail.jsx';
import MyOrders from './components/shop/MyOrders.jsx';
import AuctionPage from './components/shop/Auction.jsx';
import ShoppingPage from './components/shop/Shopping.jsx';
import AuctionItemRegister from './components/shop/AuctionItemRegister.jsx';
import AuctionRoom from './components/shop/AuctionRoom.jsx';
import AuctionDeliveryPage from './components/shop/AuctionDeliveryPage.jsx';
import MyAuctionHistory from './components/shop/MyAuctionHistory.jsx';

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
import UserAdminPage from './components/admin/UserAdminPage';
import ShopAdminPage from './components/admin/ShopAdminPage.jsx';
import AuctionAdminPage from './components/admin/AuctionAdminPage.jsx';
import BoardAdminPage from './components/admin/boards/BoardAdminPage.jsx';

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


        {/*채팅*/}
        <Route path="/chat/:receiverId" element={<ChatPage />} />

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
        <Route path="/orders/:orderId" element={<OrderDetail />} />
        <Route path="/shop/order" element={<OrderPage />} />
        <Route path="/shop/my-orders" element={<MyOrders />} />

        {/* 경매 */}
        <Route path="/shop/auction" element={<AuctionPage />} />
        <Route path="/shop/auction/register" element={<AuctionItemRegister />} />
        <Route path="/shop/auction/register/:itemId" element={<AuctionItemRegister />} />
        <Route path="/auction/:auctionItemId" element={<AuctionRoom />} />
        <Route path="/auction/delivery" element={<AuctionDeliveryPage />} />
        <Route path="/shop/my-auction-history" element={<MyAuctionHistory />} />

        <Route path="/trails" element={<WalkingTrailListPage />} />
        <Route path="/trails/:trailId" element={<WalkingTrailDetailPage />} />
        <Route path="/create-trail" element={<WalkingTrailCreatePage />} />
        <Route path="/chat/room/:receiverId" element={<ChatPage />} />

        {/* 결제 시스템 관련 라우팅 */}
        <Route path="/payment/fail" element={<PaymentFailPage />} />
        <Route path="/payment/success" element={<OrderCompletePage />} />

        {/* 자동 결제 수단 관리 페이지 라우팅 */}
        <Route path="/payment-management" element={<PaymentMethodPage />} />
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
            <Route path="/admin/users" element={<UserAdminPage />} />
            <Route path="/admin/shop" element={<AdminRoute><ShopAdminPage /></AdminRoute>} />
            <Route path="/admin/auction" element={<AdminRoute><AuctionAdminPage /></AdminRoute>} />
            <Route path="/admin/auction/register" element={<AdminRoute><ItemRegister /></AdminRoute>} />
          </Routes>
        </BrowserRouter>
      </KakaoMapsScriptProvider>
    </AuthProvider>
  );
}

export default App;
