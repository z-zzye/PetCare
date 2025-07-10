package com.petory.dto.board;

import com.petory.dto.CommentDto;
import com.petory.entity.Board;
import com.petory.entity.Comment;
import com.petory.entity.Member;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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
  private LocalDateTime createdAt;
  private int viewCount;
  private int likeCount;
  private List<CommentDto> comments;

  public static BoardDetailDto from(Board board, List<Comment> commentList) {
    BoardDetailDto dto = new BoardDetailDto();
    dto.setId(board.getId());
    dto.setTitle(board.getTitle());
    dto.setContent(board.getContent());

    Member author = board.getMember();
    if (author != null) {
      dto.setAuthorNickName(author.getMember_NickName());
      dto.setAuthorProfileImg(author.getMember_ProfileImg());
      dto.setAuthorEmail(author.getMember_Email());
    } else {
      dto.setAuthorNickName("알 수 없는 사용자");
      dto.setAuthorProfileImg(null);
      dto.setAuthorEmail(null);
    }

    dto.setCreatedAt(board.getRegDate());
    dto.setViewCount(board.getViewCount());
    dto.setLikeCount(board.getLikeCount());
    dto.setComments(commentList.stream()
      .map(CommentDto::from)
      .collect(Collectors.toList()));
    return dto;
  }
}
