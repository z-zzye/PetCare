package com.petory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@EntityListeners(value = {AuditingEntityListener.class}) // Auditing 기능을 포함시킵니다.
@MappedSuperclass // 자식 클래스에게 매핑 정보만 상속하도록 합니다.
@Getter
public abstract class BaseTimeEntity {

  @CreatedDate // 엔티티가 생성될 때 시간을 자동으로 저장합니다.
  @Column(updatable = false) // 생성 시간은 수정되지 않도록 합니다.
  private LocalDateTime regDate; // 등록일

  @LastModifiedDate // 엔티티가 수정될 때 시간을 자동으로 저장합니다.
  private LocalDateTime updateDate; // 수정일
}
