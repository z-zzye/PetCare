package com.petory.repository.shop;

import com.petory.entity.shop.AuctionHistory;
import com.petory.entity.shop.AuctionItem;
import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionHistoryRepository extends JpaRepository<AuctionHistory, Long> {
    
    // 특정 경매의 히스토리 조회 (시간 역순)
    List<AuctionHistory> findByAuctionItemOrderByRegDateDesc(AuctionItem auctionItem);
    
    // 특정 사용자의 경매 히스토리 조회 (시간 역순)
    List<AuctionHistory> findByMemberOrderByRegDateDesc(Member member);
    
    // 특정 사용자의 낙찰 성공 히스토리 조회
    List<AuctionHistory> findByMemberAndIsWinnerTrue(Member member);
    
    // 특정 사용자의 낙찰 실패 히스토리 조회
    List<AuctionHistory> findByMemberAndIsWinnerFalse(Member member);
    
    // 특정 경매의 낙찰자 히스토리 조회
    Optional<AuctionHistory> findByAuctionItemAndIsWinnerTrue(AuctionItem auctionItem);
    
    // 언더스코어 필드명(member_Id) 문제 해결: @Query 직접 작성
    @Query("SELECT h FROM AuctionHistory h WHERE h.auctionItem.id = :auctionItemId AND h.member.member_Id = :memberId")
    Optional<AuctionHistory> findByAuctionItemIdAndMemberId(@Param("auctionItemId") Long auctionItemId, @Param("memberId") Long memberId);
    

} 