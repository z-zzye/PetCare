import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { KakaoMapsScriptProvider } from './contexts/KakaoMapsScriptContext';

// 회원 관련 컴포넌트
import FindId from './components/FindId.jsx';
import FindPw from './components/FindPw.jsx';
import MemberLogin from './components/MemberLogin.jsx';
import MemberSignUp from './components/MemberSignUp.jsx';
import MemberSocialExtra from './components/MemberSocialExtra.jsx';
import MemberUpdate from './components/MemberUpdate.jsx';
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler.jsx';
import OAuthRedirect from './components/OAuthRedirect.jsx';
import ResetPw from './components/ResetPw.jsx';

// 메인 페이지
import MainPage from './components/MainPage.jsx';

// 마이페이지 관련 컴포넌트
import MyPage from './components/mypage/Mypage.jsx';
import PaymentMethodPage from './components/mypage/PaymentMethodPage';
import PetRegister from './components/mypage/PetRegister.jsx';
import PetUpdate from './components/mypage/PetUpdate.jsx';

// 채팅 관련 컴포넌트
import ChatPage from './components/chat/ChatPage.jsx';
import Chatbot from './components/chatbot/Chatbot';

// 쇼핑 관련 컴포넌트
import AuctionPage from './components/shop/Auction.jsx';
import ItemDetail from './components/shop/ItemDetail.jsx';
import ItemModify from './components/shop/ItemModify.jsx';
import ItemRegister from './components/shop/ItemRegister.jsx';
import MyOrders from './components/shop/MyOrders.jsx';
import OrderCompletePage from './components/shop/OrderCompletePage.jsx';
import OrderDetail from './components/shop/OrderDetail.jsx';
import OrderPage from './components/shop/OrderPage.jsx';
import ShoppingPage from './components/shop/Shopping.jsx';
import WhatsInMyCart from './components/shop/WhatsInMyCart.jsx';

// 산책로 관련 컴포넌트
import WalkingTrailCreatePage from './components/WalkingTrailCreatePage';
import WalkingTrailDetailPage from './components/WalkingTrailDetailPage';
import WalkingTrailListPage from './components/WalkingTrailListPage';

// 게시판 관련 컴포넌트
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
import AutoVaxAdminPage from './components/admin/AutoVaxAdminPage.jsx';
import BoardAdminPage from './components/admin/boards/BoardAdminPage';
import ProfanityManagePage from './components/admin/ProfanityManagePage.jsx';
import ShopAdminPage from './components/admin/ShopAdminPage.jsx';
import UserAdminPage from './components/admin/UserAdminPage';
import HashtagManagePage from './components/admin/HashtagManagePage.jsx';

// 페이지 컴포넌트
import MapServicePage from './pages/MapServicePage';
import PaymentFailPage from './pages/PaymentFailPage.jsx';

// 챗봇 버튼 컴포넌트
const ChatbotButton = () => {
  const { isLoggedIn } = useAuth();
  const [showChatbot, setShowChatbot] = useState(false);

  // 로그인하지 않은 경우 버튼을 표시하지 않음
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <img
        src="/images/chatbotIcon.png"
        alt="챗봇"
        onClick={() => setShowChatbot(true)}
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 999,
          width: '80px',
          height: '80px',
          cursor: 'pointer',
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
        }}
        aria-label="챗봇 열기"
      />
      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <KakaoMapsScriptProvider>
        <BrowserRouter>
          <Routes>
            {/* 메인 페이지 */}
            <Route path="/" element={<MainPage />} />

            {/* 회원 관련 라우팅 */}
            <Route path="/members/login" element={<MemberLogin />} />
            <Route path="/members/new" element={<MemberSignUp />} />
            <Route path="/members/update" element={<MemberUpdate />} />
            <Route
              path="/members/social-extra"
              element={<MemberSocialExtra />}
            />
            <Route path="/find-id" element={<FindId />} />
            <Route path="/find-pw" element={<FindPw />} />
            <Route path="/reset-pw" element={<ResetPw />} />
            <Route
              path="/oauth2/redirect"
              element={<OAuth2RedirectHandler />}
            />
            <Route path="/oauth2/redirect" element={<OAuthRedirect />} />

            {/* 마이페이지 라우팅 */}
            <Route path="/members/mypage" element={<MyPage />} />
            <Route path="/members/pet-register" element={<PetRegister />} />
            <Route path="/members/pet-edit/:petId" element={<PetUpdate />} />
            <Route
              path="/members/payment-management"
              element={<PaymentMethodPage />}
            />

            {/* 채팅 라우팅 */}
            <Route path="/chat/:receiverId" element={<ChatPage />} />
            <Route path="/chat/room/:receiverId" element={<ChatPage />} />

            {/* 게시판 라우팅 */}
            <Route path="/board" element={<BoardMain />} />
            <Route path="/board/write" element={<BoardWrite />} />
            <Route path="/board/:category" element={<BoardList />} />
            <Route path="/board/:category/:id" element={<BoardDetail />} />
            <Route path="/board/edit/:category/:id" element={<BoardEdit />} />

            {/* 쇼핑 관련 라우팅 */}
            <Route path="/shop/shopping" element={<ShoppingPage />} />
            <Route path="/shop/auction" element={<AuctionPage />} />
            <Route path="/shop/item/register" element={<ItemRegister />} />
            <Route
              path="/shop/shopping/item/:itemId"
              element={<ItemDetail />}
            />
            <Route path="/shop/cart" element={<WhatsInMyCart />} />
            <Route path="/shop/item/edit/:itemId" element={<ItemModify />} />
            <Route path="/shop/order" element={<OrderPage />} />
            <Route path="/shop/my-orders" element={<MyOrders />} />

            {/* 주문 관련 라우팅 */}
            <Route path="/order" element={<OrderPage />} />
            <Route path="/order/complete" element={<OrderCompletePage />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />

            {/* 산책로 라우팅 */}
            <Route path="/trails" element={<WalkingTrailListPage />} />
            <Route
              path="/trails/:trailId"
              element={<WalkingTrailDetailPage />}
            />
            <Route path="/create-trail" element={<WalkingTrailCreatePage />} />

            {/* 지도 서비스 */}
            <Route path="/place" element={<MapServicePage />} />

            {/* 결제 시스템 관련 라우팅 */}
            <Route path="/payment/fail" element={<PaymentFailPage />} />
            <Route path="/payment/success" element={<OrderCompletePage />} />

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
            <Route
              path="/admin/shop"
              element={
                <AdminRoute>
                  <ShopAdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/autovax"
              element={
                <AdminRoute>
                  <AutoVaxAdminPage />
            <Route
              path="/admin/hashtags"
              element={
                <AdminRoute>
                  <HashtagManagePage />
                </AdminRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        {/* 로그인한 사용자만 챗봇 버튼 표시 */}
        <ChatbotButton />
      </KakaoMapsScriptProvider>
    </AuthProvider>
  );
}

export default App;
