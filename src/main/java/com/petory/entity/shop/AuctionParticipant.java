package com.petory.entity.shop;

import com.petory.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auction_participant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "participant_id")
    private Long id; // 참여자 식별번호

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AuctionSession session; // 어떤 세션인지

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member; // 참여자

    @Column(name = "connection_id", length = 255)
    private String connectionId; // WebSocket 연결 ID

    @Column(name = "joined_at")
    private LocalDateTime joinedAt; // 입장 시간

    @Column(name = "last_activity")
    private LocalDateTime lastActivity; // 마지막 활동 시간

    @Column(name = "is_active")
    private Boolean isActive; // 현재 접속 중인지
}
