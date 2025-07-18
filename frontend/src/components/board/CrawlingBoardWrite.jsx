import React, { useState } from 'react';
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
        onSuccess && onSuccess(response.data);
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
          <label>크롤링할 URL:</label>
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
          <label>게시글 제목:</label>
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
          <label>게시판 종류:</label>
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
          <label>해시태그 (쉼표로 구분):</label>
          <input
            type="text"
            value={formData.hashtags.join(', ')}
            onChange={handleHashtagChange}
            placeholder="해시태그1, 해시태그2, 해시태그3"
          />
        </div>

        {/* 이미지 설정 */}
        <div className="form-group">
          <label>이미지 가져오기:</label>
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
              <label>제목 CSS 선택자 (선택사항):</label>
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
              <label>내용 CSS 선택자 (선택사항):</label>
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
              <label>이미지 CSS 선택자 (선택사항):</label>
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