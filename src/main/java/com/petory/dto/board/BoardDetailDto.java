package com.petory.dto.board;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.petory.constant.BoardKind;
import com.petory.dto.CommentDto;
import com.petory.dto.HashtagDto;
import com.petory.entity.Board;
import com.petory.entity.BoardHashtag;
import com.petory.entity.BoardImage;
import com.petory.entity.Comment;

import lombok.Getter;
import lombok.Setter;

// 게시물 상세보기 DTO

@Getter
@Setter
public class BoardDetailDto {

  private Long id;
  private String title;
  private String content;
  private BoardKind boardKind;
  private String memberEmail;
  private String memberNickname;
  private LocalDateTime regDate;
  private LocalDateTime modDate;
  private int viewCount;
  private int commentCount;
  private int likeCount;
  private boolean blinded;
  private List<CommentDto> comments;
  private List<HashtagDto> hashtags; // 원래대로 HashtagDto로 복원
  private List<BoardImageDto> images; // 이미지 목록 추가

  public static BoardDetailDto from(Board board, List<Comment> comments, List<BoardHashtag> boardHashtags, List<BoardImage> images) {
    BoardDetailDto dto = new BoardDetailDto();
    dto.setId(board.getId());
    dto.setTitle(board.getTitle());
    dto.setContent(board.getContent());
    dto.setBoardKind(board.getBoardKind());
    dto.setMemberEmail(board.getMember().getMember_Email());
    dto.setMemberNickname(board.getMember().getMember_NickName());
    dto.setRegDate(board.getRegDate());
    dto.setModDate(board.getUpdateDate());
    dto.setViewCount(board.getViewCount());
    dto.setCommentCount(board.getCommentCount());
    dto.setLikeCount(board.getLikeCount());
    dto.setBlinded(board.isBlinded());
    
    // 댓글 목록 변환
    dto.setComments(comments.stream()
      .map(CommentDto::from)
      .collect(Collectors.toList()));
    
    // 해시태그 목록 변환 (원래대로 HashtagDto 사용)
    dto.setHashtags(boardHashtags.stream()
      .map(bh -> HashtagDto.fromEntity(bh.getHashtag()))
      .collect(Collectors.toList()));
    
    // 이미지 목록 변환
    dto.setImages(images.stream()
      .map(BoardImageDto::from)
      .collect(Collectors.toList()));
    
    return dto;
  }
  
  // 기존 메서드와의 호환성을 위한 오버로드
  public static BoardDetailDto from(Board board, List<Comment> commentList) {
    return from(board, commentList, null, null);
  }
}
