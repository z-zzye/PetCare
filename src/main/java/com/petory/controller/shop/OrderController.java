package com.petory.controller.shop;

import com.petory.entity.shop.Order;
import com.petory.service.shop.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.petory.dto.shop.OrderRequestDto;
import com.petory.dto.shop.OrderDetailDto;
import com.petory.dto.shop.OrderListResponseDto;
import com.petory.dto.shop.OrderListDto;
import com.petory.config.JwtTokenProvider;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

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

    // 주문 상세 조회 (JWT 토큰에서 memberId 추출)
    @GetMapping("/{merchantUid}")
    public ResponseEntity<OrderDetailDto> getOrderDetail(
            @PathVariable String merchantUid,
            @RequestHeader("Authorization") String authHeader) {
        // JWT 토큰에서 이메일 추출
        String token = authHeader.substring(7); // "Bearer " 제거
        String email = jwtTokenProvider.getEmail(token);
        Long memberId = orderService.getMemberIdByEmail(email); // 서비스에 구현 필요
        // 로그 추가
        System.out.println("[OrderDetail] merchantUid: " + merchantUid);
        System.out.println("[OrderDetail] email: " + email);
        System.out.println("[OrderDetail] memberId: " + memberId);
        OrderDetailDto dto = orderService.getOrderDetail(merchantUid, memberId);
        return ResponseEntity.ok(dto);
    }

    // 결제검증 엔드포인트
    @PostMapping("/verify-and-create-order")
    public ResponseEntity<?> verifyAndCreateOrder(@RequestBody OrderRequestDto dto, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getEmail(token);
        Long memberId = orderService.getMemberIdByEmail(email);
        orderService.verifyAndCreateOrder(dto, memberId);
        return ResponseEntity.ok().build();
    }

    // 주문 내역 조회 (JWT 토큰에서 memberId 추출)
    @GetMapping("/my-orders")
    public ResponseEntity<OrderListResponseDto> getMyOrders(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getEmail(token);
        Long memberId = orderService.getMemberIdByEmail(email);
        OrderListResponseDto response = orderService.getOrderListResponseByMemberId(memberId);
        return ResponseEntity.ok(response);
    }

    // 주문을 배송완료로 변경 (관리자용, 프론트에서만 노출)
    @PostMapping("/{merchantUid}/set-delivered")
    public ResponseEntity<?> setOrderDelivered(@PathVariable String merchantUid) {
        orderService.setOrderDelivered(merchantUid);
        return ResponseEntity.ok().build();
    }

    // 주문을 구매확정(마일리지 적립)으로 변경
    @PostMapping("/{merchantUid}/confirm")
    public ResponseEntity<?> confirmOrder(@PathVariable String merchantUid, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getEmail(token);
        Long memberId = orderService.getMemberIdByEmail(email);
        orderService.confirmOrder(merchantUid, memberId);
        return ResponseEntity.ok().build();
    }

    // 주문 취소(환불) 요청 DTO
    public static class CancelRequestDto { //프론트에서 보낸 JSON 데이터(취소사유) 받기 위한 DTO클래스
        private String reason; //취소 사유를 저장할 필드
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; } //reason필드의 getter/setter (JSON -> 객체 변환 시 사용)
    }

    @PostMapping("/{merchantUid}/cancel") // /orders/{merchantUid}/cancel 경로로 들어오는 POST요청 처리
                                        //URL경로에서 주문번호(merchantUid)추출  //요청 body의 JSON을 CancelRequestDto 객체로 변환
    public ResponseEntity<?> cancelOrder(@PathVariable String merchantUid, @RequestBody CancelRequestDto dto) {
        // 로그 추가
        System.out.println("[cancelOrder] called! merchantUid=" + merchantUid + ", reason=" + dto.getReason()); //주문번호, 취소사유 콘솔에 출력
        // 1. 주문 조회 (merchantUid로)
        Order order = orderService.findByMerchantUid(merchantUid);
        String impUid = order.getImpUid(); // impUid 필드에서 값 추출 - 환불 요청 시 아임포트 API에 필요하기 때문
        System.out.println("[cancelOrder] impUid=" + impUid);

        // 2. 아임포트 환불 요청
        boolean success = orderService.cancelOrderWithRefund(impUid, dto.getReason(), merchantUid);
        System.out.println("[cancelOrder] refund success=" + success);
        if (success) { //환불 성공 여부
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(500).body("환불 실패");
        }
    }

    // 관리자용 전체 주문 목록 조회
    @GetMapping("/admin/all-orders")
    public ResponseEntity<List<OrderListDto>> getAllOrders() {
        List<OrderListDto> orders = orderService.getAllOrdersForAdmin();
        return ResponseEntity.ok(orders);
    }

    // 관리자용 주문 상세 조회
    @GetMapping("/admin/order-detail/{merchantUid}")
    public ResponseEntity<OrderDetailDto> getOrderDetailForAdmin(@PathVariable String merchantUid) {
        // 로그 추가
        System.out.println("[AdminOrderDetail] merchantUid: " + merchantUid);
        OrderDetailDto dto = orderService.getOrderDetailForAdmin(merchantUid);
        return ResponseEntity.ok(dto);
    }
}
