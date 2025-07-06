import React from 'react';
import { Link } from 'react-router-dom';
import './AdminPage.css';

const AdminPage = () => {
  return (
    <div className="admin-page">
      <div className="admin-container">
        <h1 className="admin-title">관리자 페이지</h1>
        <div className="admin-menu-grid">
          <Link to="/admin/profanity" className="admin-menu-item">
            <div className="admin-menu-icon">🚫</div>
            <h3>비속어 관리</h3>
            <p>클린봇 시스템의 비속어 목록을 관리합니다</p>
          </Link>
          <Link to="/admin/boards" className="admin-menu-item">
            <div className="admin-menu-icon">📝</div>
            <h3>게시판 관리</h3>
            <p>게시글과 댓글을 관리합니다</p>
          </Link>
          <Link to="/admin/users" className="admin-menu-item">
            <div className="admin-menu-icon">👥</div>
            <h3>사용자 관리</h3>
            <p>회원 정보를 관리합니다</p>
          </Link>
          <Link to="/admin/trails" className="admin-menu-item">
            <div className="admin-menu-icon">🏃‍♂️</div>
            <h3>산책로 관리</h3>
            <p>산책로 정보를 관리합니다</p>
          </Link>
          <Link to="/admin/shop" className="admin-menu-item">
            <div className="admin-menu-icon">🛒</div>
            <h3>쇼핑몰 관리</h3>
            <p>주문, 상품, 회원 구매 이력을 관리합니다</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
