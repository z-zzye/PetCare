package com.petory.dto;

import com.petory.entity.Comment;
import com.petory.entity.Member;
import com.petory.entity.WalkingTrailComment;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

// 댓글 조회 DTO

@Getter
@Setter
public class CommentDto {
  private Long id;
  private String content;
  private String authorNickName;
  private String authorProfileImg;
  private LocalDateTime createdAt;

  public static CommentDto from(Comment comment) {
    CommentDto dto = new CommentDto();
    dto.setId(comment.getId());
    dto.setContent(comment.getContent());

    Member author = comment.getMember();
    if (author != null) {
      dto.setAuthorNickName(author.getMember_NickName());
      dto.setAuthorProfileImg(author.getMember_ProfileImg());
    } else {
      dto.setAuthorNickName("알 수 없는 사용자");
      dto.setAuthorProfileImg(null);
    }

    dto.setCreatedAt(comment.getRegDate());
    return dto;
  }

  public static CommentDto from(WalkingTrailComment trailComment) {
    CommentDto dto = new CommentDto();
    dto.setId(trailComment.getId());
    dto.setContent(trailComment.getContent());

    Member author = trailComment.getMember();
    if (author != null) {
      dto.setAuthorNickName(author.getMember_NickName());
      dto.setAuthorProfileImg(author.getMember_ProfileImg());
    } else {
      dto.setAuthorNickName("알 수 없는 사용자");
      dto.setAuthorProfileImg(null); // 혹은 기본 이미지 경로
    }

    dto.setCreatedAt(trailComment.getRegDate());
    return dto;
  }
}
