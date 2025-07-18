package com.petory.dto.board;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.petory.dto.HashtagDto;
import com.petory.entity.Board;
import com.petory.entity.BoardHashtag;
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
  private LocalDateTime createdAt;
  private int viewCount;
  private int likeCount;
  private int commentCount;
  private boolean blinded;
  
  // 카테고리 정보 추가
  private String category;
  
  // 해시태그 리스트 필드 (목록에서는 최대 5개만 표시)
  private List<HashtagDto> hashtags;

  public static BoardListDto from(Board board, List<BoardHashtag> boardHashtags) {
    BoardListDto dto = new BoardListDto();
    dto.setId(board.getId());
    dto.setTitle(board.getTitle());

    Member author = board.getMember();
    dto.setAuthorNickName(author != null ? author.getMember_NickName() : "알 수 없는 사용자");

    dto.setCreatedAt(board.getRegDate());
    dto.setViewCount(board.getViewCount());
    dto.setLikeCount(board.getLikeCount());
    dto.setCommentCount(board.getCommentCount());
    dto.setBlinded(board.isBlinded());
    
    // 카테고리 정보 설정
    dto.setCategory(board.getBoardKind().name().toLowerCase());
    
    // 해시태그 리스트 설정 (목록에서는 최대 5개만)
    if (boardHashtags != null) {
      dto.setHashtags(boardHashtags.stream()
        .limit(5) // 최대 5개만 표시
        .map(boardHashtag -> HashtagDto.fromEntity(boardHashtag.getHashtag()))
        .collect(Collectors.toList()));
    }
    
    return dto;
  }
  
  // 기존 메서드와의 호환성을 위한 오버로드
  public static BoardListDto from(Board board) {
    return from(board, null);
  }
}
