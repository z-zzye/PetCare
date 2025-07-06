package com.petory.repository;

import com.petory.entity.ChatMessage;
import com.petory.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
  Optional<ChatRoom> findBySenderIdAndReceiverId(Long senderId, Long receiverId);
  Optional<ChatRoom> findBySenderIdOrReceiverId(Long senderId, Long receiverId);
  // 혹시 반대로 저장된 경우도 대비해서 추가 가능
  @Query("""
        SELECT c FROM ChatRoom c
        WHERE (c.senderId = :sender AND c.receiverId = :receiver)
           OR (c.senderId = :receiver AND c.receiverId = :sender)
    """)
  Optional<ChatRoom> findRoomBetweenMembers(@Param("sender") Long senderId, @Param("receiver") Long receiverId);



}
