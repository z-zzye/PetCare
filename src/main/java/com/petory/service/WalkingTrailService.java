package com.petory.service;

import com.petory.dto.CommentCreateDto;
import com.petory.dto.WalkingTrailCreateDto;
import com.petory.dto.WalkingTrailDetailResponseDto;
import com.petory.dto.WalkingTrailListResponseDto;

import java.util.List;

public interface WalkingTrailService {

  /**
   * 새로운 산책로를 생성합니다.
   * @param createDto 산책로 생성에 필요한 데이터
   * @return 생성된 산책로의 ID
   */
  Long createTrail(WalkingTrailCreateDto createDto);

  /**
   * 모든 산책로 목록을 조회합니다. (목록용 DTO로 변환하여 반환)
   * @return 산책로 목록
   */
  List<WalkingTrailListResponseDto> getAllTrails();

  /**
   * 특정 산책로의 상세 정보를 조회합니다.
   * @param trailId 조회할 산책로의 ID
   * @return 산책로 상세 정보 (댓글 포함)
   */
  WalkingTrailDetailResponseDto getTrailDetail(Long trailId);

  /**
   * 특정 산책로의 추천수를 1 증가시킵니다.
   * @param trailId 추천할 산책로의 ID
   */
  void addRecommendation(Long trailId);

  /**
   * 특정 산책로에 댓글을 추가합니다.
   * @param trailId 댓글을 추가할 산책로의 ID
   * @param commentCreateDto 생성할 댓글 내용
   * @param userEmail 댓글 작성자의 이메일 (인증 정보)
   * @return 생성된 댓글의 ID
   */
  Long addCommentToTrail(Long trailId, CommentCreateDto commentCreateDto, String userEmail);

  /**
   * 산책로의 댓글을 삭제합니다.
   * @param commentId 삭제할 댓글의 ID
   * @param userEmail 삭제를 요청한 사용자의 이메일 (본인 확인용)
   */
  void deleteComment(Long commentId, String userEmail);
}
