package com.petory.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "board_hashtag")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardHashtag {
    
    @EmbeddedId
    private BoardHashtagId id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    @JoinColumn(name = "post_Id")
    private Board board;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tagId")
    @JoinColumn(name = "tag_Id")
    private Hashtag hashtag;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 