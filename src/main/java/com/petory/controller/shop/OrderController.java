package com.petory.controller.shop;

import com.petory.service.shop.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // 주문 생성 예시
    @PostMapping
    public ResponseEntity<String> createOrder(/* @RequestBody OrderDto orderDto 등 */) {
        // 주문 생성 로직 구현 예정
        return ResponseEntity.ok("주문이 생성되었습니다.");
    }

    // 주문 내역 조회 예시
    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<?>> getOrdersByMember(@PathVariable Long memberId) {
        // 주문 내역 조회 로직 구현 예정
        return ResponseEntity.ok(List.of());
    }

    // 주문 관련 엔드포인트 추가 예정
} 