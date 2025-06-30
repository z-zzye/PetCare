package com.petory.service;

import com.petory.dto.*;
import com.petory.entity.CleanBotLog;
import com.petory.entity.Member;
import com.petory.entity.WalkingTrail;
import com.petory.entity.WalkingTrailComment;
import com.petory.repository.CleanBotLogRepository;
import com.petory.repository.MemberRepository;
import com.petory.repository.WalkingTrailCommentRepository;
import com.petory.repository.WalkingTrailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 생성 (의존성 주입)
@Transactional(readOnly = true) // 클래스 전체에 읽기 전용 트랜잭션 적용 (성능 최적화)
public class WalkingTrailServiceImpl implements WalkingTrailService {

  private final WalkingTrailRepository walkingTrailRepository;
  private final WalkingTrailCommentRepository walkingTrailCommentRepository;
  private final MemberRepository memberRepository; // 사용자 정보를 가져오기 위함
  private final CleanBotService cleanBotService; // CleanBotService 주입
  private final CleanBotLogRepository cleanBotLogRepository;

  @Override
  @Transactional // 쓰기 작업이므로 readOnly=false 트랜잭션 적용
  public Long createTrail(WalkingTrailCreateDto createDto) {
    // DTO를 엔티티로 변환
    WalkingTrail newTrail = new WalkingTrail();
    newTrail.setName(createDto.getName());
    newTrail.setDescription(createDto.getDescription());
    newTrail.setPathData(createDto.getPathData());
    newTrail.setDistance(createDto.getDistance());
    newTrail.setTime(createDto.getTime());
    newTrail.setMainImage(createDto.getMainImage());

    // 리포지토리를 통해 저장
    WalkingTrail savedTrail = walkingTrailRepository.save(newTrail);
    return savedTrail.getId();
  }

  @Override
  public List<WalkingTrailListResponseDto> getAllTrails(String keyword, String sortBy) {
    // 1. 정렬 기준(sortBy)에 따라 Sort 객체 생성
    Sort sort = Sort.by(Sort.Direction.DESC, sortBy);

    // 2. 키워드 유무에 따라 다른 리포지토리 메서드 호출
    List<WalkingTrail> trails;
    if (keyword != null && !keyword.isEmpty()) {
      trails = walkingTrailRepository.findByNameContaining(keyword, sort);
    } else {
      trails = walkingTrailRepository.findAll(sort);
    }

    // 3. 결과를 DTO로 변환하여 반환
    return trails.stream()
      .map(WalkingTrailListResponseDto::from)
      .collect(Collectors.toList());
  }
  @Override
  // @Transactional // 조회수(views)를 사용하게 된다면 활성화
  public WalkingTrailDetailResponseDto getTrailDetail(Long trailId) {
    WalkingTrail trail = walkingTrailRepository.findById(trailId)
      .orElseThrow(() -> new EntityNotFoundException("해당 ID의 산책로를 찾을 수 없습니다: " + trailId));

    return WalkingTrailDetailResponseDto.from(trail);
  }

  @Override
  @Transactional
  public void addRecommendation(Long trailId) {
    WalkingTrail trail = walkingTrailRepository.findById(trailId)
      .orElseThrow(() -> new EntityNotFoundException("해당 ID의 산책로를 찾을 수 없습니다: " + trailId));

    // 추천수 1 증가
    trail.setRecommends(trail.getRecommends() + 1);
  }

  @Override
  @Transactional
  public Long addCommentToTrail(Long trailId, CommentCreateDto commentCreateDto, String userEmail) {
    WalkingTrail trail = walkingTrailRepository.findById(trailId)
            .orElseThrow(() -> new EntityNotFoundException("해당 ID의 산책로를 찾을 수 없습니다: " + trailId));
    Member member = memberRepository.findByMember_Email(userEmail)
            .orElseThrow(() -> new EntityNotFoundException("해당 이메일의 사용자를 찾을 수 없습니다: " + userEmail));

    String originalContent = commentCreateDto.getContent();
    WalkingTrailComment newComment = new WalkingTrailComment();

    // 1. 클린봇으로 비속어 검사 실행
    if (cleanBotService.containsProfanity(originalContent)) {
      // 비속어 포함 시: 블라인드 처리
      newComment.setBlinded(true);
      newComment.setOriginalContent(originalContent);
      newComment.setContent(cleanBotService.filter(originalContent)); // 필터링된 메시지로 내용 설정
    } else {
      // 정상 댓글
      newComment.setBlinded(false);
      newComment.setContent(originalContent);
    }

    newComment.setWalkingTrail(trail);
    newComment.setMember(member);

    // 2. 댓글을 먼저 저장하여 ID 할당
    WalkingTrailComment savedComment = walkingTrailCommentRepository.save(newComment);

    // 3. 비속어가 감지되었다면, 로그 기록
    if (savedComment.isBlinded()) {
      CleanBotLog log = new CleanBotLog();
      log.setTargetId(savedComment.getId());
      log.setTargetType("WALKING_TRAIL_COMMENT");
      log.setOriginalContent(savedComment.getOriginalContent());
      cleanBotLogRepository.save(log);
    }

    return savedComment.getId();
  }

  @Override
  @Transactional
  public void deleteComment(Long commentId, String userEmail) {
    WalkingTrailComment comment = walkingTrailCommentRepository.findById(commentId)
      .orElseThrow(() -> new EntityNotFoundException("해당 ID의 댓글을 찾을 수 없습니다: " + commentId));

    // 본인 확인 로직
    if (!comment.getMember().getMember_Email().equals(userEmail)) {
      throw new SecurityException("댓글을 삭제할 권한이 없습니다.");
    }

    walkingTrailCommentRepository.delete(comment);
  }
}
