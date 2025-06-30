import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header.jsx';
import axios from '../../api/axios';
import { MdSearch } from 'react-icons/md';

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
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
  };

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
          .search-bar {
            position: relative;
            display: flex;
            align-items: center;
            gap: 0;
            margin-bottom: 1.5rem;
            justify-content: flex-start;
            width: 200px;
          }
          .search-input {
            padding: 0.7rem 2.8rem 0.7rem 1.2rem;
            border: 2px solid #e9ecef;
            border-radius: 2rem;
            font-size: 1.1rem;
            outline: none;
            width: 100%;
            transition: border 0.2s;
            box-sizing: border-box;
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
            font-size: 1.4rem;
            cursor: pointer;
            padding: 0 0.7rem;
            height: 2.2rem;
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
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            justify-content: center;
          }
          .category-btn {
            background: #f8f9fa;
            color: #223A5E;
            border: 2px solid #e9ecef;
            border-radius: 2rem;
            padding: 1rem 2.5rem;
            font-size: 1.25rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 0.5rem;
            box-shadow: 0 2px 8px #0001;
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
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
            margin-top: 2rem;
            justify-content: flex-start;
          }
          .item-card {
            width: 180px;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 2px 8px #0001;
            padding: 1rem 0.7rem 1.2rem 0.7rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: box-shadow 0.2s;
          }
          .item-card:hover {
            box-shadow: 0 4px 16px #0002;
          }
          .item-thumb {
            width: 120px;
            height: 120px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 0.7rem;
            background: #f8f8f8;
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
            padding: 0.8rem 1.5rem;
            font-size: 1rem;
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
            font-size: 1.2rem;
            font-weight: 900;
          }
          @media (max-width: 900px) {
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
            .items-grid {
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
              gap: 1.5rem;
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
        `}</style>

        {/* 검색창 + 카테고리 바 + 상품 등록 버튼 */}
        <div style={{ position: 'relative', minHeight: '70px', marginBottom: '1.5rem' }}>
          {/* 검색창 - 왼쪽 */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', zIndex: 2 }}>
            <form className="search-bar" onSubmit={handleSearch} style={{ marginBottom: 0 }}>
              <input
                className="search-input"
                type="text"
                placeholder="상품명 검색"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') setSearchInput(''); }}
              />
              <button className="search-btn" type="submit" tabIndex={0} aria-label="검색">
                <MdSearch />
              </button>
            </form>
          </div>

          {/* 카테고리 바 - 중앙 */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', zIndex: 1 }}>
            <div className="category-bar">
              {mainCategories.map(main => (
                <button
                  key={main.categoryId}
                  className={`category-btn${selectedMain === main.categoryId ? ' selected' : ''}`}
                  onClick={() => {
                    if (selectedMain === main.categoryId) {
                      setSelectedMain(null);
                      setMainCategory('');
                      setSubCategory('');
                      setSearchTerm('');
                      setSearchInput('');
                      fetchItems('');
                      console.log('대분류 선택 해제: 전체보기');
                    } else {
                      setSelectedMain(main.categoryId);
                      setMainCategory(main.categoryId.toString());
                      setSubCategory('');
                      setSearchTerm('');
                      setSearchInput('');
                      fetchItems('');
                      console.log('대분류 선택:', main.optionValue);
                    }
                  }}
                >
                  {main.optionValue}
                </button>
              ))}
            </div>
          </div>

          {/* 상품 등록 버튼 - 오른쪽 상단 */}
          {memberRole === 'ADMIN' && (
            <div className="register-button-container" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', zIndex: 2 }}>
              <button
                className="register-button"
                onClick={handleRegisterClick}
              >
                <span className="register-icon">+</span>
                상품 등록
              </button>
            </div>
          )}
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

        {/* 여기에 상품 리스트 등 추가 */}
        <div className="item-card-list">
          {items.map(item => (
            <div className="item-card" key={item.itemId}>
              <img src={item.thumbnailUrl} alt={item.itemName} className="item-thumb" />
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
