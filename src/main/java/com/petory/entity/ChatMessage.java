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
public class ChatMessage {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // 채팅방
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "chat_room_id")
  private ChatRoom chatRoom;

  @Column(nullable = false)
  private Long senderId;

  @Column(nullable = false, length = 1000)
  private String message;

  @Column(nullable = false)
  private LocalDateTime sentAt;

  @Column(nullable = false)
  private boolean is_read;
}
