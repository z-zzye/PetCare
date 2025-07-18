// frontend/src/components/board/BoardWrite.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header';
import CrawlingBoardWrite from './CrawlingBoardWrite';
import './BoardCommon.css';
import { boardConfig } from './boardConfig';

const BoardWrite = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCrawlingForm, setShowCrawlingForm] = useState(false);

  // 권한별 선택 가능한 카테고리만 노출
  const availableCategories = Object.entries(boardConfig).filter(
    ([key, config]) => config.allowedRoles.includes(role)
  );

  // 인기 해시태그 목록 가져오기
  useEffect(() => {
    fetchPopularHashtags();
  }, []);

  const fetchPopularHashtags = async () => {
    try {
      const response = await fetch('/api/boards/hashtags/for-write');
      if (response.ok) {
        const data = await response.json();
        setHashtags(data);
      }
    } catch (error) {
      console.error('인기 해시태그 로딩 실패:', error);
    }
  };

  const handleHashtagToggle = (hashtag) => {
    setSelectedHashtags((prev) => {
      const isSelected = prev.includes(hashtag);
      if (isSelected) {
        return prev.filter((h) => h !== hashtag);
      } else {
        // 최대 5개까지만 선택 가능
        if (prev.length >= 5) {
          alert('최대 5개까지만 선택할 수 있습니다.');
          return prev;
        }
        return [...prev, hashtag];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      alert('게시판 카테고리를 선택해주세요.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/members/login');
      return;
    }

    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          boardKind: category.toUpperCase(),
          hashtags: selectedHashtags,
        }),
      });

      if (response.ok) {
        alert('게시글이 성공적으로 등록되었습니다.');
        navigate(`/board/${category}`);
      } else {
        alert('게시글 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 등록 오류:', error);
      alert('게시글 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="board-container">
        <h1 className="board-title">글 작성</h1>
        
        {/* 크롤링 버튼 */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setShowCrawlingForm(!showCrawlingForm)}
            className="board-btn"
            style={{ marginRight: '10px' }}
          >
            {showCrawlingForm ? '일반 작성으로' : '크롤링으로 작성'}
          </button>
        </div>

        {showCrawlingForm ? (
          <CrawlingBoardWrite
            boardKind={category.toUpperCase()}
            onClose={() => setShowCrawlingForm(false)}
            onSuccess={(boardId) => {
              alert('게시글이 성공적으로 작성되었습니다.');
              navigate(`/board/${category}`);
            }}
          />
        ) : (
          <form onSubmit={handleSubmit} className="board-form">
          <div className="board-form-group">
            <label className="board-form-label">게시판 카테고리</label>
            <select
              className="board-form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">카테고리 선택</option>
              {availableCategories.map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>
          <div className="board-form-group">
            <label htmlFor="title" className="board-form-label">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="board-form-input"
              required
            />
          </div>
          <div className="board-form-group">
            <label htmlFor="content" className="board-form-label">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="board-form-textarea"
              required
            />
          </div>

          {/* 해시태그 선택 섹션 */}
          <div className="board-form-group">
            <label className="board-form-label">해시태그 선택 (선택사항)</label>
            <div className="hashtag-selection-info">
              선택된 해시태그: {selectedHashtags.length}/5
            </div>
            <div className="hashtag-grid">
              {hashtags.map((hashtag, index) => {
                const isSelected = selectedHashtags.includes(hashtag);
                return (
                  <button
                    key={index}
                    type="button"
                    className={`hashtag-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleHashtagToggle(hashtag)}
                  >
                    #{hashtag}
                  </button>
                );
              })}
            </div>
            {selectedHashtags.length > 0 && (
              <div className="selected-hashtags">
                <strong>선택된 해시태그:</strong>
                <div className="selected-hashtags-list">
                  {selectedHashtags.map((hashtag, index) => (
                    <span key={index} className="selected-hashtag">
                      #{hashtag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="board-btn" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </button>
        </form>
        )}
      </div>
    </>
  );
};

export default BoardWrite;
