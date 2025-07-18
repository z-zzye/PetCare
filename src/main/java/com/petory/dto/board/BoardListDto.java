package com.petory.dto.board;

import java.time.LocalDateTime;

import com.petory.entity.Board;
import com.petory.entity.Member;

import lombok.Getter;
import lombok.Setter;

// 게시판 조회 DTO

@Getter
@Setter
public class BoardListDto {

  private Long id;
  private String title;
  private String authorNickName;
  private Long authorId;
  private String authorEmail;
  private LocalDateTime createdAt;
  private int viewCount;
  private int likeCount;
  private int commentCount;
  private boolean blinded;

  public static BoardListDto from(Board board) {
    BoardListDto dto = new BoardListDto();
    dto.setId(board.getId());
    dto.setTitle(board.getTitle());

    Member author = board.getMember();
    dto.setAuthorNickName(author != null ? author.getMember_NickName() : "알 수 없는 사용자");
    dto.setAuthorId(author != null ? author.getMember_Id() : null);
    dto.setAuthorEmail(author != null ? author.getMember_Email() : null);

    dto.setCreatedAt(board.getRegDate());
    dto.setViewCount(board.getViewCount());
    dto.setLikeCount(board.getLikeCount());
    dto.setCommentCount(board.getCommentCount());
    dto.setBlinded(board.isBlinded());
    return dto;
  }
}
