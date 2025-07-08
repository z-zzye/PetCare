package com.petory.repository.shop;

import com.petory.entity.shop.AuctionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.petory.constant.AuctionStatus;

import java.util.List;
import java.util.Optional;

public interface AuctionItemRepository extends JpaRepository<AuctionItem, Long> {
    
    // Item ID로 경매 상품 조회
    Optional<AuctionItem> findByItem_ItemId(Long itemId);
    
    // 활성 경매 목록 조회 (진행 중)
    @Query("SELECT a FROM AuctionItem a WHERE a.auctionStatus = 'ACTIVE'")
    List<AuctionItem> findActiveAuctions();
    
    // 종료된 경매 목록 조회
    @Query("SELECT a FROM AuctionItem a WHERE a.auctionStatus = 'ENDED'")
    List<AuctionItem> findEndedAuctions();
} 