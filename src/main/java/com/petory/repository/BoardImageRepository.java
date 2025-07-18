package com.petory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.petory.entity.BoardImage;

@Repository
public interface BoardImageRepository extends JpaRepository<BoardImage, Long> {
    
    // 게시글 ID로 이미지 목록 조회 (순서대로)
    List<BoardImage> findByBoardIdOrderByDisplayOrderAsc(Long boardId);
    
    // 게시글 ID로 이미지 개수 조회
    @Query("SELECT COUNT(bi) FROM BoardImage bi WHERE bi.board.id = :boardId")
    Long countByBoardId(@Param("boardId") Long boardId);
    
    // 게시글 삭제 시 관련 이미지들도 삭제
    void deleteByBoardId(Long boardId);
    
    // 특정 게시글의 최대 displayOrder 조회
    @Query("SELECT MAX(bi.displayOrder) FROM BoardImage bi WHERE bi.board.id = :boardId")
    Integer findMaxDisplayOrderByBoardId(@Param("boardId") Long boardId);
} 