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
public class VetApplyAdminDto {
    private Long applyId;
    private String memberName;
    private String memberEmail;
    private String licenseNumber;
    private String hospitalName;
    private String hospitalAddress;
    private String hospitalPhone;
    private String specialization;
    private Integer experienceYears;
    private String certifications;
    private String licenseImageUrl;
    private String birthDate;
    private String firstIssueDate;
    private ApplyStatus applyStatus;
    private LocalDateTime regDate;
    private LocalDateTime applyProcessDate;
    private String rejectReason;
} 