package com.petory.dto;

import com.petory.entity.Hashtag;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HashtagDto {
    
    private Long tagId;
    private String tagName;
    private Integer tagCount;
    private LocalDateTime createdAt;
    
    public static HashtagDto fromEntity(Hashtag hashtag) {
        return HashtagDto.builder()
                .tagId(hashtag.getTagId())
                .tagName(hashtag.getTagName())
                .tagCount(hashtag.getTagCount())
                .createdAt(hashtag.getCreatedAt())
                .build();
    }
} 