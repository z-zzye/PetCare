package com.petory.service;

import com.petory.dto.HashtagDto;
import com.petory.dto.HashtagCreateDto;
import com.petory.entity.Hashtag;
import com.petory.repository.HashtagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class HashtagService {
    
    private final HashtagRepository hashtagRepository;
    
    // 모든 해시태그 조회 (페이징)
    @Transactional(readOnly = true)
    public Page<HashtagDto> getAllHashtags(Pageable pageable) {
        return hashtagRepository.findAll(pageable)
                .map(HashtagDto::fromEntity);
    }
    
    // 모든 해시태그 조회 (기존 메서드 유지)
    @Transactional(readOnly = true)
    public List<HashtagDto> getAllHashtags() {
        return hashtagRepository.findAll().stream()
                .map(HashtagDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    // 인기 해시태그 조회 (사용 횟수 순)
    @Transactional(readOnly = true)
    public List<HashtagDto> getTopHashtags() {
        return hashtagRepository.findAllByOrderByTagCountDesc().stream()
                .map(HashtagDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    // 해시태그 검색
    @Transactional(readOnly = true)
    public List<HashtagDto> searchHashtags(String keyword) {
        return hashtagRepository.findByTagNameContaining(keyword).stream()
                .map(HashtagDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    // 해시태그 생성 (관리자용)
    public HashtagDto createHashtag(HashtagCreateDto createDto) {
        // 중복 체크
        if (hashtagRepository.existsByTagName(createDto.getTagName())) {
            throw new IllegalArgumentException("이미 존재하는 해시태그입니다: " + createDto.getTagName());
        }
        
        Hashtag hashtag = Hashtag.builder()
                .tagName(createDto.getTagName())
                .tagCount(0)
                .build();
        
        Hashtag savedHashtag = hashtagRepository.save(hashtag);
        return HashtagDto.fromEntity(savedHashtag);
    }
    
    // 해시태그 삭제 (관리자용)
    public void deleteHashtag(Long tagId) {
        Hashtag hashtag = hashtagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 해시태그입니다: " + tagId));
        
        // 사용 중인 해시태그인지 확인 (게시글에 연결된 경우)
        if (hashtag.getTagCount() > 0) {
            throw new IllegalArgumentException("사용 중인 해시태그는 삭제할 수 없습니다: " + hashtag.getTagName());
        }
        
        hashtagRepository.delete(hashtag);
    }
    
    // 해시태그 사용 횟수 증가
    public void incrementTagCount(Long tagId) {
        Hashtag hashtag = hashtagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 해시태그입니다: " + tagId));
        
        hashtag.setTagCount(hashtag.getTagCount() + 1);
        hashtagRepository.save(hashtag);
    }
    
    // 해시태그 사용 횟수 감소
    public void decrementTagCount(Long tagId) {
        Hashtag hashtag = hashtagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 해시태그입니다: " + tagId));
        
        if (hashtag.getTagCount() > 0) {
            hashtag.setTagCount(hashtag.getTagCount() - 1);
            hashtagRepository.save(hashtag);
        }
    }
} 