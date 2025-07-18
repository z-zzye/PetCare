// frontend/src/components/board/BoardWrite.jsx
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header';
import './BoardCommon.css';
import { boardConfig } from './boardConfig';

const BoardWrite = () => {
  const { role, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quillRef = useRef();
  const quillInstance = useRef();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [hashtagSearchTerm, setHashtagSearchTerm] = useState('');
  const [showHashtagDropdown, setShowHashtagDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState([]); // 업로드 대기 중인 이미지들

  // 권한별 선택 가능한 카테고리만 노출 (useMemo로 최적화)
  const availableCategories = useMemo(
    () =>
      Object.entries(boardConfig).filter(([key, config]) =>
        config.allowedRoles.includes(role)
      ),
    [role]
  );

  // 로그인 체크 - 비로그인 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoggedIn) {
      alert('글을 작성하려면 로그인이 필요합니다.');
      navigate('/members/login');
      return;
    }
  }, [isLoggedIn, navigate]);

  // Quill 에디터 초기화
  useEffect(() => {
    if (!isLoggedIn) return; // 로그인하지 않은 경우 에디터 초기화하지 않음

    const initializeQuill = () => {
      if (quillRef.current && !quillInstance.current) {
        console.log('Quill 초기화 시작');

        // 기존 Quill 인스턴스와 모든 관련 요소들을 완전히 제거
        const container = quillRef.current;

        // 기존 Quill 인스턴스가 있다면 제거
        if (quillInstance.current) {
          quillInstance.current = null;
        }

        // 컨테이너 내의 모든 Quill 관련 요소 제거
        container.innerHTML = '';

        // 새로운 div 요소 생성
        const editorContainer = document.createElement('div');
        editorContainer.id = 'quill-editor-container';
        editorContainer.style.cssText = `
          min-height: 300px;
          height: auto;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: white;
          overflow: visible;
        `;
        container.appendChild(editorContainer);

        // Quill 에디터 설정
        const toolbarOptions = [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ];

        // 커스텀 이미지 핸들러
        const imageHandler = () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files[0];
            if (file) {
              try {
                // 파일 크기 확인 (5MB 제한)
                if (file.size > 5 * 1024 * 1024) {
                  alert('이미지 파일 크기는 5MB 이하여야 합니다.');
                  return;
                }

                // 파일 타입 확인
                if (!file.type.startsWith('image/')) {
                  alert('이미지 파일만 업로드 가능합니다.');
                  return;
                }

                // FileReader를 사용하여 Base64로 변환
                const reader = new FileReader();
                reader.onload = (e) => {
                  const base64Url = e.target.result;

                  // 임시로 이미지를 pendingImages에 저장
                  const tempImageId = Date.now() + Math.random();

                  setPendingImages((prev) => [
                    ...prev,
                    {
                      id: tempImageId,
                      file: file,
                      tempUrl: base64Url,
                    },
                  ]);

                  // Quill 에디터에 이미지 삽입 (Base64 URL 사용)
                  const range = quillInstance.current.getSelection();
                  quillInstance.current.insertEmbed(
                    range.index,
                    'image',
                    base64Url
                  );
                  quillInstance.current.setSelection(range.index + 1);

                  console.log(
                    '이미지 삽입 완료:',
                    file.name,
                    '크기:',
                    file.size
                  );
                };

                reader.onerror = () => {
                  console.error('파일 읽기 오류');
                  alert('이미지 파일을 읽는 중 오류가 발생했습니다.');
                };

                // 파일을 Base64로 읽기
                reader.readAsDataURL(file);
              } catch (error) {
                console.error('이미지 처리 중 오류:', error);
                alert('이미지 처리 중 오류가 발생했습니다.');
              }
            }
          };
        };

        try {
          // Quill 에디터 생성
          quillInstance.current = new Quill(editorContainer, {
            theme: 'snow',
            modules: {
              toolbar: {
                container: toolbarOptions,
                handlers: {
                  image: imageHandler,
                },
              },
            },
            placeholder: '내용을 입력하세요...',
          });

          // 내용 변경 이벤트 리스너
          quillInstance.current.on('text-change', () => {
            const html = quillInstance.current.root.innerHTML;
            setContent(html);
          });

          // 커서 위치 변경 시 자동 스크롤 (간단한 버전)
          quillInstance.current.on('selection-change', (range) => {
            if (range && range.index !== null) {
              // 간단한 스크롤 처리 - 에디터가 화면 밖으로 나가지 않도록
              setTimeout(() => {
                try {
                  const editorElement =
                    editorContainer.querySelector('.ql-editor');
                  if (editorElement) {
                    const rect = editorElement.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;

                    // 에디터가 화면 하단을 벗어나면 스크롤 조정
                    if (rect.bottom > viewportHeight - 100) {
                      const scrollAmount = rect.bottom - viewportHeight + 200;
                      window.scrollBy({
                        top: scrollAmount,
                        behavior: 'smooth',
                      });
                    }
                  }
                } catch (error) {
                  console.warn('커서 위치 스크롤 처리 중 오류:', error);
                }
              }, 100);
            }
          });

          // Quill의 기본 드래그 앤 드롭 기능을 활용하기 위해 커스텀 핸들러 추가
          quillInstance.current.on('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter((file) =>
              file.type.startsWith('image/')
            );

            if (imageFiles.length > 0) {
              e.preventDefault();
              e.stopPropagation();

              imageFiles.forEach(async (file) => {
                try {
                  // 파일 크기 확인 (5MB 제한)
                  if (file.size > 5 * 1024 * 1024) {
                    alert('이미지 파일 크기는 5MB 이하여야 합니다.');
                    return;
                  }

                  // FileReader를 사용하여 Base64로 변환
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const base64Url = e.target.result;

                    // 임시로 이미지를 pendingImages에 저장
                    const tempImageId = Date.now() + Math.random();

                    setPendingImages((prev) => [
                      ...prev,
                      {
                        id: tempImageId,
                        file: file,
                        tempUrl: base64Url,
                      },
                    ]);

                    // Quill 에디터에 이미지 삽입
                    const range = quillInstance.current.getSelection();
                    quillInstance.current.insertEmbed(
                      range.index,
                      'image',
                      base64Url
                    );
                    quillInstance.current.setSelection(range.index + 1);

                    console.log('드래그 앤 드롭 이미지 삽입 완료:', file.name);
                  };

                  reader.readAsDataURL(file);
                } catch (error) {
                  console.error('드래그 앤 드롭 이미지 처리 중 오류:', error);
                }
              });
            }
          });

          console.log('Quill 에디터 초기화 완료');
        } catch (error) {
          console.error('Quill 초기화 오류:', error);
        }
      }
    };

    // DOM이 완전히 렌더링된 후 Quill 초기화
    const timer = setTimeout(initializeQuill, 300);

    return () => {
      clearTimeout(timer);
      if (quillInstance.current) {
        quillInstance.current = null;
      }
      if (quillRef.current) {
        quillRef.current.innerHTML = '';
      }
    };
  }, [isLoggedIn]); // isLoggedIn을 의존성에 추가

  // content가 외부에서 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (!isLoggedIn) return; // 로그인하지 않은 경우 처리하지 않음

    if (
      quillInstance.current &&
      content !== quillInstance.current.root.innerHTML
    ) {
      quillInstance.current.root.innerHTML = content;
    }
  }, [content, isLoggedIn]);

  // URL 파라미터에서 카테고리 가져오기 (초기 로딩 시에만)
  useEffect(() => {
    if (!isLoggedIn) return; // 로그인하지 않은 경우 처리하지 않음

    const categoryParam = searchParams.get('category');
    console.log('URL 파라미터 카테고리:', categoryParam);
    console.log('현재 사용자 권한:', role);
    console.log('사용 가능한 카테고리:', availableCategories);

    // URL 파라미터가 있고, 해당 카테고리가 사용자 권한에 맞고, 아직 설정되지 않았을 때만 적용
    if (categoryParam && boardConfig[categoryParam] && !category) {
      // 사용자 권한 확인
      const config = boardConfig[categoryParam];
      if (config.allowedRoles.includes(role)) {
        setCategory(categoryParam);
        console.log('카테고리 설정됨:', categoryParam);
      } else {
        console.log('권한 부족으로 카테고리 설정 실패:', categoryParam);
      }
    }
  }, [searchParams, role, availableCategories, category, isLoggedIn]);

  // 인기 해시태그 목록 가져오기
  useEffect(() => {
    if (!isLoggedIn) return; // 로그인하지 않은 경우 처리하지 않음

    fetchPopularHashtags();
  }, [isLoggedIn]);

  // 검색어가 변경될 때마다 해시태그 검색
  useEffect(() => {
    if (!isLoggedIn) return; // 로그인하지 않은 경우 처리하지 않음

    if (showHashtagDropdown) {
      searchHashtags();
    }
  }, [hashtagSearchTerm, showHashtagDropdown, isLoggedIn]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!isLoggedIn) return; // 로그인하지 않은 경우 처리하지 않음

    const handleClickOutside = (event) => {
      if (
        showHashtagDropdown &&
        !event.target.closest('.hashtag-dropdown-container')
      ) {
        setShowHashtagDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHashtagDropdown, isLoggedIn]);

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

  const searchHashtags = async () => {
    try {
      const url = hashtagSearchTerm.trim()
        ? `/api/boards/hashtags/search?keyword=${encodeURIComponent(
            hashtagSearchTerm.trim()
          )}`
        : '/api/boards/hashtags/search';

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setHashtags(data);
      }
    } catch (error) {
      console.error('해시태그 검색 실패:', error);
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
    setShowHashtagDropdown(false);
    setHashtagSearchTerm('');
  };

  // API에서 이미 필터링된 결과를 받으므로 그대로 사용
  const filteredHashtags = hashtags;

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
      // 1. 게시글 생성
      const response = await axiosInstance.post('/boards', {
        title,
        content,
        boardKind: category.toUpperCase(),
        hashtags: selectedHashtags,
      });

      const boardId = response.data;

      // 2. 이미지 업로드 (pendingImages가 있는 경우)
      if (pendingImages.length > 0) {
        console.log('이미지 업로드 시작:', pendingImages.length, '개');

        for (const imageData of pendingImages) {
          try {
            const formData = new FormData();
            formData.append('image', imageData.file);
            formData.append('boardId', boardId);

            const imageResponse = await axiosInstance.post(
              '/boards/images',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            );

            console.log('이미지 업로드 성공:', imageResponse.data);
          } catch (imageError) {
            console.error('이미지 업로드 실패:', imageError);
            // 이미지 업로드 실패해도 게시글은 성공적으로 등록됨
          }
        }

        // 업로드 완료 후 pendingImages 초기화
        setPendingImages([]);
      }

      alert('게시글이 성공적으로 등록되었습니다.');
      navigate(`/board/${category}`);
    } catch (error) {
      console.error('게시글 등록 오류:', error);

      // 비속어 감지 시 처리
      if (error.response?.data?.error === 'profanity_detected') {
        const detectedWords = error.response.data.detectedWords || '';
        alert(
          `비속어가 감지되어 게시글 등록이 취소되었습니다.\n\n감지된 부적절한 표현:\n${detectedWords}\n\n부적절한 표현을 수정해주세요.`
        );
      } else if (error.response?.data?.message) {
        alert(`게시글 등록 실패: ${error.response.data.message}`);
      } else {
        alert('게시글 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 로그인하지 않은 경우 렌더링하지 않음
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="board-container">
        <h1 className="board-title">글 작성</h1>
        <form onSubmit={handleSubmit} className="board-form">
          <div className="board-form-group">
            <label className="board-form-label">게시판 카테고리</label>
            <div
              style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}
            >
              현재 권한: {role} | 사용 가능한 카테고리:{' '}
              {availableCategories.length}개
            </div>
            <select
              className="board-form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">게시판을 선택해주세요</option>
              {availableCategories.map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
            {availableCategories.length === 0 && (
              <div
                style={{ color: 'red', fontSize: '0.8rem', marginTop: '5px' }}
              >
                현재 권한으로는 사용할 수 있는 게시판이 없습니다.
              </div>
            )}
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
            <div
              ref={quillRef}
              style={{
                minHeight: '300px',
                height: 'auto',
                marginBottom: '50px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                position: 'relative',
                zIndex: 1,
                overflow: 'visible',
              }}
            />
          </div>

          {/* 해시태그 선택 섹션 */}
          <div className="board-form-group">
            <label className="board-form-label">해시태그 선택 (선택사항)</label>
            <div className="hashtag-selection-info">
              선택된 해시태그: {selectedHashtags.length}/5
            </div>

            {/* 해시태그 검색 및 드롭다운 */}
            <div
              className="hashtag-dropdown-container"
              style={{ position: 'relative' }}
            >
              <input
                type="text"
                placeholder="해시태그 검색..."
                value={hashtagSearchTerm}
                onChange={(e) => setHashtagSearchTerm(e.target.value)}
                onFocus={() => setShowHashtagDropdown(true)}
                className="board-form-input"
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
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {filteredHashtags.length > 0 ? (
                    filteredHashtags.map((hashtag, index) => (
                      <div
                        key={index}
                        onClick={() => handleHashtagToggle(hashtag)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: selectedHashtags.includes(hashtag)
                            ? '#e3f2fd'
                            : 'white',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor =
                            selectedHashtags.includes(hashtag)
                              ? '#bbdefb'
                              : '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor =
                            selectedHashtags.includes(hashtag)
                              ? '#e3f2fd'
                              : 'white';
                        }}
                      >
                        #{hashtag}
                        {selectedHashtags.includes(hashtag) && (
                          <span
                            style={{
                              float: 'right',
                              color: '#1976d2',
                              fontWeight: 'bold',
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: '8px 12px',
                        color: '#666',
                        fontStyle: 'italic',
                      }}
                    >
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 선택된 해시태그 표시 */}
            {selectedHashtags.length > 0 && (
              <div className="selected-hashtags">
                <strong>선택된 해시태그:</strong>
                <div className="selected-hashtags-list">
                  {selectedHashtags.map((hashtag, index) => (
                    <span key={index} className="selected-hashtag">
                      #{hashtag}
                      <button
                        type="button"
                        onClick={() => handleHashtagToggle(hashtag)}
                        style={{
                          marginLeft: '5px',
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
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

          <button type="submit" className="board-btn" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>
    </>
  );
};

export default BoardWrite;
