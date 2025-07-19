package com.petory.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.petory.entity.Hashtag;

public interface HashtagRepository extends JpaRepository<Hashtag, Long> {
    
    // 태그명으로 해시태그 찾기
    Optional<Hashtag> findByTagName(String tagName);
    
    // 태그명으로 존재 여부 확인
    boolean existsByTagName(String tagName);
    
    // 인기 태그 조회 (사용 횟수 순)
    @Query("SELECT h FROM Hashtag h ORDER BY h.tagCount DESC")
    List<Hashtag> findTopHashtags();
    
    // 태그명으로 검색 (부분 일치)
    @Query("SELECT h FROM Hashtag h WHERE h.tagName LIKE %:keyword% ORDER BY h.tagCount DESC")
    List<Hashtag> findByTagNameContaining(@Param("keyword") String keyword);
    
    // 태그명으로 검색 (부분 일치, 대소문자 구분 없음)
    @Query("SELECT h FROM Hashtag h WHERE LOWER(h.tagName) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY h.tagCount DESC")
    List<Hashtag> findByTagNameContainingIgnoreCase(@Param("keyword") String keyword);
    
    // 사용 횟수가 많은 순으로 정렬
    List<Hashtag> findAllByOrderByTagCountDesc();
} 