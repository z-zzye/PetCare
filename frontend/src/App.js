import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { KakaoMapsScriptProvider } from './contexts/KakaoMapsScriptContext';

// 회원 관련
import MemberLogin from './components/MemberLogin.jsx';
import MemberSignUp from './components/MemberSignUp.jsx';
import MemberUpdate from './components/MemberUpdate.jsx';
import MemberSocialExtra from './components/MemberSocialExtra.jsx';
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler.jsx';
import OAuthRedirect from './components/OAuthRedirect.jsx';
import FindId from './components/FindId.jsx';
import FindPw from './components/FindPw.jsx';
import ResetPw from './components/ResetPw.jsx';
import MyPage from './components/mypage/Mypage.jsx';
import PetRegister from './components/mypage/PetRegister.jsx';
import PetUpdate from './components/mypage/PetUpdate.jsx';
import PaymentMethodPage from './components/mypage/PaymentMethodPage.jsx';

// 메인 페이지
import MainPage from './components/MainPage.jsx';

// 쇼핑/경매
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
import AuctionDeliveryPage from './components/shop/AuctionDeliveryPage';
import MyAuctionHistory from './components/shop/MyAuctionHistory';

// 산책로
import WalkingTrailListPage from './components/WalkingTrailListPage.jsx';
import WalkingTrailDetailPage from './components/WalkingTrailDetailPage.jsx';
import WalkingTrailCreatePage from './components/WalkingTrailCreatePage.jsx';

// 채팅
import ChatPage from './components/chat/ChatPage.jsx';

// 게시판
import {
  BoardDetail,
  BoardEdit,
  BoardList,
  BoardMain,
  BoardWrite,
} from './components/board';

// 관리자 페이지
import AdminPage from './components/admin/AdminPage.jsx';
import AdminRoute from './components/admin/AdminRoute.jsx';
import ProfanityManagePage from './components/admin/ProfanityManagePage.jsx';
import UserAdminPage from './components/admin/UserAdminPage.jsx';
import ShopAdminPage from './components/admin/ShopAdminPage.jsx';
import AuctionAdminPage from './components/admin/AuctionAdminPage.jsx';
import BoardAdminPage from './components/admin/boards/BoardAdminPage.jsx';

// 지도 및 결제
import MapServicePage from './pages/MapServicePage.jsx';
import PaymentFailPage from './pages/PaymentFailPage.jsx';
import TossAuthSuccessPage from './pages/TossAuthSuccessPage.jsx';

function App() {
  return (
    <AuthProvider>
      <KakaoMapsScriptProvider>
        <BrowserRouter>
          <Routes>
            {/* 회원 */}
            <Route path="/members/login" element={<MemberLogin />} />
            <Route path="/members/new" element={<MemberSignUp />} />
            <Route path="/members/update" element={<MemberUpdate />} />
            <Route path="/members/social-extra" element={<MemberSocialExtra />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
            <Route path="/find-id" element={<FindId />} />
            <Route path="/find-pw" element={<FindPw />} />
            <Route path="/reset-pw" element={<ResetPw />} />
            <Route path="/members/mypage" element={<MyPage />} />
            <Route path="/members/pet-register" element={<PetRegister />} />
            <Route path="/members/pet-edit/:petId" element={<PetUpdate />} />

            {/* 메인 */}
            <Route path="/" element={<MainPage />} />
            <Route path="/oauth2/redirect" element={<OAuthRedirect />} />

            {/* 쇼핑/경매 */}
            <Route path="/shop/shopping" element={<ShoppingPage />} />
            <Route path="/shop/auction" element={<AuctionPage />} />
            <Route path="/shop/auction/register" element={<AuctionItemRegister />} />
            <Route path="/shop/auction/register/:itemId" element={<AuctionItemRegister />} />
            <Route path="/shop/item/register" element={<ItemRegister />} />
            <Route path="/shop/shopping/item/:itemId" element={<ItemDetail />} />
             <Route path="/shop/item/edit/:itemId" element={<ItemModify />} />
             <Route path="/shop/cart" element={<WhatsInMyCart />} />
             <Route path="/order" element={<OrderPage />} />
             <Route path="/order/complete" element={<OrderCompletePage />} />
             <Route path="/orders/:orderId" element={<OrderDetail />} />
             <Route path="/shop/my-orders" element={<MyOrders />} />
            <Route path="/auction/:auctionItemId" element={<AuctionRoom />} />
            <Route path="/auction/delivery" element={<AuctionDeliveryPage />} />
            <Route path="/shop/my-auction-history" element={<MyAuctionHistory />} />

            {/* 산책 */}
            <Route path="/trails" element={<WalkingTrailListPage />} />
            <Route path="/trails/:trailId" element={<WalkingTrailDetailPage />} />
            <Route path="/create-trail" element={<WalkingTrailCreatePage />} />

            {/* 결제 */}
            <Route path="/payment-management" element={<PaymentMethodPage />} />
            <Route path="/payment/fail" element={<PaymentFailPage />} />
            <Route path="/payment/success" element={<OrderCompletePage />} />
            <Route path="/toss-auth-success" element={<TossAuthSuccessPage />} />

            {/* 게시판 */}
            <Route path="/board" element={<BoardMain />} />
            <Route path="/board/write" element={<BoardWrite />} />
            <Route path="/board/:category" element={<BoardList />} />
            <Route path="/board/:category/:id" element={<BoardDetail />} />
            <Route path="/board/edit/:category/:id" element={<BoardEdit />} />

            {/* 채팅 */}
            <Route path="/chat/room/:receiverId" element={<ChatPage />} />

            {/* 지도 */}
            <Route path="/place" element={<MapServicePage />} />

            {/* 관리자 */}
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="/admin/profanity" element={<AdminRoute><ProfanityManagePage /></AdminRoute>} />
            <Route path="/admin/boards" element={<AdminRoute><BoardAdminPage /></AdminRoute>} />
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
