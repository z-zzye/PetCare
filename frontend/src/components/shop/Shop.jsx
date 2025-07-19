import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import './Shop.css';

const Shop = () => {
  const navigate = useNavigate();

  const handleShoppingClick = () => {
    navigate('/shop/shopping');
  };

  const handleAuctionClick = () => {
    navigate('/shop/auction');
  };

  return (
    <div className="shop-container">
      <Header />
      <div className="shop-content">
        <div className="banner-container">
          <div className="banner-section left-banner" onClick={handleShoppingClick} style={{ cursor: 'pointer' }}>
            <img 
              src="/images/shopping-banner.png" 
              alt="PETORY SHOPPING" 
              className="banner-image"
            />
          </div>
          <div className="banner-section right-banner" onClick={handleAuctionClick} style={{ cursor: 'pointer' }}>
            <img 
              src="/images/mileage-auction-banner.png" 
              alt="PETORY MILEAGE AUCTION" 
              className="banner-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
