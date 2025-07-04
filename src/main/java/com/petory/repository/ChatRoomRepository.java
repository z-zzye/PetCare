package com.petory.repository;

import com.petory.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
  Optional<ChatRoom> findBySenderIdAndReceiverId(Long senderId, Long receiverId);
  Optional<ChatRoom> findBySenderIdOrReceiverId(Long senderId, Long receiverId);
}
