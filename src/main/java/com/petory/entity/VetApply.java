package com.petory.entity;

import com.petory.constant.ApplyStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "vetapply")
public class VetApply extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "apply_id")
    private Long applyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "member_name", nullable = false)
    private String memberName;

    @Column(name = "license_number", nullable = false)
    private String licenseNumber;

    @Column(name = "hospital_name", nullable = false)
    private String hospitalName;

    @Column(name = "hospital_address")
    private String hospitalAddress;

    @Column(name = "hospital_phone")
    private String hospitalPhone;

    @Column(name = "specialization", nullable = false, columnDefinition = "TEXT")
    private String specialization;

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears;

    @Column(name = "certifications", columnDefinition = "TEXT")
    private String certifications;

    @Enumerated(EnumType.STRING)
    @Column(name = "apply_status", nullable = false)
    private ApplyStatus applyStatus = ApplyStatus.PENDING;

    @Column(name = "apply_process_date")
    private java.time.LocalDateTime applyProcessDate;

    @Column(name = "reject_reason")
    private String rejectReason;

    @Column(name = "reg_date", updatable = false)
    private java.time.LocalDateTime regDate;

    public static VetApply createVetApply(Member member, String memberName, 
                                         String licenseNumber, String hospitalName,
                                         String hospitalAddress, String hospitalPhone,
                                         String specialization, Integer experienceYears,
                                         String certifications) {
        return VetApply.builder()
                .member(member)
                .memberName(memberName)
                .licenseNumber(licenseNumber)
                .hospitalName(hospitalName)
                .hospitalAddress(hospitalAddress)
                .hospitalPhone(hospitalPhone)
                .specialization(specialization)
                .experienceYears(experienceYears)
                .certifications(certifications)
                .applyStatus(ApplyStatus.PENDING)
                .regDate(java.time.LocalDateTime.now())
                .build();
    }

    /**
     * 신청 상태 업데이트
     */
    public void updateStatus(ApplyStatus status) {
        this.applyStatus = status;
        if (status == ApplyStatus.APPROVED || status == ApplyStatus.REJECTED) {
            this.applyProcessDate = java.time.LocalDateTime.now();
        }
    }
} 