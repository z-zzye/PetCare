import React from 'react';
import Header from '../Header';
import './Shop.css';

const Shop = () => {
  return (
    <div className="shop-container">
      <Header />
      <div className="shop-content">
        <div className="banner-container">
          <div className="banner-section left-banner">
            <img 
              src="/images/shopping-banner.png" 
              alt="PETORY SHOPPING" 
              className="banner-image"
            />
          </div>
          <div className="banner-section right-banner">
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
