// frontend/src/components/board/BoardEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BoardCommon.css';

const BoardEdit = () => {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 기존 게시글 데이터 불러오기
  useEffect(() => {
    fetch(`/api/boards/${category}/${id}`)
      .then(res => res.json())
      .then(data => {
        setTitle(data.title);
        setContent(data.content);
      })
      .catch(error => {
        alert('게시글 정보를 불러오는 중 오류가 발생했습니다.');
        navigate(`/board/${category}`);
      });
  }, [category, id, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = { title, content };

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/members/login');
      return;
    }

    fetch(`/api/boards/${category}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    })
      .then(res => {
        if (res.ok) {
          alert('게시글이 수정되었습니다.');
          navigate(`/board/${category}/${id}`);
        } else if (res.status === 401 || res.status === 403) {
          alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
          localStorage.removeItem('token');
          navigate('/members/login');
        } else {
          alert('게시글 수정에 실패했습니다.');
        }
      });
  };

  return (
    <div className="board-container">
      <h1 className="board-title">글 수정</h1>
      <form onSubmit={handleSubmit} className="board-form">
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
        <button type="submit" className="board-btn">수정 완료</button>
      </form>
    </div>
  );
};

export default BoardEdit;