package com.petory.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VetApplyDto {
    
    private String name;
    private String email;
    private String phone;
    private String licenseNumber;
    private String hospitalName;
    private String hospitalAddress;
    private String hospitalPhone;
    private String specialization;
    private Integer experienceYears;
    private String certifications;
} 