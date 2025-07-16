package com.petory.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberHashtagDto {
    
    private Long memberId;
    private List<Long> tagIds;  // 선택된 해시태그 ID 목록
} 