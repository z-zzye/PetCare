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

  // 상품 목록 불러오기
  const fetchItems = async (search) => {
    const params = {};
    if (mainCategory) params.mainCategory = Number(mainCategory);
    if (subCategory) params.subCategory = Number(subCategory);
    if (search !== undefined) {
      if (search) params.search = search;
    } else if (searchTerm) {
      params.search = searchTerm;
    }
    const res = await axios.get('/items/list', { params });
    setItems(res.data);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, [mainCategory, subCategory, searchTerm]);

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
      fetchItems(''); // 전체보기로 초기화
    } else {
      setSelectedMain(categoryId);
      setMainCategory(categoryId.toString());
      setSubCategory('');
      setSearchTerm('');
      setSearchInput('');
      fetchItems(''); // 해당 대분류로 상품 목록 갱신
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
            height: 2.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
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
            font-size: 2.5rem !important;
            width: 2.5rem !important;
            height: 2.5rem !important;
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
          }
          .subcategory-btn {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 1.5rem;
            padding: 0.8rem 2rem;
            font-size: 1.1rem;
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
            gap: 1.5rem;
            margin-top: 2rem;
            margin-left: auto;
            margin-right: auto;
          }
          .item-card {
            width: 100%;
            background: #fff;
            border-radius: 0;
            box-shadow: 0 2px 12px #0002;
            padding: 2rem 1.2rem 2.2rem 1.2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: box-shadow 0.2s;
            min-height: 340px;
            overflow: hidden;
          }
          .item-card:hover {
            box-shadow: 0 4px 16px #0002;
          }
          .item-thumb-wrapper {
            width: 250px;
            height: 250px;
            overflow: hidden;
            border-radius: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .item-thumb {
            width: 250px;
            height: 250px;
            object-fit: cover;
            border-radius: 0;
            margin-bottom: 0.7rem;
            background: #f8f8f8;
            transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
            width: 100%;
            height: 100%;
          }
          .item-card:hover .item-thumb {
            transform: scale(1.07);
          }
          .item-info h3 {
            margin: 0 0 0.3rem 0;
            font-size: 1rem;
            color: #223A5E;
            text-align: center;
            word-break: keep-all;
          }
          .item-info p {
            margin: 0;
            color: #ff9800;
            font-weight: bold;
            text-align: center;
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
            border-radius: 2rem;
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
            transform: translateY(-2px);
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
        `}</style>

        {/* 검색창 + 버튼들 한 행에 배치 */}
        <div className="search-row-flex">
          <div className="search-bar" style={{ margin: '0', width: '320px' }}>
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
            />
            <button
              className="search-btn"
              type="button"
              tabIndex={0}
              aria-label="검색"
              onClick={handleSearch}
            >
              <MdSearch style={{ fontSize: '1.7rem' }} />
            </button>
          </div>
          <div className="register-button-container" style={{ display: 'flex', alignItems: 'center', zIndex: 2, gap: '0.7rem' }}>
            <button
              className="register-button"
              style={{ background: '#223A5E', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => navigate('/shop/cart')}
            >
              <MdShoppingCart style={{ fontSize: '1.2rem' }} />
              장바구니
            </button>
            {memberRole === 'ADMIN' && (
              <button
                className="register-button"
                onClick={handleRegisterClick}
              >
                <span className="register-icon">+</span>
                상품 등록
              </button>
            )}
          </div>
        </div>

        {/* 카테고리 바 - 중앙정렬 */}
        <div className="category-bar-wrapper">
          <div className="category-bar">
            {mainCategories.map(main => (
              <button
                key={main.categoryId}
                className={`category-btn${selectedMain === main.categoryId ? ' selected' : ''}`}
                onClick={() => handleMainCategoryClick(main.categoryId)}
              >
                {main.optionValue}
              </button>
            ))}
          </div>
        </div>

        {/* 소분류 버튼 */}
        {selectedMain && (
          <div className="subcategory-bar">
            {filteredSubs.map(sub => (
              <button
                key={sub.categoryId}
                className="subcategory-btn"
                onClick={() => {
                  setSubCategory(sub.categoryId.toString());
                  setSearchTerm('');
                  setSearchInput('');
                  fetchItems('');
                  console.log('소분류 선택:', sub.optionValue);
                }}
              >
                {sub.optionValue}
              </button>
            ))}
          </div>
        )}

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
      </div>
    </div>
  );
}

export default Shopping;
