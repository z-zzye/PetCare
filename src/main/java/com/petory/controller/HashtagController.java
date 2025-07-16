package com.petory.controller;

import com.petory.dto.HashtagDto;
import com.petory.dto.HashtagCreateDto;
import com.petory.service.HashtagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/hashtags")
public class HashtagController {
    
    private final HashtagService hashtagService;
    
    // 모든 해시태그 조회 (페이징)
    @GetMapping
    public ResponseEntity<Page<HashtagDto>> getAllHashtags(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<HashtagDto> hashtags = hashtagService.getAllHashtags(pageable);
        return ResponseEntity.ok(hashtags);
    }
    
    // 인기 해시태그 조회
    @GetMapping("/top")
    public ResponseEntity<List<HashtagDto>> getTopHashtags() {
        List<HashtagDto> hashtags = hashtagService.getTopHashtags();
        return ResponseEntity.ok(hashtags);
    }
    
    // 해시태그 검색
    @GetMapping("/search")
    public ResponseEntity<List<HashtagDto>> searchHashtags(@RequestParam String keyword) {
        List<HashtagDto> hashtags = hashtagService.searchHashtags(keyword);
        return ResponseEntity.ok(hashtags);
    }
    
    // 해시태그 생성 (관리자용)
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<HashtagDto> createHashtag(@RequestBody HashtagCreateDto createDto) {
        HashtagDto hashtag = hashtagService.createHashtag(createDto);
        return ResponseEntity.ok(hashtag);
    }
    
    // 해시태그 삭제 (관리자용)
    @DeleteMapping("/{tagId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteHashtag(@PathVariable Long tagId) {
        hashtagService.deleteHashtag(tagId);
        return ResponseEntity.ok().build();
    }
} 