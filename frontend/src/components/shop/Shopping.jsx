import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header.jsx';
import axios from '../../api/axios';
import { MdSearch, MdShoppingCart } from 'react-icons/md';

function Shopping() {
  const navigate = useNavigate();
  const memberRole = localStorage.getItem('member_Role'); // 예: 'ADMIN', 'USER'

  const [categories, setCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [items, setItems] = useState([]);
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios.get('/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error('카테고리 불러오기 실패', err));
  }, []);

  // 대분류/소분류 분리
  const mainCategories = categories.filter(cat => cat.parentOption === null);
  const subCategories = categories.filter(cat => cat.parentOption !== null);

  // 선택된 대분류의 소분류만 필터링
  const filteredSubs = selectedMain
    ? subCategories.filter(sub => sub.parentOption === selectedMain)
    : [];

  // 상품 목록 불러오기 (페이지네이션 적용)
  const fetchItems = async (search, pageParam) => {
    const params = { page: pageParam !== undefined ? pageParam : page, size: 20 };
    if (mainCategory) params.mainCategory = Number(mainCategory);
    if (subCategory) params.subCategory = Number(subCategory);
    if (search !== undefined) {
      if (search) params.search = search;
    } else if (searchTerm) {
      params.search = searchTerm;
    }
    const res = await axios.get('/items/page', { params });
    setItems(res.data.content);
    setTotalPages(res.data.totalPages);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, [mainCategory, subCategory, searchTerm, page]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    setPage(newPage);
    //fetchItems(undefined, newPage); // useEffect로 자동 호출됨
  };

  const handleRegisterClick = () => {
    navigate('/shop/item/register');
  };

  // 검색 버튼/엔터 처리
  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
  };

  // 대분류 버튼 클릭 핸들러
  const handleMainCategoryClick = (categoryId) => {
    if (selectedMain === categoryId) {
      setSelectedMain(null);
      setMainCategory('');
      setSubCategory('');
      setSearchTerm('');
      setSearchInput('');
      // fetchItems(''); // 제거
    } else {
      setSelectedMain(categoryId);
      setMainCategory(categoryId.toString());
      setSubCategory('');
      setSearchTerm('');
      setSearchInput('');
      // fetchItems(''); // 제거
    }
  };

  React.useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <div className="shopping-container">
      <Header />
      <div className="shopping-content">
        <style>{`
          .shopping-container {
            min-height: 100vh;
            background: #fff;
            padding: 0 0 2rem 0;
          }
          .shopping-content {
            max-width: 1440px;
            margin: 0 auto;
            padding: 0 1rem;
            padding-top: 3rem;
            position: relative;
          }
          .category-search-row {
            max-width: 1200px;
            margin: 0 auto 1.5rem auto;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 2rem;
          }
          .shopping-title {
            text-align: center;
            margin-bottom: 3rem;
            color: #223A5E;
            font-size: 2.5rem;
            font-weight: 700;
          }
          .search-bar-center {
            /* 더 이상 사용하지 않음 */
          }
          .search-row-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            position: relative;
            width: 100%;
          }
          .shopping-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.2rem;
          }
          .category-bar-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
          }
          .search-bar {
            position: relative;
            display: flex;
            align-items: center;
            gap: 0;
            margin-bottom: 0;
            justify-content: center;
            width: 220px;
            height: 32px;
          }
          .search-input {
            padding: 0.3rem 1.5rem 0.3rem 0.7rem;
            border: 2px solid #e9ecef;
            border-radius: 2rem;
            font-size: 0.95rem;
            outline: none;
            width: 100%;
            transition: border 0.2s;
            box-sizing: border-box;
            height: 32px;
          }
          .search-input:focus {
            border-color: #ffc107;
          }
          .search-btn {
            position: absolute;
            right: 0.3rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #ffc107;
            font-size: 1rem;
            cursor: pointer;
            padding: 0 0.7rem;
            width: 3.2rem !important;
            height: 3.2rem !important;
            min-width: 3rem;
            min-height: 3rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .search-btn:active {
            color: #ff8f00;
          }
          .search-btn:focus {
            outline: none;
          }
          .search-btn svg {
            color: #223A5E;
            transition: color 0.2s;
            font-size: 1.5rem !important;
            width: 1.5rem !important;
            height: 1.5rem !important;
          }
          .search-btn:hover svg {
            color: #ffc107;
          }
          .search-btn:focus {
            outline: none;
          }
          .category-bar {
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
            justify-content: center;
          }
          .category-btn {
            background: #f8f9fa;
            color: #223A5E;
            border: 2px solid #e9ecef;
            border-radius: 2rem;
            padding: 0.4rem 1rem;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 0.5rem;
            box-shadow: 0 2px 8px #0001;
            min-height: 32px;
          }
          .category-btn:hover {
            background: #fffbe7;
            border-color: #ffc107;
            color: #223A5E;
          }
          .category-btn.selected {
            background: #ffc107;
            color: #223A5E;
            font-weight: 700;
            border-color: #ffc107;
            box-shadow: 0 4px 16px #ffc10733;
          }
          .subcategory-bar {
            display: flex;
            gap: 1.2rem;
            margin-bottom: 2.5rem;
            flex-wrap: wrap;
            justify-content: center;
            min-height: 56px;
          }
          .subcategory-btn {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 2rem;
            padding: 0.4rem 1rem;
            font-size: 0.95rem;
            color: #223A5E;
            cursor: pointer;
            margin-bottom: 0.4rem;
            transition: all 0.2s;
            box-shadow: 0 1px 4px #0001;
          }
          .subcategory-btn:hover {
            background: #fffbe7;
            border-color: #ffc107;
            color: #223A5E;
          }
          .subcategory-btn.selected {
            background: #ffc107;
            color: #223A5E;
            border-color: #ffc107;
            font-weight: 600;
          }
          .item-card-list {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.2rem;
            margin-top: 2rem;
            margin-left: auto;
            margin-right: auto;
          }
          .item-card {
            width: 100%;
            background: #fff;
            border-radius: 0;
            box-shadow: none;
            padding: 2rem 0 2.2rem 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: box-shadow 0.2s;
            min-height: 340px;
            overflow: hidden;
          }
          .item-card:hover {
            box-shadow: none;
          }
          .item-thumb-wrapper {
            width: 100%;
            aspect-ratio: 1/1;
            overflow: hidden;
            border-radius: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
          }
          .item-thumb {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 0;
            margin-bottom: 0.7rem;
            background: #fff;
            transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
            display: block;
          }
          .item-card:hover .item-thumb {
            transform: scale(1.07);
          }
          .item-info h3 {
            margin: 0 0 0.3rem 0;
            font-size: 1rem;
            color: #223A5E;
            text-align: left;
            word-break: keep-all;
            padding-top: 0.6rem;
          }
          .item-info p {
            margin: 0;
            color: #ff9800;
            font-weight: bold;
            text-align: left;
          }
          .register-button-container {
            position: absolute;
            top: 3rem;
            right: 2rem;
            z-index: 10;
          }
          .register-button {
            background: linear-gradient(135deg, #ffc107, #ff8f00);
            color: #223A5E;
            border: none;
            border-radius: 0.7rem;
            padding: 0.5rem 1rem;
            font-size: 0.95rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 16px #ffc10733;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .register-button:hover {
            box-shadow: 0 6px 20px #ffc10744;
            background: linear-gradient(135deg, #ffd54f, #ffc107);
          }
          .register-button:active {
            transform: translateY(0);
          }
          .register-icon {
            font-size: 1rem;
            font-weight: 900;
          }
          .cart-button:hover {
            background: #34507b !important;
            color: #fff !important;
            box-shadow: none;
          }
          @media (max-width: 900px) {
            .item-card-list {
              grid-template-columns: repeat(2, 1fr);
            }
            .search-bar { margin-bottom: 1rem; width: 140px; }
            .search-input { font-size: 1rem; padding-right: 2.2rem; }
            .search-btn { font-size: 1.1rem; }
            .category-bar, .subcategory-bar {
              gap: 0.7rem;
            }
            .category-btn, .subcategory-btn {
              font-size: 1rem;
              padding: 0.6rem 1.2rem;
            }
            .shopping-title {
              font-size: 2rem;
            }
          }
          @media (max-width: 600px) {
            .item-card-list {
              grid-template-columns: 1fr;
            }
            .search-bar { margin-bottom: 0.5rem; width: 100px; }
            .search-input { font-size: 0.92rem; padding-right: 1.8rem; }
            .search-btn { font-size: 1rem; }
            .category-bar, .subcategory-bar {
              gap: 0.4rem;
            }
            .category-btn, .subcategory-btn {
              font-size: 0.92rem;
              padding: 0.45rem 0.9rem;
            }
            .shopping-title {
              font-size: 1.8rem;
            }
          }
          @media (max-width: 400px) {
            .search-bar { margin-bottom: 0.5rem; width: 80px; }
            .search-input { font-size: 0.85rem; padding-right: 1.5rem; }
            .search-btn { font-size: 0.92rem; }
            .category-btn, .subcategory-btn {
              font-size: 0.85rem;
              padding: 0.35rem 0.7rem;
            }
            .shopping-title {
              font-size: 1.5rem;
            }
          }
          .search-bar-slide {
            position: relative;
            display: flex;
            align-items: center;
          }
          .search-slide-btn {
            background: none;
            border: none;
            color: #223A5E;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.2rem 0.5rem;
            display: block;
          }
          .search-form {
            width: 220px;
            opacity: 1;
            transform: none;
            display: flex;
            align-items: center;
            background: #fff;
            border-radius: 2rem;
            box-shadow: 0 2px 8px #0001;
            margin-left: 0;
            padding: 0 0.2rem;
          }
          .search-close-btn {
            margin-left: 2px;
            background: none;
            border: none;
            color: #888;
            font-size: 1.1rem;
            cursor: pointer;
          }
          .item-info {
            width: 100%;
          }
        `}</style>

        {/* 상단 한 줄: 검색(왼), 카테고리(중앙), 버튼(오른쪽) */}
        <div className="shopping-top-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '2.5rem', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
          {/* 왼쪽: 검색창 */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <div className="search-bar" style={{ width: '260px', marginBottom: 0 }}>
              <input
                className="search-input"
                type="text"
                placeholder="상품명 검색"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearch();
                  if (e.key === 'Escape') setSearchInput('');
                }}
                style={{ height: '38px', fontSize: '1rem' }}
              />
              <button
                className="search-btn"
                type="button"
                tabIndex={0}
                aria-label="검색"
                onClick={handleSearch}
                style={{ height: '38px' }}
              >
                <MdSearch style={{ fontSize: '2rem' }} />
              </button>
            </div>
          </div>
          {/* 중앙: 카테고리 바 */}
          <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
            <div className="category-bar-wrapper" style={{ marginBottom: 0 }}>
              <div className="category-bar">
                {mainCategories.map(main => (
                  <button
                    key={main.categoryId}
                    className={`category-btn${selectedMain === main.categoryId ? ' selected' : ''}`}
                    onClick={() => handleMainCategoryClick(main.categoryId)}
                    style={{ marginBottom: 0 }}
                  >
                    {main.optionValue}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* 오른쪽: 장바구니/상품등록 버튼 */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div className="register-button-container" style={{ display: 'flex', alignItems: 'center', zIndex: 2, gap: '0.7rem', marginBottom: 0 }}>
              <button
                className="register-button cart-button"
                style={{ background: '#223A5E', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px', width: '38px', justifyContent: 'center', padding: 0 }}
                onClick={() => navigate('/shop/cart')}
              >
                <MdShoppingCart style={{ fontSize: '1.2rem' }} />
              </button>
              {memberRole === 'ADMIN' && (
                <button
                  className="register-button"
                  onClick={handleRegisterClick}
                  style={{ height: '38px', display: 'flex', alignItems: 'center' }}
                >
                  <span className="register-icon">+</span>
                  상품 등록
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 소분류 버튼 */}
        <div className="subcategory-bar">
          {selectedMain && filteredSubs.map(sub => (
            <button
              key={sub.categoryId}
              className={`subcategory-btn${subCategory === sub.categoryId.toString() ? ' selected' : ''}`}
              onClick={() => {
                setSubCategory(sub.categoryId.toString());
                setSearchTerm('');
                setSearchInput('');
                // fetchItems(''); // 제거
                console.log('소분류 선택:', sub.optionValue);
              }}
            >
              {sub.optionValue}
            </button>
          ))}
        </div>

        {/* 상품 카드 리스트 */}
        <div className="item-card-list">
          {items.map(item => (
            <div
              className="item-card"
              key={item.itemId}
              onClick={() => navigate(`/shop/shopping/item/${item.itemId}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="item-thumb-wrapper">
                <img src={item.images?.[0]?.url || item.thumbnailUrl} alt={item.itemName} className="item-thumb" />
              </div>
              <div className="item-info">
                <h3>{item.itemName}</h3>
                <p>{item.itemPrice.toLocaleString()}원</p>
              </div>
            </div>
          ))}
        </div>
        {/* 페이지네이션 UI */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3.5rem', marginBottom: '2rem' }}>
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 0} style={{ fontSize: '1.1rem', padding: '0.5rem 1.1rem', marginRight: 8, borderRadius: 8, border: 'none', background: 'transparent', color: page === 0 ? '#ccc' : '#223A5E', fontWeight: 700, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>◀</button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => handlePageChange(idx)}
              disabled={page === idx}
              style={{
                fontSize: '0.9rem',
                width: '2rem',
                height: '2rem',
                padding: 0,
                marginRight: 6,
                borderRadius: '50%',
                border: 'none',
                background: page === idx ? '#ffc107' : 'transparent',
                color: page === idx ? '#223A5E' : '#223A5E',
                fontWeight: 700,
                cursor: page === idx ? 'not-allowed' : 'pointer',
                boxShadow: page === idx ? '0 2px 8px #ffc10733' : 'none',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (page !== idx) {
                  e.target.style.backgroundColor = '#ffc107';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== idx) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {idx + 1}
            </button>
          ))}
          <button onClick={() => handlePageChange(page + 1)} disabled={page + 1 === totalPages} style={{ fontSize: '1.1rem', padding: '0.5rem 1.1rem', marginLeft: 8, borderRadius: 8, border: 'none', background: 'transparent', color: page + 1 === totalPages ? '#ccc' : '#223A5E', fontWeight: 700, cursor: page + 1 === totalPages ? 'not-allowed' : 'pointer' }}>▶</button>
        </div>
      </div>
    </div>
  );
}

export default Shopping;
