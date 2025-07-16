package com.petory.repository.shop;

import com.petory.entity.shop.AuctionHistory;
import com.petory.entity.shop.AuctionItem;
import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionHistoryRepository extends JpaRepository<AuctionHistory, Long> {
    
    // 특정 경매의 모든 히스토리 조회
    List<AuctionHistory> findByAuctionItem(AuctionItem auctionItem);
    
    // 특정 경매의 히스토리 조회 (시간 역순)
    List<AuctionHistory> findByAuctionItemOrderByRegDateDesc(AuctionItem auctionItem);
    
    // 특정 사용자의 모든 경매 히스토리 조회
    List<AuctionHistory> findByMember(Member member);
    
    // 특정 사용자의 경매 히스토리 조회 (시간 역순)
    List<AuctionHistory> findByMemberOrderByRegDateDesc(Member member);
    
    // 특정 사용자의 낙찰 성공 히스토리 조회
    List<AuctionHistory> findByMemberAndIsWinnerTrue(Member member);
    
    // 특정 사용자의 낙찰 실패 히스토리 조회
    List<AuctionHistory> findByMemberAndIsWinnerFalse(Member member);
    
    // 특정 경매의 낙찰자 히스토리 조회
    Optional<AuctionHistory> findByAuctionItemAndIsWinnerTrue(AuctionItem auctionItem);
    
    // 특정 경매의 참여자들 히스토리 조회 (낙찰자 제외)
    List<AuctionHistory> findByAuctionItemAndIsWinnerFalse(AuctionItem auctionItem);
    
    // 특정 경매의 특정 사용자 히스토리 조회 (기존)
    // Optional<AuctionHistory> findByAuctionItemAndMember(AuctionItem auctionItem, Member member);

    // 특정 경매의 특정 사용자 히스토리 조회 (id 기반)
    // Optional<AuctionHistory> findByAuctionItem_IdAndMember_Member_Id(Long auctionItemId, Long member_Id); // JPA 네이밍 규칙 문제로 사용 안 함

    // 언더스코어 필드명(member_Id) 문제 해결: @Query 직접 작성
    @Query("SELECT h FROM AuctionHistory h WHERE h.auctionItem.id = :auctionItemId AND h.member.member_Id = :memberId")
    Optional<AuctionHistory> findByAuctionItemIdAndMemberId(@Param("auctionItemId") Long auctionItemId, @Param("memberId") Long memberId);
    
    // 특정 시간 범위의 경매 히스토리 조회
    List<AuctionHistory> findByRegDateBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    // 특정 사용자의 특정 시간 범위 히스토리 조회
    List<AuctionHistory> findByMemberAndRegDateBetween(Member member, LocalDateTime startTime, LocalDateTime endTime);
    
    // 특정 경매의 참여자 수 조회
    long countByAuctionItem(AuctionItem auctionItem);
    
    // 특정 사용자의 경매 참여 횟수 조회
    long countByMember(Member member);
    
    // 특정 사용자의 낙찰 성공 횟수 조회
    long countByMemberAndIsWinnerTrue(Member member);
    
    // 특정 사용자의 낙찰 실패 횟수 조회
    long countByMemberAndIsWinnerFalse(Member member);
    
    // 특정 경매의 최고 입찰가 조회
    @Query("SELECT MAX(h.myHighestBid) FROM AuctionHistory h WHERE h.auctionItem = :auctionItem")
    Optional<Integer> findMaxBidByAuctionItem(@Param("auctionItem") AuctionItem auctionItem);
    
    // 특정 사용자의 최고 입찰가 조회
    @Query("SELECT MAX(h.myHighestBid) FROM AuctionHistory h WHERE h.member = :member")
    Optional<Integer> findMaxBidByMember(@Param("member") Member member);
    
    // 특정 사용자의 평균 입찰가 조회
    @Query("SELECT AVG(h.myHighestBid) FROM AuctionHistory h WHERE h.member = :member")
    Optional<Double> findAverageBidByMember(@Param("member") Member member);
    
    // 특정 경매의 평균 입찰가 조회
    @Query("SELECT AVG(h.myHighestBid) FROM AuctionHistory h WHERE h.auctionItem = :auctionItem")
    Optional<Double> findAverageBidByAuctionItem(@Param("auctionItem") AuctionItem auctionItem);
    
    // 특정 사용자의 낙찰률 조회
    @Query("SELECT (COUNT(CASE WHEN h.isWinner = true THEN 1 END) * 100.0 / COUNT(h)) FROM AuctionHistory h WHERE h.member = :member")
    Optional<Double> findWinRateByMember(@Param("member") Member member);
    
    // 특정 경매의 참여자 수와 낙찰자 조회
    @Query("SELECT COUNT(h) as participantCount, " +
           "MAX(CASE WHEN h.isWinner = true THEN h.member END) as winner " +
           "FROM AuctionHistory h WHERE h.auctionItem = :auctionItem")
    Object[] findAuctionStats(@Param("auctionItem") AuctionItem auctionItem);
    
    // 특정 사용자의 최근 경매 히스토리 조회 (최근 10개)
    @Query("SELECT h FROM AuctionHistory h WHERE h.member = :member ORDER BY h.regDate DESC")
    List<AuctionHistory> findRecentHistoryByMember(@Param("member") Member member);
    
    // 특정 경매의 참여자들 히스토리 조회 (입찰가 역순)
    @Query("SELECT h FROM AuctionHistory h WHERE h.auctionItem = :auctionItem ORDER BY h.myHighestBid DESC")
    List<AuctionHistory> findParticipantsByBidAmount(@Param("auctionItem") AuctionItem auctionItem);
    
    // 특정 사용자의 경매 히스토리 존재 여부 확인
    boolean existsByAuctionItemAndMember(AuctionItem auctionItem, Member member);
    
    // 특정 경매의 낙찰자 존재 여부 확인
    boolean existsByAuctionItemAndIsWinnerTrue(AuctionItem auctionItem);
    
    // 특정 사용자의 낙찰 성공 존재 여부 확인
    boolean existsByMemberAndIsWinnerTrue(Member member);
    
    // 특정 경매의 모든 히스토리 삭제
    void deleteByAuctionItem(AuctionItem auctionItem);
    
    // 특정 사용자의 모든 히스토리 삭제
    void deleteByMember(Member member);
    
    // 특정 시간 이전의 히스토리 삭제 (정리용)
    void deleteByRegDateBefore(LocalDateTime time);
} 