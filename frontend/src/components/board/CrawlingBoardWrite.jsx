import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import './BoardCommon.css';

const CrawlingBoardWrite = ({ boardKind, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    boardKind: boardKind || 'INFO',
    hashtags: [],
    titleSelector: '',
    contentSelector: '',
    imageSelector: ''
  });
  
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [hashtagSearchTerm, setHashtagSearchTerm] = useState('');
  const [showHashtagDropdown, setShowHashtagDropdown] = useState(false);
  const [filteredHashtags, setFilteredHashtags] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHashtagChange = (e) => {
    const hashtags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      hashtags
    }));
  };

  // 인기 해시태그 가져오기
  useEffect(() => {
    fetchPopularHashtags();
  }, []);

  const fetchPopularHashtags = async () => {
    try {
      const response = await fetch('/api/boards/hashtags/for-write');
      if (response.ok) {
        const data = await response.json();
        setHashtags(data);
        setFilteredHashtags(data.slice(0, 10)); // 상위 10개만 표시
      }
    } catch (error) {
      console.error('인기 해시태그 로딩 실패:', error);
    }
  };

  // 해시태그 검색
  const searchHashtags = async () => {
    if (!hashtagSearchTerm.trim()) {
      setFilteredHashtags(hashtags.slice(0, 10));
      return;
    }

    try {
      const response = await fetch(`/api/boards/hashtags/search?keyword=${encodeURIComponent(hashtagSearchTerm.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredHashtags(data);
      }
    } catch (error) {
      console.error('해시태그 검색 실패:', error);
    }
  };

  // 해시태그 토글 (선택/해제)
  const handleHashtagToggle = (hashtag) => {
    setSelectedHashtags(prev => {
      const isSelected = prev.includes(hashtag);
      if (isSelected) {
        return prev.filter(tag => tag !== hashtag);
      } else {
        if (prev.length >= 3) {
          alert('해시태그는 최대 3개까지 선택할 수 있습니다.');
          return prev;
        }
        return [...prev, hashtag];
      }
    });
  };

  // 해시태그 검색어 변경 시 검색 실행
  useEffect(() => {
    const timer = setTimeout(() => {
      searchHashtags();
    }, 300);

    return () => clearTimeout(timer);
  }, [hashtagSearchTerm]);

  // 선택된 해시태그를 formData에 반영
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      hashtags: selectedHashtags
    }));
  }, [selectedHashtags]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showHashtagDropdown && !event.target.closest('.hashtag-dropdown-container')) {
        setShowHashtagDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHashtagDropdown]);

  // 크롤링 미리보기
  const handlePreview = async () => {
    if (!formData.url) {
      setError('URL을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('크롤링 요청:', {
        url: formData.url,
        titleSelector: formData.titleSelector,
        contentSelector: formData.contentSelector
      });

      const response = await axios.get('/crawling/preview', {
        params: {
          url: formData.url,
          titleSelector: formData.titleSelector,
          contentSelector: formData.contentSelector
        }
      });

      console.log('크롤링 결과:', response.data);
      setPreview(response.data);
    } catch (error) {
      setError('크롤링 미리보기에 실패했습니다. URL을 확인해주세요.');
      console.error('Preview error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 사이트별 설정 가져오기
  const handleGetConfig = async () => {
    if (!formData.url) {
      setError('URL을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get('/crawling/config', {
        params: { url: formData.url }
      });

      const config = response.data;
      setFormData(prev => ({
        ...prev,
        titleSelector: config.titleSelector || '',
        contentSelector: config.contentSelector || '',
        imageSelector: config.imageSelector || ''
      }));
    } catch (error) {
      setError('사이트 설정을 가져오는데 실패했습니다.');
      console.error('Config error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 게시글 작성
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.url || !formData.title) {
      setError('URL과 제목을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/crawling/create-board', formData);
      
      if (response.data > 0) {
        alert('게시글이 성공적으로 작성되었습니다.');
        // boardId와 함께 선택된 게시판 정보도 전달
        onSuccess && onSuccess(response.data, formData.boardKind);
        onClose && onClose();
      } else {
        setError('게시글 작성에 실패했습니다.');
      }
    } catch (error) {
      setError('게시글 작성 중 오류가 발생했습니다.');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crawling-board-write">
      <h2>크롤링으로 게시글 작성</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>크롤링할 URL</label>
          <input
            type="url"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            placeholder="https://example.com"
            required
          />
        </div>

        <div className="form-group">
          <label>게시글 제목</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="게시글 제목을 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label>게시판 종류</label>
          <select
            name="boardKind"
            value={formData.boardKind}
            onChange={handleInputChange}
          >
            <option value="INFO">정보</option>
            <option value="FREE">자유</option>
            <option value="QNA">질문</option>
            <option value="WALKWITH">산책모임</option>
          </select>
        </div>

        <div className="form-group">
          <label>해시태그 선택 (최대 3개)</label>
          <div className="hashtag-selection-info">
            선택된 해시태그: {selectedHashtags.length}/3
          </div>
          
          <div className="hashtag-dropdown-container" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="해시태그 검색..."
              value={hashtagSearchTerm}
              onChange={(e) => setHashtagSearchTerm(e.target.value)}
              onFocus={() => setShowHashtagDropdown(true)}
              className="form-control"
              style={{ marginBottom: '10px' }}
            />

            {showHashtagDropdown && (
              <div
                className="hashtag-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {hashtagSearchTerm.trim() ? (
                  <>
                    <div
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#f8f9fa',
                        borderBottom: '1px solid #dee2e6',
                        fontSize: '0.8rem',
                        color: '#6c757d',
                        fontWeight: '500',
                      }}
                    >
                      "{hashtagSearchTerm}" 검색 결과
                    </div>
                    {filteredHashtags.length > 0 ? (
                      filteredHashtags.map((hashtag, index) => (
                        <div
                          key={index}
                          onClick={() => handleHashtagToggle(hashtag)}
                          style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f3f4',
                            fontSize: '0.9rem',
                            color: '#495057',
                            backgroundColor: selectedHashtags.includes(hashtag) ? '#e3f2fd' : 'white',
                          }}
                          onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = selectedHashtags.includes(hashtag) ? '#e3f2fd' : '#f8f9fa')
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = selectedHashtags.includes(hashtag) ? '#e3f2fd' : 'white')
                          }
                        >
                          #{hashtag}
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: '15px',
                          textAlign: 'center',
                          color: '#6c757d',
                          fontSize: '0.9rem',
                        }}
                      >
                        검색 결과가 없습니다.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#f8f9fa',
                        borderBottom: '1px solid #dee2e6',
                        fontSize: '0.8rem',
                        color: '#6c757d',
                        fontWeight: '500',
                      }}
                    >
                      인기 해시태그 (상위 10개)
                    </div>
                    {filteredHashtags.length > 0 ? (
                      filteredHashtags.map((hashtag, index) => (
                        <div
                          key={index}
                          onClick={() => handleHashtagToggle(hashtag)}
                          style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f3f4',
                            fontSize: '0.9rem',
                            color: '#495057',
                            backgroundColor: selectedHashtags.includes(hashtag) ? '#e3f2fd' : 'white',
                          }}
                          onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = selectedHashtags.includes(hashtag) ? '#e3f2fd' : '#f8f9fa')
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = selectedHashtags.includes(hashtag) ? '#e3f2fd' : 'white')
                          }
                        >
                          #{hashtag}
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: '15px',
                          textAlign: 'center',
                          color: '#6c757d',
                          fontSize: '0.9rem',
                        }}
                      >
                        인기 해시태그가 없습니다.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 선택된 해시태그 표시 */}
          {selectedHashtags.length > 0 && (
            <div className="selected-hashtags" style={{ marginTop: '10px' }}>
              <strong>선택된 해시태그:</strong>
              <div className="selected-hashtags-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                {selectedHashtags.map((hashtag, index) => (
                  <span key={index} className="selected-hashtag" style={{
                    backgroundColor: '#e3f2fd',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    #{hashtag}
                    <button
                      type="button"
                      onClick={() => handleHashtagToggle(hashtag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '0',
                        margin: '0'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 이미지 설정 */}
        <div className="form-group">
          <label>이미지 가져오기</label>
          <div className="image-options">
            <label className="radio-option">
              <input
                type="radio"
                name="imageOption"
                value="auto"
                defaultChecked
                onChange={() => setFormData(prev => ({ ...prev, imageSelector: '' }))}
              />
              <span>자동으로 모든 이미지 가져오기</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="imageOption"
                value="custom"
                onChange={() => setFormData(prev => ({ ...prev, imageSelector: '.post-image, .article-image' }))}
              />
              <span>특정 이미지만 가져오기 (CSS 선택자 입력)</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="imageOption"
                value="none"
                onChange={() => setFormData(prev => ({ ...prev, imageSelector: 'none' }))}
              />
              <span>이미지 가져오지 않기</span>
            </label>
          </div>
        </div>

        {/* 고급 설정 (접기/펼치기) */}
        <details className="advanced-settings">
          <summary>고급 설정 (CSS 선택자)</summary>
          <div className="advanced-content">
            <div className="form-group">
              <label>제목 CSS 선택자 (선택사항)</label>
              <input
                type="text"
                name="titleSelector"
                value={formData.titleSelector}
                onChange={handleInputChange}
                placeholder=".title, h1, .post-title"
              />
              <small>자동으로 감지되지 않을 때만 설정하세요</small>
            </div>

            <div className="form-group">
              <label>내용 CSS 선택자 (선택사항)</label>
              <input
                type="text"
                name="contentSelector"
                value={formData.contentSelector}
                onChange={handleInputChange}
                placeholder=".content, .post-content, .article-content"
              />
              <small>자동으로 감지되지 않을 때만 설정하세요</small>
            </div>

            <div className="form-group">
              <label>이미지 CSS 선택자 (선택사항)</label>
              <input
                type="text"
                name="imageSelector"
                value={formData.imageSelector}
                onChange={handleInputChange}
                placeholder="img, .post-image"
              />
              <small>이미지도 함께 가져오고 싶을 때 설정하세요</small>
            </div>
          </div>
        </details>

        <div className="button-group">
          <button
            type="button"
            onClick={handleGetConfig}
            disabled={loading}
            className="btn-secondary"
          >
            사이트 설정 가져오기
          </button>
          
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading}
            className="btn-secondary"
          >
            미리보기
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '처리중...' : '게시글 작성'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {preview && (
        <div className="preview-section">
          <h3>크롤링 미리보기</h3>
          <div className="preview-content">
            <h4>제목: {preview.title}</h4>
            <p>내용: {preview.content.substring(0, 300)}...</p>
            {preview.content.includes('[원본 이미지들]') && (
              <div className="preview-images">
                <h5>발견된 이미지들:</h5>
                <div className="image-list">
                  {preview.content.split('\n').filter(line => 
                    line.startsWith('http') && (
                      line.includes('.jpg') || line.includes('.png') || line.includes('.gif') || 
                      line.includes('.webp') || line.includes('.svg')
                    )
                  ).slice(0, 10).map((imageUrl, index) => (
                    <div key={index} className="preview-image">
                      <img 
                        src={imageUrl} 
                        alt={`미리보기 ${index + 1}`} 
                        onError={(e) => {
                          console.log('이미지 로드 실패:', imageUrl);
                          e.target.style.display = 'none';
                          e.target.parentElement.style.display = 'none';
                        }}
                        onLoad={() => console.log('이미지 로드 성공:', imageUrl)}
                        crossOrigin="anonymous"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
                <div className="image-count">
                  총 {preview.content.split('\n').filter(line => 
                    line.startsWith('http') && (
                      line.includes('.jpg') || line.includes('.png') || line.includes('.gif') || 
                      line.includes('.webp') || line.includes('.svg')
                    )
                  ).length}개의 이미지 발견
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrawlingBoardWrite; 