package com.petory.dto;

import com.petory.constant.ApplyStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorApplyAdminDto {
    private Long applyId;
    private String memberName;
    private String memberEmail;
    private String maincontents;
    private String producingex;
    private String creatorInsta;
    private String creatorYoutube;
    private String creatorTiktok;
    private String creatorBlog;
    private ApplyStatus applyStatus;
    private LocalDateTime regDate;
    private LocalDateTime applyProcessDate;
    private String rejectReason;
} 