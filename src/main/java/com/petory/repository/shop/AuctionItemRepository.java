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

    // 경매 시작 시간이 지난 SCHEDULED 상태의 경매 상품 조회
    List<AuctionItem> findByStartTimeBeforeAndAuctionStatus(LocalDateTime now, AuctionStatus status);

    // 특정 시간 범위에 시작할 SCHEDULED 상태의 경매 상품 조회
    List<AuctionItem> findByStartTimeBetweenAndAuctionStatus(LocalDateTime startTime, LocalDateTime endTime, AuctionStatus status);

    // 낙관적 락을 사용한 경매 상품 조회 (기본)
    @Lock(LockModeType.OPTIMISTIC)
    @Query("SELECT ai FROM AuctionItem ai WHERE ai.id = :id")
    Optional<AuctionItem> findByIdWithOptimisticLock(@Param("id") Long id);
    
    // 등록일 역순으로 모든 경매 상품 조회
    List<AuctionItem> findAllByOrderByRegDateDesc();
}
