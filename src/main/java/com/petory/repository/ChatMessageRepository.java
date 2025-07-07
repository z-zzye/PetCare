package com.petory.repository;

import com.petory.entity.ChatMessage;
import com.petory.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
  List<ChatMessage> findByChatRoomOrderBySentAtAsc(ChatRoom chatRoom);
  List<ChatMessage> findByChatRoomIdOrderBySentAtAsc(Long chatRoomId);
}
