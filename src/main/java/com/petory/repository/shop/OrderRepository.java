package com.petory.repository.shop;

import com.petory.entity.shop.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
    // 필요시 커스텀 메서드 추가
} 