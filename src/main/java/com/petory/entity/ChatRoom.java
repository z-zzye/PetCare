package com.petory.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoom {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // 채팅방에 참여한 두 사용자
  @Column(nullable = false)
  private Long senderId;

  @Column(nullable = false)
  private Long receiverId;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  // 편의 메서드 (채팅방 ID 결정 시 일관성 확보용)
  public static String generateRoomKey(Long senderId, Long receiverId) {
    return senderId < receiverId
      ? senderId + "_" + receiverId
      : receiverId + "_" + senderId;
  }
}
