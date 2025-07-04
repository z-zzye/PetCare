package com.petory.repository.shop;

import com.petory.entity.shop.Cart;
import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByMember(Member member);
} 