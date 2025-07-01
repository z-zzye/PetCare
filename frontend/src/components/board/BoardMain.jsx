// frontend/src/components/board/BoardMain.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { boardConfig } from './boardConfig';
import './BoardCommon.css';

const BoardMain = () => (
  <div className="board-container">
    <h1 className="board-title">커뮤니티</h1>
    <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
      {Object.entries(boardConfig).map(([key, config]) => (
        <Link key={key} to={`/board/${key}`} className="board-btn">{config.name}</Link>
      ))}
      <Link to="/board/write" className="board-btn board-btn-secondary">글 작성하기</Link>
    </div>
    {/* 전체글 목록은 추후 구현, 지금은 카테고리 버튼만 */}
    <div style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
      전체 커뮤니티 글 목록은 추후 구현 예정입니다.
    </div>
  </div>
);

export default BoardMain;