package com.petory.repository;

import com.petory.entity.Member;
import com.petory.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
  long countByMember(Member member);
}
