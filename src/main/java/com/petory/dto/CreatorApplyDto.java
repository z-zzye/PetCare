package com.petory.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatorApplyDto {
    
    private String name;
    private String email;
    private String phone;
    private String instagram;
    private String youtube;
    private String tiktok;
    private String blog;
    private String content;
    private String experience;
} 