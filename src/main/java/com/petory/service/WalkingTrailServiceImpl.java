package com.petory.service;

import com.petory.dto.*;
import com.petory.entity.Member;
import com.petory.entity.WalkingTrail;
import com.petory.entity.WalkingTrailComment;
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
    // 산책로와 사용자 엔티티 조회
    WalkingTrail trail = walkingTrailRepository.findById(trailId)
      .orElseThrow(() -> new EntityNotFoundException("해당 ID의 산책로를 찾을 수 없습니다: " + trailId));
    Member member = memberRepository.findByMember_Email(userEmail) // MemberRepository에 이 메서드가 있다고 가정
      .orElseThrow(() -> new EntityNotFoundException("해당 이메일의 사용자를 찾을 수 없습니다: " + userEmail));

    // 새로운 댓글 엔티티 생성 및 연관관계 설정
    WalkingTrailComment newComment = new WalkingTrailComment();
    newComment.setContent(commentCreateDto.getContent());
    newComment.setWalkingTrail(trail);
    newComment.setMember(member);

    // 댓글 저장
    WalkingTrailComment savedComment = walkingTrailCommentRepository.save(newComment);
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
