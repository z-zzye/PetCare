package com.petory.dto.board;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.petory.dto.CommentDto;
import com.petory.dto.HashtagDto;
import com.petory.entity.Board;
import com.petory.entity.BoardHashtag;
import com.petory.entity.Comment;
import com.petory.entity.Member;

import lombok.Getter;
import lombok.Setter;

// 게시물 상세보기 DTO

@Getter
@Setter
public class BoardDetailDto {

  private Long id;
  private String title;
  private String content;
  private String authorNickName;
  private String authorProfileImg;
  private String authorEmail;
  private Long authorId;
  private LocalDateTime createdAt;
  private int viewCount;
  private int likeCount;
  private List<CommentDto> comments;
  
  // 해시태그 리스트 필드
  private List<HashtagDto> hashtags;

  public static BoardDetailDto from(Board board, List<Comment> commentList, List<BoardHashtag> boardHashtags) {
    BoardDetailDto dto = new BoardDetailDto();
    dto.setId(board.getId());
    dto.setTitle(board.getTitle());
    dto.setContent(board.getContent());

    Member author = board.getMember();
    if (author != null) {
      dto.setAuthorNickName(author.getMember_NickName());
      dto.setAuthorProfileImg(author.getMember_ProfileImg());
      dto.setAuthorEmail(author.getMember_Email());
      dto.setAuthorId(author.getMember_Id());
    } else {
      dto.setAuthorNickName("알 수 없는 사용자");
      dto.setAuthorProfileImg(null);
      dto.setAuthorEmail(null);
      dto.setAuthorId(null);
    }

    dto.setCreatedAt(board.getRegDate());
    dto.setViewCount(board.getViewCount());
    dto.setLikeCount(board.getLikeCount());
    dto.setComments(commentList.stream()
      .map(CommentDto::from)
      .collect(Collectors.toList()));
      
    // 해시태그 리스트 설정
    if (boardHashtags != null) {
      dto.setHashtags(boardHashtags.stream()
        .map(boardHashtag -> HashtagDto.fromEntity(boardHashtag.getHashtag()))
        .collect(Collectors.toList()));
    }
    
    return dto;
  }
  
  // 기존 메서드와의 호환성을 위한 오버로드
  public static BoardDetailDto from(Board board, List<Comment> commentList) {
    return from(board, commentList, null);
  }
}
