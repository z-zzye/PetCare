package com.petory.repository.shop;

import com.petory.entity.shop.AuctionBid;
import com.petory.entity.shop.AuctionItem;
import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionBidRepository extends JpaRepository<AuctionBid, Long> {
    
    // 특정 경매의 모든 입찰 내역 조회 (시간 역순)
    List<AuctionBid> findByAuctionItemOrderByBidTimeDesc(AuctionItem auctionItem);
    
    // 특정 경매의 최고 입찰 조회
    Optional<AuctionBid> findTopByAuctionItemOrderByBidAmountDesc(AuctionItem auctionItem);
    
    // 특정 사용자의 입찰 내역 조회
    List<AuctionBid> findByMemberOrderByBidTimeDesc(Member member);
    
    // 특정 경매의 특정 사용자 입찰 내역 조회
    List<AuctionBid> findByAuctionItemAndMemberOrderByBidTimeDesc(AuctionItem auctionItem, Member member);
    
    // 특정 경매의 입찰 개수 조회
    long countByAuctionItem(AuctionItem auctionItem);
    
    // 특정 경매의 최고 입찰가 조회
    @Query("SELECT MAX(b.bidAmount) FROM AuctionBid b WHERE b.auctionItem = :auctionItem")
    Optional<Integer> findMaxBidAmountByAuctionItem(@Param("auctionItem") AuctionItem auctionItem);
    
    // 특정 경매의 최고 입찰자 조회
    @Query("SELECT b.member FROM AuctionBid b WHERE b.auctionItem = :auctionItem AND b.bidAmount = (SELECT MAX(b2.bidAmount) FROM AuctionBid b2 WHERE b2.auctionItem = :auctionItem)")
    Optional<Member> findCurrentWinnerByAuctionItem(@Param("auctionItem") AuctionItem auctionItem);
    
    // 특정 경매의 특정 사용자 입찰 개수 조회
    long countByAuctionItemAndMember(AuctionItem auctionItem, Member member);
    
    // 특정 경매의 특정 사용자 최고 입찰가 조회
    @Query("SELECT MAX(b.bidAmount) FROM AuctionBid b WHERE b.auctionItem = :auctionItem AND b.member = :member")
    Optional<Integer> findMaxBidAmountByAuctionItemAndMember(@Param("auctionItem") AuctionItem auctionItem, @Param("member") Member member);

    @Query("SELECT DISTINCT b.member FROM AuctionBid b WHERE b.auctionItem = :auctionItem")
    List<Member> findAllParticipantsByAuctionItem(@Param("auctionItem") AuctionItem auctionItem);
} 