import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../../api/axios';
import './HashtagManagePage.css';
import Swal from 'sweetalert2';
import Header from '../Header.jsx';

const HashtagManagePage = () => {
  const [hashtags, setHashtags] = useState([]);
  const [filteredHashtags, setFilteredHashtags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [newHashtag, setNewHashtag] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const observer = useRef();
  const lastHashtagRef = useRef();

  const ITEMS_PER_PAGE = 20; // 한 번에 로드할 아이템 수

  // 무한 스크롤을 위한 마지막 요소 ref 설정
  const lastElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, { threshold: 0.1 }); // 10% 보이면 로드
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // 해시태그 로드
  const loadHashtags = useCallback(async (pageNum = 0, append = false) => {
    try {
      setLoading(true);
      const response = await axios.get('/hashtags', {
        params: {
          page: pageNum,
          size: ITEMS_PER_PAGE
        }
      });
      const newHashtags = response.data.content; // Page 객체의 content 필드
      const totalPages = response.data.totalPages;

      if (append) {
        setHashtags(prev => [...prev, ...newHashtags]);
      } else {
        setHashtags(newHashtags);
      }

      setHasMore(pageNum < totalPages - 1);
    } catch (error) {
      console.error('해시태그 로드 실패:', error);
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: '해시태그를 불러오는데 실패했습니다.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 검색 필터링
  useEffect(() => {
    if (searchKeyword.trim() === '') {
      setFilteredHashtags(hashtags);
    } else {
      const filtered = hashtags.filter(hashtag =>
        hashtag.tagName.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      setFilteredHashtags(filtered);
    }
  }, [hashtags, searchKeyword]);

  // 페이지 변경 시 로드
  useEffect(() => {
    if (page > 0) {
      loadHashtags(page, true);
    }
  }, [page, loadHashtags]);

  // 초기 로드
  useEffect(() => {
    loadHashtags(0, false);
  }, [loadHashtags]);

  // 해시태그 추가
  const handleAddHashtag = async () => {
    if (!newHashtag.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '입력 오류',
        text: '해시태그를 입력해주세요.'
      });
      return;
    }

    try {
      setIsAdding(true);
      await axios.post('/hashtags', { tagName: newHashtag.trim() });

      Swal.fire({
        icon: 'success',
        title: '성공',
        text: '해시태그가 추가되었습니다.'
      });

      setNewHashtag('');
      // 무한 스크롤 상태 초기화 후 목록 새로고침
      setPage(0);
      setHasMore(true);
      loadHashtags(0, false);
    } catch (error) {
      console.error('해시태그 추가 실패:', error);
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: error.response?.data?.message || '해시태그 추가에 실패했습니다.'
      });
    } finally {
      setIsAdding(false);
    }
  };

  // 해시태그 삭제
  const handleDeleteHashtag = async (hashtag) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '해시태그 삭제',
      text: `"${hashtag.tagName}" 해시태그를 삭제할까요?`,
      showCancelButton: true,
      confirmButtonText: '확인',
      cancelButtonText: '취소',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/hashtags/${hashtag.tagId}`);

        Swal.fire({
          icon: 'success',
          title: '성공',
          text: '해시태그가 삭제되었습니다.'
        });

        // 무한 스크롤 상태 초기화 후 목록 새로고침
        setPage(0);
        setHasMore(true);
        loadHashtags(0, false);
      } catch (error) {
        console.error('해시태그 삭제 실패:', error);
        Swal.fire({
          icon: 'error',
          title: '오류',
          text: error.response?.data?.message || '해시태그 삭제에 실패했습니다.'
        });
      }
    }
  };

  // Enter 키로 추가
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddHashtag();
    }
  };

  return (
    <>
    <Header />
    <div className="hashtag-manage-page">
      <div className="hashtag-manage-container">
        <h1 className="hashtag-manage-title">관심 태그 관리</h1>

        {/* 검색 및 추가 섹션 */}
        <div className="hashtag-control-section">
          <div className="hashtag-search-add">
            <div className="hashtag-search-box">
              <input
                type="text"
                placeholder="해시태그 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="hashtag-search-input"
              />
            </div>
            <div className="hashtag-add-box">
              <input
                type="text"
                placeholder="새 해시태그 입력..."
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="hashtag-add-input"
                disabled={isAdding}
              />
              <button
                onClick={handleAddHashtag}
                disabled={isAdding || !newHashtag.trim()}
                className="hashtag-add-button"
              >
                {isAdding ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>

        {/* 해시태그 목록 */}
        <div className="hashtag-list-section">
          <div className="hashtag-grid">
            {filteredHashtags.map((hashtag, index) => (
              <div
                key={hashtag.tagId}
                ref={index === filteredHashtags.length - 1 ? lastElementRef : null}
                className="hashtag-item"
                onClick={() => handleDeleteHashtag(hashtag)}
              >
                <div className="hashtag-content">
                  <span className="hashtag-name">#{hashtag.tagName}</span>
                  <span className="hashtag-count">({hashtag.tagCount})</span>
                </div>
                <div className="hashtag-delete-hint">클릭하여 삭제</div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="hashtag-loading">
              <div className="loading-spinner"></div>
              <p>해시태그를 불러오는 중...</p>
            </div>
          )}

          {!loading && filteredHashtags.length === 0 && (
            <div className="hashtag-empty">
              <p>표시할 해시태그가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default HashtagManagePage;
