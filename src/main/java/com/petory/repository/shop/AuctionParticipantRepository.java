package com.petory.repository.shop;

import com.petory.entity.shop.AuctionParticipant;
import com.petory.entity.shop.AuctionSession;
import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionParticipantRepository extends JpaRepository<AuctionParticipant, Long> {


    // 특정 세션의 모든 참여자 조회
    List<AuctionParticipant> findBySession(AuctionSession session);

    // 특정 세션의 활성 참여자들 조회 (현재 접속 중)
    List<AuctionParticipant> findBySessionAndIsActiveTrue(AuctionSession session);

    // 특정 세션의 비활성 참여자들 조회 (접속 중단)
    List<AuctionParticipant> findBySessionAndIsActiveFalse(AuctionSession session);

    // 특정 사용자의 참여 세션들 조회
    List<AuctionParticipant> findByMember(Member member);

    // 특정 사용자의 활성 참여 세션들 조회
    List<AuctionParticipant> findByMemberAndIsActiveTrue(Member member);

    // 특정 세션의 특정 사용자 참여 정보 조회
    Optional<AuctionParticipant> findBySessionAndMember(AuctionSession session, Member member);

    // 특정 세션의 특정 사용자 활성 참여 정보 조회
    Optional<AuctionParticipant> findBySessionAndMemberAndIsActiveTrue(AuctionSession session, Member member);

    // WebSocket 연결 ID로 참여자 조회
    Optional<AuctionParticipant> findByConnectionId(String connectionId);

    // 특정 세션의 참여자 수 조회
    long countBySession(AuctionSession session);

    // 특정 세션의 활성 참여자 수 조회
    long countBySessionAndIsActiveTrue(AuctionSession session);

    // 특정 세션의 비활성 참여자 수 조회
    long countBySessionAndIsActiveFalse(AuctionSession session);

    // 특정 사용자의 참여 세션 수 조회
    long countByMember(Member member);

    // 특정 사용자의 활성 참여 세션 수 조회
    long countByMemberAndIsActiveTrue(Member member);

    // 마지막 활동 시간이 특정 시간 이전인 참여자들 조회 (정리용)
    List<AuctionParticipant> findByLastActivityBefore(LocalDateTime time);

    // 특정 시간 범위에 입장한 참여자들 조회
    List<AuctionParticipant> findByJoinedAtBetween(LocalDateTime startTime, LocalDateTime endTime);

    // 특정 세션의 최고 입찰가를 가진 참여자 조회 (실시간 계산으로 변경)
    // @Query("SELECT p FROM AuctionParticipant p WHERE p.session = :session AND p.highestBidAmount = (SELECT MAX(p2.highestBidAmount) FROM AuctionParticipant p2 WHERE p2.session = :session)")
    // Optional<AuctionParticipant> findTopBidderBySession(@Param("session") AuctionSession session);

    // 특정 세션의 입찰 횟수가 많은 참여자들 조회 (실시간 계산으로 변경)
    // @Query("SELECT p FROM AuctionParticipant p WHERE p.session = :session ORDER BY p.totalBids DESC")
    // List<AuctionParticipant> findTopBiddersBySession(@Param("session") AuctionSession session);

    // 특정 세션의 참여자 존재 여부 확인
    boolean existsBySessionAndMember(AuctionSession session, Member member);

    // 특정 세션의 활성 참여자 존재 여부 확인
    boolean existsBySessionAndMemberAndIsActiveTrue(AuctionSession session, Member member);

    // 특정 연결 ID의 참여자 존재 여부 확인
    boolean existsByConnectionId(String connectionId);

    // 특정 세션의 모든 참여자 삭제 (세션 종료 시)
    void deleteBySession(AuctionSession session);

    // 특정 사용자의 모든 참여 정보 삭제
    void deleteByMember(Member member);

    // 마지막 활동 시간이 오래된 참여자들 삭제 (정리용)
    void deleteByLastActivityBefore(LocalDateTime time);
}
