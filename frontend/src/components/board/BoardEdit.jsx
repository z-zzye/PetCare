// frontend/src/components/board/BoardEdit.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../Header';
import './BoardCommon.css';

const BoardEdit = () => {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [loading, setLoading] = useState(false);

  // 기존 게시글 데이터 불러오기
  useEffect(() => {
    fetch(`/api/boards/${category}/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
        // 기존 해시태그 설정
        if (data.hashtags) {
          setSelectedHashtags(data.hashtags.map((h) => h.tagName));
        }
      })
      .catch((error) => {
        alert('게시글 정보를 불러오는 중 오류가 발생했습니다.');
        navigate(`/board/${category}`);
      });
  }, [category, id, navigate]);

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
    setLoading(true);

    const updatedData = {
      title,
      content,
      hashtags: selectedHashtags,
    };

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/members/login');
      return;
    }

    try {
      const response = await fetch(`/api/boards/${category}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        alert('게시글이 수정되었습니다.');
        navigate(`/board/${category}/${id}`);
      } else if (response.status === 401 || response.status === 403) {
        alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
        localStorage.removeItem('token');
        navigate('/members/login');
      } else {
        alert('게시글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 수정 오류:', error);
      alert('게시글 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="board-container">
        <h1 className="board-title">글 수정</h1>
        <form onSubmit={handleSubmit} className="board-form">
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
            {loading ? '수정 중...' : '수정 완료'}
          </button>
        </form>
      </div>
    </>
  );
};

export default BoardEdit;
