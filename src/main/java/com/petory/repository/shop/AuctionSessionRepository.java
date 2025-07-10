package com.petory.repository.shop;

import com.petory.entity.shop.AuctionSession;
import com.petory.constant.AuctionSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionSessionRepository extends JpaRepository<AuctionSession, Long> {
    
    // 경매 상품 ID로 세션 조회
    Optional<AuctionSession> findByAuctionItemId(Long auctionItemId);
    
    // 세션 키로 세션 조회
    Optional<AuctionSession> findBySessionKey(String sessionKey);
    
    // 특정 상태의 세션들 조회
    List<AuctionSession> findByStatus(AuctionSessionStatus status);
    
    // 특정 시간 이전에 종료된 세션들 조회 (정리용)
    List<AuctionSession> findByStatusAndEndTimeBefore(AuctionSessionStatus status, LocalDateTime time);
    
    // 현재 진행 중인 모든 세션 조회
    @Query("SELECT s FROM AuctionSession s WHERE s.status = :status AND s.startTime <= :now AND s.endTime > :now")
    List<AuctionSession> findActiveSessionsByTime(@Param("status") AuctionSessionStatus status, @Param("now") LocalDateTime now);
    
    // 경매 시작 시간이 지난 예정 세션들 조회 (시작 대기 중)
    @Query("SELECT s FROM AuctionSession s WHERE s.status = :status AND s.startTime <= :now")
    List<AuctionSession> findSessionsToStart(@Param("status") AuctionSessionStatus status, @Param("now") LocalDateTime now);
    
    // 경매 종료 시간이 지난 활성 세션들 조회 (종료 대기 중)
    @Query("SELECT s FROM AuctionSession s WHERE s.status = :status AND s.endTime <= :now")
    List<AuctionSession> findSessionsToEnd(@Param("status") AuctionSessionStatus status, @Param("now") LocalDateTime now);
    
    // 참여자 수가 특정 수 이상인 세션들 조회
    List<AuctionSession> findByParticipantCountGreaterThanEqual(Integer minParticipantCount);
    
    // 특정 시간 범위에 생성된 세션들 조회 (BaseTimeEntity의 regDate 사용)
    List<AuctionSession> findByRegDateBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    // 세션 존재 여부 확인
    boolean existsByAuctionItemId(Long auctionItemId);
    
    // 세션 키 존재 여부 확인
    boolean existsBySessionKey(String sessionKey);
    
    // 활성 세션 개수 조회
    long countByStatus(AuctionSessionStatus status);
    
    // 현재 진행 중인 세션 개수 조회
    @Query("SELECT COUNT(s) FROM AuctionSession s WHERE s.status = :status AND s.startTime <= :now AND s.endTime > :now")
    long countActiveSessionsByTime(@Param("status") AuctionSessionStatus status, @Param("now") LocalDateTime now);
} 