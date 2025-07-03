// frontend/src/components/board/BoardWrite.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { boardConfig } from './boardConfig';
import './BoardCommon.css';
import Header from '../Header';

const BoardWrite = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 권한별 선택 가능한 카테고리만 노출
  const availableCategories = Object.entries(boardConfig)
    .filter(([key, config]) => config.allowedRoles.includes(role));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category) {
      alert('게시판 카테고리를 선택해주세요.');
      return;
    }
    const config = boardConfig[category];
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/members/login');
      return;
    }
    fetch('/api/boards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, boardKind: category.toUpperCase() }),
    })
      .then(res => {
        if (res.ok) {
          alert('게시글이 성공적으로 등록되었습니다.');
          navigate(`/board/${category}`);
        } else {
          alert('게시글 등록에 실패했습니다.');
        }
      });
  };

  return (
    <>
      <Header />
      <div className="board-container">
        <h1 className="board-title">글 작성</h1>
        <form onSubmit={handleSubmit} className="board-form">
          <div className="board-form-group">
            <label className="board-form-label">게시판 카테고리</label>
            <select
              className="board-form-input"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            >
              <option value="">카테고리 선택</option>
              {availableCategories.map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
          </div>
          <div className="board-form-group">
            <label htmlFor="title" className="board-form-label">제목</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="board-form-input"
              required
            />
          </div>
          <div className="board-form-group">
            <label htmlFor="content" className="board-form-label">내용</label>
            <textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="board-form-textarea"
              required
            />
          </div>
          <button type="submit" className="board-btn">저장</button>
        </form>
      </div>
    </>
  );
};

export default BoardWrite;
