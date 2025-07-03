import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import Header from '../Header.jsx';

function WhatsInMyCart() {
  const [cartItems, setCartItems] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [allChecked, setAllChecked] = useState(false);

  // 장바구니 데이터 불러오기
  useEffect(() => {
    axios.get('/cart')
      .then(res => {
        setCartItems(res.data);
        setCheckedIds(res.data.map(item => item.item.itemId + '-' + (item.option?.optionId || '')));
        setAllChecked(true);
      });
  }, []);

  // 체크박스 핸들러
  const handleCheck = (id) => {
    setCheckedIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };
  const handleAllCheck = () => {
    if (allChecked) {
      setCheckedIds([]);
      setAllChecked(false);
    } else {
      setCheckedIds(cartItems.map(item => item.item.itemId + '-' + (item.option?.optionId || '')));
      setAllChecked(true);
    }
  };

  // 수량 변경
  const handleQtyChange = (cartItem, newQty) => {
    if (newQty < 1) return;
    axios.patch(`/cart/${cartItem.cartItemId}?quantity=${newQty}`)
      .then(() => {
        setCartItems(items => items.map(i =>
          i.cartItemId === cartItem.cartItemId ? { ...i, quantity: newQty } : i
        ));
      });
  };

  // 삭제
  const handleDelete = (cartItemId) => {
    axios.delete(`/cart/${cartItemId}`)
      .then(() => {
        setCartItems(items => items.filter(i => i.cartItemId !== cartItemId));
        setCheckedIds(ids => ids.filter(id => !id.startsWith(cartItemId + '-')));
      });
  };

  // 선택삭제
  const handleDeleteSelected = () => {
    checkedIds.forEach(id => {
      const cartItem = cartItems.find(i => (i.item.itemId + '-' + (i.option?.optionId || '')) === id);
      if (cartItem) handleDelete(cartItem.cartItemId);
    });
  };

  // 금액 계산
  const selectedItems = cartItems.filter(i => checkedIds.includes(i.item.itemId + '-' + (i.option?.optionId || '')));
  const totalPrice = selectedItems.reduce((sum, i) => {
    const price = (i.item.itemPrice || 0) + (i.option?.optionAddPrice || 0);
    return sum + price * (i.quantity || 1);
  }, 0);
  const shippingFee = selectedItems.length > 0 ? 2500 : 0;
  const finalPrice = totalPrice + shippingFee;

  return (
    <>
      <Header />
      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', padding: '2rem 0' }}>
        {/* 좌측: 장바구니 리스트 */}
        <div style={{ flex: 2, marginRight: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <input type="checkbox" checked={allChecked} onChange={handleAllCheck} />
            <span style={{ marginLeft: 8, fontWeight: 600 }}>모두선택</span>
            <button 
              style={{ 
                marginLeft: 18, 
                background: '#FFB300', 
                color: '#223A5E', 
                border: 'none', 
                borderRadius: 6, 
                padding: '6px 16px', 
                fontWeight: 700, 
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#e6a100'}
              onMouseOut={e => e.currentTarget.style.background = '#FFB300'}
              onClick={handleDeleteSelected}
            >선택삭제</button>
          </div>
          {cartItems.length === 0 ? (
            <div style={{ padding: '2rem', color: '#888' }}>장바구니가 비어 있습니다.</div>
          ) : (
            cartItems.map(item => {
              const id = item.item.itemId + '-' + (item.option?.optionId || '');
              const price = (item.item.itemPrice || 0) + (item.option?.optionAddPrice || 0);
              const totalPrice = price * (item.quantity || 1);
              // 옵션 비활성화 체크
              const isOptionDeleted = item.option && (
                item.option.isActive === false ||
                item.option.isActive === 0 ||
                item.option.isActive === 'N'
              );
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: '1.2rem 0', opacity: isOptionDeleted ? 0.6 : 1 }}>
                  <input type="checkbox" checked={checkedIds.includes(id)} onChange={() => handleCheck(id)} disabled={isOptionDeleted} />
                  <img src={
                    item.item.images?.[0]?.url || item.item.thumbnailUrl
                  } alt="대표이미지" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, margin: '0 18px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{item.item.itemName}</div>
                    <div style={{ color: '#888', fontSize: '0.98rem', marginBottom: 8 }}>
                      {item.option?.optionName}
                      {isOptionDeleted && (
                        <div style={{ color: 'red', fontSize: '0.85rem', marginTop: 2 }}>
                          품절된 상품입니다
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button 
                        onClick={() => handleQtyChange(item, item.quantity - 1)} 
                        style={{ 
                          width: 28, 
                          height: 28, 
                          background: '#FFB300', 
                          color: '#223A5E', 
                          border: 'none', 
                          borderRadius: 6, 
                          fontWeight: 700, 
                          fontSize: 18, 
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#e6a100'}
                        onMouseOut={e => e.currentTarget.style.background = '#FFB300'}
                        disabled={isOptionDeleted}
                      >-</button>
                      <span style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        onClick={() => handleQtyChange(item, item.quantity + 1)} 
                        style={{ 
                          width: 28, 
                          height: 28, 
                          background: '#FFB300', 
                          color: '#223A5E', 
                          border: 'none', 
                          borderRadius: 6, 
                          fontWeight: 700, 
                          fontSize: 18, 
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#e6a100'}
                        onMouseOut={e => e.currentTarget.style.background = '#FFB300'}
                        disabled={isOptionDeleted}
                      >+</button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 90, textAlign: 'right' }}>{totalPrice.toLocaleString()}원</div>
                  <button onClick={() => handleDelete(item.cartItemId)} style={{ marginLeft: 16, color: '#ff5252', fontWeight: 700, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }} disabled={isOptionDeleted}>×</button>
                </div>
              );
            })
          )}
        </div>
        {/* 우측: 결제 요약 */}
        <div style={{ flex: 1, background: '#fafbfc', borderRadius: 12, padding: '2rem 1.5rem', minWidth: 320, maxHeight: 400, alignSelf: 'flex-start', boxShadow: '0 2px 12px #0001' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 18 }}>결제금액 요약</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span>주문금액</span>
            <span>{totalPrice.toLocaleString()}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span>배송비</span>
            <span>{shippingFee.toLocaleString()}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem', margin: '18px 0' }}>
            <span>최종 결제금액</span>
            <span style={{ color: '#223A5E' }}>{finalPrice.toLocaleString()}원</span>
          </div>
          <button style={{ width: '100%', background: '#223A5E', color: '#fff', fontWeight: 700, fontSize: '1.1rem', border: 'none', borderRadius: 8, padding: '1rem 0', cursor: 'pointer' }}
            disabled={selectedItems.some(i => i.option && (i.option.isActive === false || i.option.isActive === 0 || i.option.isActive === 'N'))}>
            {selectedItems.length}개 상품 구매하기
          </button>
        </div>
      </div>
    </>
  );
}

export default WhatsInMyCart;
