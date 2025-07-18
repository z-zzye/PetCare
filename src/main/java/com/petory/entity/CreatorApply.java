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
@Table(name = "creatorapply")
public class CreatorApply extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "apply_id")
    private Long applyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "member_name", nullable = false)
    private String memberName;

    @Column(name = "maincontents", nullable = false, columnDefinition = "TEXT")
    private String maincontents;

    @Column(name = "producingex", nullable = false, columnDefinition = "TEXT")
    private String producingex;

    @Column(name = "creator_insta")
    private String creatorInsta;

    @Column(name = "creator_youtube")
    private String creatorYoutube;

    @Column(name = "creator_tiktok")
    private String creatorTiktok;

    @Column(name = "creator_blog")
    private String creatorBlog;

    @Enumerated(EnumType.STRING)
    @Column(name = "apply_status", nullable = false)
    private ApplyStatus applyStatus = ApplyStatus.PENDING;

    @Column(name = "apply_process_date")
    private java.time.LocalDateTime applyProcessDate;

    @Column(name = "reject_reason")
    private String rejectReason;

    public static CreatorApply createCreatorApply(Member member, String memberName, 
                                                String maincontents, String producingex,
                                                String insta, String youtube, String tiktok, String blog) {
        return CreatorApply.builder()
                .member(member)
                .memberName(memberName)
                .maincontents(maincontents)
                .producingex(producingex)
                .creatorInsta(insta)
                .creatorYoutube(youtube)
                .creatorTiktok(tiktok)
                .creatorBlog(blog)
                .applyStatus(ApplyStatus.PENDING)
                .build();
    }
} 