import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaClipboardList, 
  FaUsers, 
  FaShoppingCart, 
  FaGavel, 
  FaTags, 
  FaSyringe,
  FaPaw,
  FaStar
} from 'react-icons/fa';
import './AdminPage.css';
import Header from '../Header.jsx';

const AdminPage = () => {
  return (
    <>
    <Header />
    <div className="admin-page">
      <div className="admin-container">
        <h1 className="admin-title">
          <FaPaw className="admin-title-icon" />
          관리자 페이지
        </h1>
        <div className="admin-menu-grid">
          <Link to="/admin/profanity" className="admin-menu-item">
            <div className="admin-menu-icon">
              <FaShieldAlt />
            </div>
            <h3>비속어 관리</h3>
            <p>클린봇 시스템의 비속어 목록을 관리합니다</p>
          </Link>
          <Link to="/admin/boards" className="admin-menu-item">
            <div className="admin-menu-icon">
              <FaClipboardList />
            </div>
            <h3>게시판 관리</h3>
            <p>게시글과 댓글을 관리합니다</p>
          </Link>
          <Link to="/admin/users" className="admin-menu-item">
            <div className="admin-menu-icon">
              <FaUsers />
            </div>
            <h3>사용자 관리</h3>
            <p>회원 정보를 관리합니다</p>
          </Link>
          <Link to="/admin/shop" className="admin-menu-item">
            <div className="admin-menu-icon">
              <FaShoppingCart />
            </div>
            <h3>쇼핑몰 관리</h3>
            <p>주문, 상품, 회원 구매 이력을 관리합니다</p>
          </Link>
          <Link to="/admin/auction" className="admin-menu-item">
            <div className="admin-menu-icon">
              <FaGavel />
            </div>
            <h3>경매 관리</h3>
            <p>경매 상품과 입찰 현황을 관리합니다</p>
          </Link>
          <Link to="/admin/hashtags" className="admin-menu-item">
            <div className="admin-menu-icon">
              <FaTags />
            </div>
            <h3>관심 태그 관리</h3>
            <p>해시태그를 추가하고 삭제합니다</p>
          </Link>
          <Link to="/admin/autovax" className="admin-menu-item">
            <div className="admin-menu-icon">
              <FaSyringe />
            </div>
            <h3>자동 예약 관리</h3>
            <p>자동 예약 현황을 확인하고 접종 완료/취소를 처리합니다</p>
          </Link>
          <Link to="/admin/creator-apply" className="admin-menu-item">
            <div className="admin-menu-icon">
              <FaStar />
            </div>
            <h3>크리에이터 신청 확인</h3>
            <p>크리에이터 신청 현황을 확인하고 승인/거절을 처리합니다</p>
          </Link>
          <Link to="/admin/vet-apply" className="admin-menu-item">
            <div className="admin-menu-icon">🏥</div>
            <h3>수의사 신청 확인</h3>
            <p>수의사 신청 현황을 확인하고 승인/거절을 처리합니다</p>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminPage;
