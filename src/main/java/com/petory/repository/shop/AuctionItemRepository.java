package com.petory.repository.shop;

import com.petory.entity.shop.AuctionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import com.petory.constant.AuctionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionItemRepository extends JpaRepository<AuctionItem, Long> {
    
    // Item ID로 경매 상품 조회
    Optional<AuctionItem> findByItem_ItemId(Long itemId);
    
    // 활성 경매 목록 조회 (진행 중)
    @Query("SELECT a FROM AuctionItem a WHERE a.auctionStatus = 'ACTIVE'")
    List<AuctionItem> findActiveAuctions();
    
    // 종료된 경매 목록 조회
    @Query("SELECT a FROM AuctionItem a WHERE a.auctionStatus = 'ENDED'")
    List<AuctionItem> findEndedAuctions();

    // 경매 시작 시간이 지난 SCHEDULED 상태의 경매 상품 조회
    List<AuctionItem> findByStartTimeBeforeAndAuctionStatus(LocalDateTime now, AuctionStatus status);
    
    // 특정 시간 범위에 시작할 SCHEDULED 상태의 경매 상품 조회
    List<AuctionItem> findByStartTimeBetweenAndAuctionStatus(LocalDateTime startTime, LocalDateTime endTime, AuctionStatus status);

    // 비관적 락을 사용한 경매 상품 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ai FROM AuctionItem ai WHERE ai.id = :id")
    Optional<AuctionItem> findByIdWithPessimisticLock(@Param("id") Long id);
    
    // 낙관적 락을 사용한 경매 상품 조회 (기본)
    @Lock(LockModeType.OPTIMISTIC)
    @Query("SELECT ai FROM AuctionItem ai WHERE ai.id = :id")
    Optional<AuctionItem> findByIdWithOptimisticLock(@Param("id") Long id);
} 