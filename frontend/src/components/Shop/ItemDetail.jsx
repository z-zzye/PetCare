import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Header from '../Header.jsx';
import { MdShoppingCart, MdDelete } from 'react-icons/md';
import { FaDog, FaCat, FaDove } from 'react-icons/fa';

function ItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [mainImgIdx, setMainImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedOptIdx, setSelectedOptIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [toast, setToast] = useState('');
  const [cartToast, setCartToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const memberRole = localStorage.getItem('member_Role');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/items/${itemId}/detail`)
      .then(res => setItem(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [itemId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 1800);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류 발생: {error.message}</div>;
  if (!item) return <div>데이터 없음</div>;

  const isSoldOut = item.itemStatus === 'SOLD_OUT' || (item.options && item.options.length > 0 && item.options.every(opt => opt.optionStock === 0));
  const selectedOption = item.options[selectedOptIdx] || { optionAddPrice: 0 };

  // images 배열에서 url만 추출
  const imageUrls = item.images ? item.images.map(img => img.url) : [];

  const handleAddOption = () => {
    const opt = item.options[selectedOptIdx];
    if (!opt) return;
    const exist = selectedOptions.find(o => o.optionName === opt.optionName);
    const totalQty = (exist ? exist.qty : 0) + qty;
    if (totalQty > opt.optionStock) {
      setToast('재고가 없습니다');
      return;
    }
    setSelectedOptions(prev => {
      const existIdx = prev.findIndex(o => o.optionName === opt.optionName);
      if (existIdx !== -1) {
        const updated = [...prev];
        updated[existIdx].qty += qty;
        return updated;
      } else {
        return [
          ...prev,
          {
            optionId: opt.optionId,
            optionName: opt.optionName,
            optionAddPrice: opt.optionAddPrice,
            qty,
            price: item.itemPrice + (opt.optionAddPrice || 0),
            optionStock: opt.optionStock
          }
        ];
      }
    });
    setQty(1);
  };

  const handleRemoveOption = (optionName) => {
    setSelectedOptions(prev => prev.filter(o => o.optionName !== optionName));
  };

  const totalPrice = selectedOptions.reduce((sum, o) => sum + o.price * o.qty, 0);

  const handleQtyChange = (idx, newQty) => {
    const opt = selectedOptions[idx];
    if (!opt) return;
    if (newQty > opt.optionStock) {
      setToast('재고가 없습니다');
      return;
    }
    setSelectedOptions(prev => prev.map((o, i) => i === idx ? { ...o, qty: newQty } : o));
  };

  // 장바구니 버튼 클릭 핸들러
  const handleCartClick = async () => {
    if (selectedOptions.length === 0) {
      setToast('장바구니에 담을 상품을 선택해주세요');
      return;
    }
    try {
      // 여러 옵션을 한 번에 추가 (여러 번 요청)
      await Promise.all(selectedOptions.map(opt =>
        axios.post('/cart', {
          item: {
            itemId: item.itemId,
            itemName: item.itemName,
            itemPrice: item.itemPrice,
            thumbnailUrl: imageUrls[0]
          },
          quantity: opt.qty,
          option: {
            optionId: opt.optionId,
            optionName: opt.optionName,
            optionAddPrice: opt.optionAddPrice,
            optionStock: opt.optionStock
          }
        })
      ));
      setCartToast(true); // 토스트 표시
    } catch (e) {
      setToast('장바구니 추가 실패');
    }
  };

  // 바로구매 버튼 클릭 핸들러
  const handleBuyNowClick = () => {
    if (selectedOptions.length === 0) {
      setToast('구매하실 상품을 선택해주세요');
      return;
    }
    alert('바로구매 기능은 추후 구현 예정입니다.');
    // 실제 바로구매 로직은 추후 구현
  };

  // 관리자용 상품 수정/삭제 핸들러
  const handleEdit = () => {
    navigate(`/shop/item/edit/${item.itemId}`);
  };
  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    try {
      await axios.delete(`/items/${item.itemId}`);
      setToast('상품이 삭제되었습니다.');
      setShowDeleteConfirm(false);
      setTimeout(() => {
        navigate('/shop/shopping');
      }, 1200);
    } catch (e) {
      setToast('삭제 실패: ' + (e.response?.data?.message || '오류 발생'));
      setShowDeleteConfirm(false);
    }
  };
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Header />
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#222', color: '#fff', padding: '1rem 2.2rem', borderRadius: 16,
          fontSize: '1.1rem', zIndex: 9999, boxShadow: '0 2px 12px #0003', opacity: 0.95
        }}>{toast}</div>
      )}
      {cartToast && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '#223A5E', color: '#fff', padding: '1rem 2.2rem', borderRadius: 16,
          fontSize: '1rem', zIndex: 9999, boxShadow: '0 2px 12px #0003', opacity: 0.97,
          textAlign: 'center', fontWeight: 700
        }}>
          <div>장바구니에 추가되었습니다.</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
            <button
              className="cart-toast-move-btn"
              onClick={() => { setCartToast(false); navigate('/shop/cart'); }}>
              장바구니로 이동
            </button>
            <button
              className="cart-toast-close-btn"
              onClick={() => setCartToast(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '#223A5E', color: '#fff', padding: '2rem 2.5rem', borderRadius: 18,
          fontSize: '1.1rem', zIndex: 10000, boxShadow: '0 2px 16px #0005', opacity: 0.98,
          textAlign: 'center', fontWeight: 700
        }}>
          <div style={{ marginBottom: 18 }}>정말로 이 상품을 삭제하시겠습니까?</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
            <button
              style={{ background: '#ff5252', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1rem', padding: '0.6rem 1.6rem', cursor: 'pointer' }}
              onClick={confirmDelete}
            >예</button>
            <button
              style={{ background: '#fff', color: '#223A5E', border: '1.5px solid #223A5E', borderRadius: 8, fontWeight: 700, fontSize: '1rem', padding: '0.6rem 1.6rem', cursor: 'pointer' }}
              onClick={cancelDelete}
            >아니오</button>
          </div>
        </div>
      )}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem', background: '#fff' }}>
        {/* 카테고리 경로 (breadcrumb) */}
        {item.categoryPath && (
          <div style={{
            fontSize: '0.97rem',
            color: '#888',
            marginBottom: 18,
            marginTop: 8,
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              {item.categoryPath.map((cat, idx) => (
                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {cat === '강아지' ? <FaDog style={{ fontSize: 18, marginRight: 3, marginBottom: -2 }} />
                    : cat === '고양이' ? <FaCat style={{ fontSize: 18, marginRight: 3, marginBottom: -2 }} />
                    : cat === '앵무새' ? <FaDove style={{ fontSize: 18, marginRight: 3, marginBottom: -2 }} />
                    : <span style={{ position: 'relative', top: '-2.5px' }}>{cat}</span>}
                  {idx < item.categoryPath.length - 1 && (
                    <span
                      style={{
                        margin: '0 10px',
                        color: '#bbb',
                        fontWeight: 700,
                        fontSize: '1em',
                        verticalAlign: 'middle',
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '1em',
                      }}
                    >
                      {'>'}
                    </span>
                  )}
                </span>
              ))}
            </div>
            {memberRole === 'ADMIN' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleEdit} style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: 'none', background: '#223A5E', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginRight: 4 }}>상품 수정</button>
                <button
                  onClick={handleDelete}
                  title="상품 삭제"
                  style={{
                    padding: '0.5rem 1.2rem',
                    borderRadius: 8,
                    border: '2px solid transparent',
                    background: '#ffc107',
                    color: '#223A5E',
                    fontWeight: 700,
                    fontSize: '1.3rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.border = '2px solid #223A5E'}
                  onMouseOut={e => e.currentTarget.style.border = '2px solid transparent'}
                >
                  <MdDelete style={{ fontSize: '1.3rem' }} />
                </button>
              </div>
            )}
          </div>
        )}
        <style>{`
          .detail-flex-wrap {
            display: flex;
            gap: 40px;
            align-items: flex-start;
          }
          .detail-img-col {
            min-width: 420px;
          }
          .detail-main-img {
            width: 400px;
            height: 400px;
            object-fit: cover;
            border-radius: 12px;
            border: 1px solid #eee;
          }
          .detail-thumb-row {
            display: flex;
            justify-content: flex-start;
            gap: 12px;
            margin-bottom: 8px;
            padding-left: 12px;
          }
          .detail-thumb-img {
            width: 70px;
            height: 70px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #eee;
            cursor: pointer;
            transition: border 0.2s;
          }
          .detail-thumb-img.selected {
            border: 2px solid #ffc107;
          }
          .detail-info-col {
            min-width: 350px;
            flex: 1;
          }
          .qty-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
          }
          .qty-btn {
            width: 32px;
            height: 32px;
            border: 1px solid #ccc;
            background: #f8f9fa;
            color: #223A5E;
            font-size: 1.2rem;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.2s;
          }
          .qty-btn:hover {
            background: #ffc10722;
          }
          .qty-input {
            width: 48px;
            text-align: center;
            font-size: 1.1rem;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 0.3rem 0.2rem;
            background: #fff;
          }
          .order-price-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
          }
          .order-price-label {
            color: #888;
            font-size: 1.1rem;
            font-weight: 500;
          }
          .order-price-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #223A5E;
          }
          .selected-opt-list {
            margin-bottom: 18px;
          }
          .selected-opt-item {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 1rem 1.2rem;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            font-size: 1.08rem;
          }
          .selected-opt-info {
            flex: 1;
          }
          .selected-opt-qty {
            margin: 0 10px;
            font-weight: 600;
          }
          .selected-opt-price {
            font-weight: 700;
            color: #223A5E;
            margin-left: 10px;
          }
          .selected-opt-remove {
            background: none;
            border: none;
            color: #bbb;
            font-size: 1.3rem;
            cursor: pointer;
            margin-left: 10px;
            transition: color 0.2s;
          }
          .selected-opt-remove:hover {
            color: #ff5252;
          }
          @media (max-width: 900px) {
            .detail-flex-wrap {
              flex-direction: column;
              gap: 24px;
            }
            .detail-img-col {
              min-width: 0;
              width: 100%;
              text-align: center;
            }
            .detail-main-img {
              width: 90vw;
              max-width: 400px;
              height: 50vw;
              max-height: 400px;
            }
            .detail-info-col {
              min-width: 0;
              width: 100%;
            }
          }
          .cart-toast-move-btn, .cart-toast-close-btn {
            box-sizing: border-box;
            border-width: 2px;
            border-style: solid;
            border-color: transparent;
          }
          .cart-toast-move-btn {
            background: #ffc107;
            color: #223A5E;
            border: 2px solid transparent;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            padding: 0.3rem 1.1rem;
            font-size: 1rem;
            transition: background 0.2s, color 0.2s, border 0.2s;
          }
          .cart-toast-move-btn:hover {
            background: #ffc107;
            color: #223A5E;
            border: 2px solid #fff;
          }
          .cart-toast-close-btn {
            background: none;
            color: #fff;
            border: 2px solid transparent;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            padding: 0.3rem 1.1rem;
            font-size: 1rem;
            transition: border 0.2s;
          }
          .cart-toast-close-btn:hover {
            border: 2px solid #fff;
          }
          /* 옵션 드롭다운 머스터드 스타일 */
          .detail-info-col select {
            border: 2px solid #ffc107;
            border-radius: 5px;
            background: #fff;
            color: #223A5E;
            font-size: 0.9rem;
            padding: 0.2rem 0.9rem;
            outline: none;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: url('data:image/svg+xml;utf8,<svg fill="%23ffc107" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>');
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 1.1rem;
            transition: border 0.2s;
            height: auto;
            line-height: normal;
          }
          .detail-info-col select:focus {
            border-color: #ffb300;
          }
          .detail-info-col option {
            color: #223A5E;
          }
        `}</style>
        <div className="detail-flex-wrap">
          {/* 좌측: 대표 이미지 + 썸네일 */}
          <div className="detail-img-col">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img
                src={imageUrls?.[mainImgIdx]}
                alt="대표이미지"
                className="detail-main-img"
              />
            </div>
            <div className="detail-thumb-row">
              {item.images?.map((img, idx) => (
                <img
                  key={idx}
                  src={img.url}
                  alt={`썸네일${idx+1}`}
                  className={`detail-thumb-img${mainImgIdx === idx ? ' selected' : ''}`}
                  onClick={() => setMainImgIdx(idx)}
                />
              ))}
            </div>
          </div>
          {/* 우측: 상품 정보 */}
          <div className="detail-info-col">
            <h2 style={{ fontSize: '2rem', color: '#223A5E', marginBottom: 18 }}>{item.itemName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>
              <span style={{ color: isSoldOut ? '#888' : '#ff9800' }}>{item.itemPrice.toLocaleString()}원</span>
              {isSoldOut && (
                <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1rem', marginLeft: 16 }}>품절</span>
              )}
            </div>
            {/* 옵션 선택 */}
            <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <select
                style={{
                  padding: '0.7rem 1.2rem',
                  fontSize: '1.1rem',
                  width: 280,
                  border: isSoldOut ? '2px solid #ccc' : '2px solid #ffc107',
                  borderRadius: 5,
                  background: isSoldOut ? '#f8f9fa' : '#fff',
                  color: isSoldOut ? '#bbb' : '#223A5E',
                  outline: 'none',
                  appearance: 'auto',
                  transition: 'border 0.2s',
                  height: 'auto',
                  lineHeight: 'normal'
                }}
                value={selectedOptIdx}
                onChange={e => setSelectedOptIdx(Number(e.target.value))}
                disabled={isSoldOut}
              >
                {item.options && item.options
                  .filter(opt =>
                    opt.isActive === undefined ||
                    opt.isActive === true ||
                    opt.isActive === 1 ||
                    opt.isActive === 'Y'
                  )
                  .map((opt, idx) => (
                    <option key={opt.optionId} value={idx} disabled={opt.optionStock === 0}>
                      {opt.optionName}
                      {opt.optionAddPrice > 0 ? ` (+${opt.optionAddPrice.toLocaleString()}원)` : ''}
                    </option>
                  ))}
              </select>
              <button
                style={{
                  marginLeft: 10,
                  padding: '0.5rem 1.1rem',
                  background: '#ffc107',
                  color: '#223A5E',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: isSoldOut ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  height: '2.1rem',
                  lineHeight: '2.1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isSoldOut ? 0.5 : 1
                }}
                onClick={handleAddOption}
                disabled={isSoldOut}
              >
                추가
              </button>
            </div>
            {/* 선택된 옵션/수량/금액 리스트 */}
            <div className="selected-opt-list" style={{ marginBottom: 24 }}>
              {selectedOptions.map((opt, idx) => (
                <div className="selected-opt-item" key={opt.optionName}>
                  <div className="selected-opt-info">
                    <div>{item.itemName} + {opt.optionName}</div>
                  </div>
                  {/* 수량 조절 UI */}
                  <button className="qty-btn" onClick={() => handleQtyChange(idx, Math.max(1, opt.qty - 1))}>-</button>
                  <input
                    className="qty-input"
                    type="number"
                    min={1}
                    max={opt.optionStock}
                    value={opt.qty}
                    onChange={e => {
                      const v = Math.max(1, Math.min(opt.optionStock, Number(e.target.value)));
                      handleQtyChange(idx, v);
                    }}
                  />
                  <button className="qty-btn" onClick={() => handleQtyChange(idx, opt.qty + 1)}>+</button>
                  <div className="selected-opt-price">{(opt.price * opt.qty).toLocaleString()}원</div>
                  <button className="selected-opt-remove" onClick={() => handleRemoveOption(opt.optionName)} title="삭제">×</button>
                </div>
              ))}
            </div>
            {/* 주문금액 */}
            <div className="order-price-row" style={{ marginBottom: 28, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <span className="order-price-label">주문금액</span>
              <span className="order-price-value" style={{ marginLeft: 12 }}>{totalPrice.toLocaleString()}원</span>
            </div>
            {/* 장바구니/바로구매 버튼을 세로로 넓게 배치 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <button
                style={{
                  width: '100%',
                  background: '#fff',
                  color: '#223A5E',
                  border: '2px solid #223A5E',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  padding: '1.1rem 0',
                  cursor: isSoldOut ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s, color 0.2s',
                  opacity: isSoldOut ? 0.5 : 1
                }}
                onClick={handleCartClick}
                disabled={isSoldOut}
              >
                <MdShoppingCart style={{ fontSize: '1.6rem', marginRight: 8 }} />
                장바구니
              </button>
              <button
                style={{
                  width: '100%',
                  background: '#223A5E',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  padding: '1.1rem 0',
                  cursor: isSoldOut ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s, color 0.2s',
                  opacity: isSoldOut ? 0.5 : 1
                }}
                onClick={handleBuyNowClick}
                disabled={isSoldOut}
              >
                바로구매
              </button>
            </div>
            <div style={{ marginBottom: 16, color: '#555', fontSize: '1.1rem' }}>{item.itemDescription}</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ItemDetail;
