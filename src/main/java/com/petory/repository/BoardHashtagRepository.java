package com.petory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.petory.entity.BoardHashtag;
import com.petory.entity.BoardHashtagId;

public interface BoardHashtagRepository extends JpaRepository<BoardHashtag, BoardHashtagId> {
    
    // 게시글 ID로 연결된 해시태그 조회
    @Query("SELECT bh FROM BoardHashtag bh WHERE bh.board.id = :postId")
    List<BoardHashtag> findByPostId(@Param("postId") Long postId);
    
    // 해시태그 ID로 연결된 게시글 수 조회
    @Query("SELECT COUNT(bh) FROM BoardHashtag bh WHERE bh.hashtag.tagId = :tagId")
    Long countByTagId(@Param("tagId") Long tagId);
    
    // 게시글 ID로 모든 연결 삭제
    @Modifying
    @Query("DELETE FROM BoardHashtag bh WHERE bh.board.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
    
    // 특정 해시태그를 가진 게시글 ID 목록 조회
    @Query("SELECT bh.board.id FROM BoardHashtag bh WHERE bh.hashtag.tagId = :tagId")
    List<Long> findBoardIdsByTagId(@Param("tagId") Long tagId);
    
    // 여러 해시태그를 가진 게시글 ID 목록 조회 (OR 조건)
    @Query("SELECT DISTINCT bh.board.id FROM BoardHashtag bh WHERE bh.hashtag.tagId IN :tagIds")
    List<Long> findBoardIdsByTagIds(@Param("tagIds") List<Long> tagIds);
    
    // 해시태그 이름으로 게시글 ID 목록 조회
    @Query("SELECT bh.board.id FROM BoardHashtag bh WHERE bh.hashtag.tagName = :tagName")
    List<Long> findBoardIdsByTagName(@Param("tagName") String tagName);
    
    // 해시태그 이름 패턴으로 게시글 ID 목록 조회
    @Query("SELECT bh.board.id FROM BoardHashtag bh WHERE bh.hashtag.tagName LIKE %:tagNamePattern%")
    List<Long> findBoardIdsByTagNamePattern(@Param("tagNamePattern") String tagNamePattern);
    
    // 게시글 ID로 해시태그 이름 목록 조회
    @Query("SELECT bh.hashtag.tagName FROM BoardHashtag bh WHERE bh.board.id = :postId")
    List<String> findTagNamesByPostId(@Param("postId") Long postId);
    
    // 특정 게시글의 특정 해시태그 존재 여부 확인
    @Query("SELECT COUNT(bh) > 0 FROM BoardHashtag bh WHERE bh.board.id = :postId AND bh.hashtag.tagId = :tagId")
    boolean existsByPostIdAndTagId(@Param("postId") Long postId, @Param("tagId") Long tagId);
    
    // 카테고리별 특정 해시태그를 가진 게시글 ID 목록 조회
    @Query("SELECT bh.board.id FROM BoardHashtag bh WHERE bh.hashtag.tagId = :tagId AND bh.board.boardKind = :boardKind")
    List<Long> findBoardIdsByTagIdAndBoardKind(@Param("tagId") Long tagId, @Param("boardKind") String boardKind);
    
    // 카테고리별 여러 해시태그를 가진 게시글 ID 목록 조회 (OR 조건)
    @Query("SELECT DISTINCT bh.board.id FROM BoardHashtag bh WHERE bh.hashtag.tagId IN :tagIds AND bh.board.boardKind = :boardKind")
    List<Long> findBoardIdsByTagIdsAndBoardKind(@Param("tagIds") List<Long> tagIds, @Param("boardKind") String boardKind);
} 