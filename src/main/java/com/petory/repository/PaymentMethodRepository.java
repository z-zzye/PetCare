package com.petory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.petory.entity.Member;
import com.petory.entity.PaymentMethod;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
  long countByMember(Member member);
  List<PaymentMethod> findByMember(Member member);
}
