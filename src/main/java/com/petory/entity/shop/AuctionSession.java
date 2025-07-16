package com.petory.entity.shop;

import com.petory.entity.BaseTimeEntity;
import com.petory.entity.Member;
import com.petory.constant.AuctionSessionStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auction_session")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionSession extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long id; // 세션 식별번호

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_item_id", nullable = false, unique = true)
    private AuctionItem auctionItem; // 어떤 경매인지 (1:1 관계)

    @Column(name = "session_key", unique = true, length = 255)
    private String sessionKey; // 세션 고유 키 (UUID 등)

    @Column(name = "participant_count")
    private Integer participantCount; // 현재 참여자 수

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private AuctionSessionStatus status; // 세션 상태

    @Column(name = "start_time")
    private LocalDateTime startTime; // 세션 시작 시간

    @Column(name = "end_time")
    private LocalDateTime endTime; // 세션 종료 시간
}
