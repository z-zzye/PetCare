package com.petory.repository;

import com.petory.entity.BoardHashtag;
import com.petory.entity.BoardHashtagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BoardHashtagRepository extends JpaRepository<BoardHashtag, BoardHashtagId> {
    
    // 게시글 ID로 연결된 해시태그 조회
    @Query("SELECT bh FROM BoardHashtag bh WHERE bh.board.id = :postId")
    List<BoardHashtag> findByPostId(@Param("postId") Long postId);
    
    // 해시태그 ID로 연결된 게시글 수 조회
    @Query("SELECT COUNT(bh) FROM BoardHashtag bh WHERE bh.hashtag.tagId = :tagId")
    Long countByTagId(@Param("tagId") Long tagId);
    
    // 게시글 ID로 모든 연결 삭제
    @Query("DELETE FROM BoardHashtag bh WHERE bh.board.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
} 