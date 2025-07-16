package com.petory.repository.shop;

import com.petory.entity.shop.AuctionDelivery;
import com.petory.entity.shop.AuctionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionDeliveryRepository extends JpaRepository<AuctionDelivery, Long> {

    /**
     * AuctionHistory로 배송 정보 조회
     */
    Optional<AuctionDelivery> findByAuctionHistory(AuctionHistory auctionHistory);

    /**
     * AuctionHistory ID로 배송 정보 조회
     */
    Optional<AuctionDelivery> findByAuctionHistoryId(Long historyId);

    /**
     * 배송지 입력 마감일이 지났는데 주소가 입력되지 않은 배송 정보 조회
     */
    @Query("SELECT ad FROM AuctionDelivery ad WHERE ad.deliveryDeadline < :now AND ad.deliveryAddress IS NULL")
    List<AuctionDelivery> findExpiredUnclaimedDeliveries(@Param("now") LocalDateTime now);

    /**
     * 특정 사용자의 배송 정보 조회
     */
    @Query("SELECT ad FROM AuctionDelivery ad JOIN ad.auctionHistory ah WHERE ah.member.member_Id = :memberId")
    List<AuctionDelivery> findByMemberId(@Param("memberId") Long memberId);

    /**
     * 배송지 입력 완료된 배송 정보 조회
     */
    @Query("SELECT ad FROM AuctionDelivery ad WHERE ad.deliveryAddress IS NOT NULL")
    List<AuctionDelivery> findCompletedDeliveries();

    /**
     * 배송지 입력 미완료된 배송 정보 조회
     */
    @Query("SELECT ad FROM AuctionDelivery ad WHERE ad.deliveryAddress IS NULL")
    List<AuctionDelivery> findIncompleteDeliveries();
} 