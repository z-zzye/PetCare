import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/community" element={<div className="page-placeholder">커뮤니티 페이지</div>} />
            <Route path="/shop" element={<div className="page-placeholder">쇼핑 페이지</div>} />
            <Route path="/service" element={<div className="page-placeholder">서비스 페이지</div>} />
            <Route path="/mypage" element={<div className="page-placeholder">마이페이지</div>} />
            <Route path="/cart" element={<div className="page-placeholder">장바구니</div>} />
            <Route path="/login" element={<div className="page-placeholder">로그인</div>} />
            <Route path="/signup" element={<div className="page-placeholder">회원가입</div>} />
            <Route path="/search" element={<div className="page-placeholder">검색 결과</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
