package com.petory.service.shop;

import com.petory.dto.shop.OrderItemDto;
import com.petory.dto.shop.OrderListDto;
import com.petory.dto.shop.OrderListResponseDto;
import com.petory.entity.shop.Cart;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;
import com.petory.entity.shop.CartItem;
import com.petory.repository.shop.ItemRepository;
import lombok.RequiredArgsConstructor;
import com.petory.entity.shop.Order;
import com.petory.entity.shop.OrderItem;
import com.petory.entity.shop.Item;
import com.petory.entity.Member;
import com.petory.repository.MemberRepository;
import com.petory.repository.shop.OrderRepository;
import com.petory.service.PaymentService;
import com.petory.repository.shop.CartRepository;
import com.petory.repository.shop.CartItemRepository;
import com.petory.repository.shop.ItemOptionRepository;

@RequiredArgsConstructor
@Service
public class OrderService {
  private final ItemRepository itemRepository;
  private final MemberRepository memberRepository;
  private final OrderRepository orderRepository;
  private final PaymentService paymentService;
  private final CartRepository cartRepository;
  private final CartItemRepository cartItemRepository;
  private final ItemOptionRepository itemOptionRepository;

  // 예시: 장바구니에서 주문 상품 DTO 리스트 생성
  public List<OrderItemDto> getOrderItemDtos(List<CartItem> cartItems) {
    return cartItems.stream()
      .map(cartItem -> {
        Long itemId = cartItem.getItem().getItemId();
        String thumbnailUrl = itemRepository.findRepresentativeImageUrlByItemId(itemId);
        return OrderItemDto.builder()
          .itemId(itemId)
          .itemName(cartItem.getItem().getItemName())
          .thumbnailUrl(thumbnailUrl)
          .optionId(cartItem.getOption().getOptionId())
          .optionName(cartItem.getOption().getOptionName())
          .quantity(cartItem.getQuantity())
          .orderPrice(
            (cartItem.getItem().getItemPrice() +
              (cartItem.getOption().getOptionAddPrice() != null
                ? cartItem.getOption().getOptionAddPrice() : 0)
            ) * cartItem.getQuantity()
          )
          .optionAddPrice(cartItem.getOption().getOptionAddPrice())
          .build();
      })
      .collect(java.util.stream.Collectors.toList());
  }

  // OrderItem 리스트를 OrderItemDto 리스트로 변환 (주문 상세 조회용)
  public List<OrderItemDto> getOrderItemDtosFromOrderItems(List<OrderItem> orderItems) {
    return orderItems.stream()
      .map(orderItem -> OrderItemDto.builder()
        .itemId(orderItem.getItem().getItemId())
        .itemName(orderItem.getItemName())
        .thumbnailUrl(orderItem.getItemImage())
        .optionId(null) // getOption()이 없으므로 null로 처리
        .optionName(orderItem.getOptionName())
        .quantity(orderItem.getCount())
        .orderPrice(orderItem.getOrderPrice())
        .optionAddPrice(orderItem.getOptionAddPrice())
        .build())
      .collect(java.util.stream.Collectors.toList());
  }
  // 추가적인 주문 관련 비즈니스 메서드 작성 예정

  // 주문 상세 정보 조회
  public com.petory.dto.shop.OrderDetailDto getOrderDetail(String merchantUid, Long memberId) {
    // 주문 조회 (주문번호 + 회원ID로)
    Order order = orderRepository.findByMerchantUidAndMemberId(merchantUid, memberId)
      .orElseThrow(() -> new RuntimeException("주문 정보를 찾을 수 없습니다."));

    // 주문 상품 DTO 변환
    List<OrderItemDto> orderItems = getOrderItemDtosFromOrderItems(order.getOrderItems());

    // OrderDetailDto 생성 및 반환
    return com.petory.dto.shop.OrderDetailDto.builder()
      .merchantUid(order.getMerchantUid())
      .orderStatus(order.getOrderStatus().name())
      .orderDate(order.getRegDate())
      .totalPrice(order.getTotalPrice())
      .usedMileage(order.getUsedMileage())
      .deliveryFee(order.getDeliveryFee())
      .paymentMethod(order.getPaymentMethod())
      .orderMemo(order.getOrderMemo())
      .receiverName(order.getReceiverName())
      .receiverPhone(order.getReceiverPhone())
      .address(order.getAddress())
      .deliveryName(order.getDeliveryName().name())
      .orderItems(orderItems)
      .build();
  }

  /**
   * 결제 검증 및 주문/주문상품 생성
   * 1. impUid(아임포트 결제번호)로 결제 성공 및 금액 일치 여부를 검증한다.
   * 2. 검증이 성공하면 Order, OrderItem 엔티티를 생성하여 DB에 저장한다.
   * 3. 검증 실패 시 예외를 발생시킨다.
   * @param dto 프론트엔드에서 전달받은 주문/결제 정보
   */
  @Transactional
  public void verifyAndCreateOrder(com.petory.dto.shop.OrderRequestDto dto, Long memberId) {
    // 1. impUid로 아임포트(PortOne) 결제 검증 (금액, 결제 성공 여부 등)
    boolean isValid = paymentService.verifyPortonePayment(dto.getImpUid(), dto.getTotalPrice());
    if (!isValid) {
      throw new RuntimeException("결제 검증 실패: 결제 정보가 일치하지 않습니다.");
    }

    // 2. Order 엔티티 생성 및 저장
    Member member = memberRepository.findById(memberId)
      .orElseThrow(() -> new RuntimeException("회원 정보가 존재하지 않습니다."));
    Order order = Order.builder()
      .orderStatus(com.petory.constant.OrderStatus.ORDERED) // 주문상태(결제완료)
      .merchantUid(dto.getMerchantUid()) // 주문번호(merchantUid)
      .impUid(dto.getImpUid())//impUid 저장! -> 환불요청(취소요청)시 필요
      .deliveryName(com.petory.constant.DeliveryName.valueOf(dto.getAddressInfo().getDeliveryName()))
      .receiverName(dto.getAddressInfo().getReceiverName())
      .receiverPhone(dto.getAddressInfo().getReceiverPhone())
      .address(dto.getAddressInfo().getAddress() + " " + dto.getAddressInfo().getAddressDetail())
      .paymentMethod("CARD") // 예시: 카드 결제
      .totalPrice(dto.getTotalPrice())
      .usedMileage(dto.getUsedMileage()) // 사용 마일리지 반영
      .deliveryFee(100) // 테스트용: 배송비 100원
      .orderMemo(dto.getOrderMemo() != null ? dto.getOrderMemo() : "")
      .member(member)
      .build();
    // TODO: member, orderItems 등 추가 세팅 필요

    // 3. OrderItem 엔티티 생성 및 저장 (주문 상품 개수만큼 반복)
    for (OrderItemDto itemDto : dto.getOrderItems()) {
      // Item 엔티티 조회
      Item item = itemRepository.findById(itemDto.getItemId())
        .orElseThrow(() -> new RuntimeException("상품 정보를 찾을 수 없습니다. (상품ID: " + itemDto.getItemId() + ")"));

      System.out.println("[OrderService] Item 조회 성공: " + item.getItemId() + " - " + item.getItemName());

      OrderItem orderItem = OrderItem.builder()
        .order(order)
        .item(item)  // Item 엔티티 설정
        .itemName(itemDto.getItemName())
        .itemImage(itemDto.getThumbnailUrl())
        .optionName(itemDto.getOptionName())
        .optionAddPrice(itemDto.getOptionAddPrice())
        .orderPrice(itemDto.getOrderPrice())
        .count(itemDto.getQuantity())
        .build();

      System.out.println("[OrderService] OrderItem 생성: item=" + orderItem.getItem() + ", itemId=" + (orderItem.getItem() != null ? orderItem.getItem().getItemId() : "NULL"));

      order.getOrderItems().add(orderItem); // 양방향 연관관계 완성
    }
    // 주문 및 주문상품 저장 (cascade = ALL이므로 order만 저장하면 됨)
    orderRepository.save(order);

    // === 결제된 상품을 장바구니에서 삭제 ===
    // 회원의 장바구니 조회
    Cart cart = cartRepository.findByMember(member)
      .orElse(null);
    if (cart != null) {
      for (OrderItemDto itemDto : dto.getOrderItems()) {
        cartItemRepository.deleteByCartAndItem_ItemIdAndOption_OptionId(
          cart, itemDto.getItemId(), itemDto.getOptionId()
        );
      }
    }

    // === 옵션 재고 차감 (동시성 문제 예방) ===
    for (OrderItemDto itemDto : dto.getOrderItems()) {
      // 옵션 재고를 주문 수량만큼 차감 (동시성 안전)
      int updated = itemOptionRepository.decreaseStock(itemDto.getOptionId(), itemDto.getQuantity());
      if (updated == 0) {
        throw new RuntimeException("재고가 부족합니다. (옵션ID: " + itemDto.getOptionId() + ")");
      }
    }

    // === 마일리지 차감 ===
    if (dto.getUsedMileage() > 0) {
      int currentMileage = member.getMember_Mileage();
      int newMileage = currentMileage - dto.getUsedMileage();
      if (newMileage < 0) {
        throw new RuntimeException("마일리지가 부족합니다.");
      }
      member.setMember_Mileage(newMileage);
      memberRepository.save(member);
    }
  }

  // email로 memberId 조회
  public Long getMemberIdByEmail(String email) {
    Member member = memberRepository.findByMember_Email(email)
      .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));
    return member.getMemberId();
  }

  // 회원의 전체 보유 마일리지와 주문 내역 리스트 반환 (MyOrders용)
  public OrderListResponseDto getOrderListResponseByMemberId(Long memberId) {
    // 1. 회원 정보 조회
    Member member = memberRepository.findById(memberId)
      .orElseThrow(() -> new RuntimeException("회원 정보가 존재하지 않습니다."));
    int memberMileage = member.getMember_Mileage();

    // 2. 주문 리스트 조회
    List<Order> orders = orderRepository.findByMemberId(memberId);

    // 3. 주문 리스트를 OrderListDto로 변환
    List<OrderListDto> orderListDtos = orders.stream().map(order -> {
      System.out.println("[OrderService] 주문 조회: " + order.getMerchantUid() + ", OrderItems 개수: " + order.getOrderItems().size());

      List<OrderItemDto> orderItemDtos = order.getOrderItems().stream().map(orderItem -> {
        System.out.println("[OrderService] OrderItem 조회: item=" + orderItem.getItem() + ", itemId=" + (orderItem.getItem() != null ? orderItem.getItem().getItemId() : "NULL"));

        return OrderItemDto.builder()
          .itemId(orderItem.getItem().getItemId())
          .itemName(orderItem.getItemName())
          .thumbnailUrl(orderItem.getItemImage())
          .optionId(null) // 필요시 옵션 ID
          .optionName(orderItem.getOptionName())
          .quantity(orderItem.getCount())
          .orderPrice(orderItem.getOrderPrice())
          .optionAddPrice(orderItem.getOptionAddPrice())
          .build();
      }).collect(java.util.stream.Collectors.toList());

      return OrderListDto.builder()
        .merchantUid(order.getMerchantUid())
        .orderStatus(order.getOrderStatus().name())
        .orderDate(order.getRegDate())
        .totalPrice(order.getTotalPrice())
        .deliveryFee(order.getDeliveryFee())
        .usedMileage(order.getUsedMileage())
        .orderItems(orderItemDtos)
        .build();
    }).collect(java.util.stream.Collectors.toList());

    // 4. OrderListResponseDto로 반환
    return OrderListResponseDto.builder()
      .memberMileage(memberMileage)
      .orders(orderListDtos)
      .build();
  }

  // 주문을 배송완료로 변경 (관리자용)
  @Transactional
  public void setOrderDelivered(String merchantUid) {
    Order order = orderRepository.findByMerchantUid(merchantUid)
      .orElseThrow(() -> new RuntimeException("주문 정보를 찾을 수 없습니다."));
    order.setOrderStatus(com.petory.constant.OrderStatus.DELIVERED);
    orderRepository.save(order);
  }

  // 주문을 구매확정(마일리지 적립)으로 변경
  @Transactional
  public void confirmOrder(String merchantUid, Long memberId) {
    Order order = orderRepository.findByMerchantUid(merchantUid)
      .orElseThrow(() -> new RuntimeException("주문 정보를 찾을 수 없습니다."));
    if (!order.getMember().getMember_Id().equals(memberId)) {
      throw new RuntimeException("주문자 정보가 일치하지 않습니다.");
    }
    // 이미 구매확정된 주문은 중복 적립 방지
    if (order.getOrderStatus() == com.petory.constant.OrderStatus.CONFIRMED) {
      return;
    }
    // 주문 상태 변경
    order.setOrderStatus(com.petory.constant.OrderStatus.CONFIRMED);
    // 마일리지 적립 (결제금액의 10%)
    Member member = order.getMember();
    int mileageToAdd = (order.getTotalPrice() >= 100) ? (int) Math.floor(order.getTotalPrice() * 0.1) : 0;
    if (mileageToAdd > 0) {
      member.setMember_Mileage(member.getMember_Mileage() + mileageToAdd);
      memberRepository.save(member);
    }
    orderRepository.save(order);
  }

  // merchantUid로 주문 조회
  public Order findByMerchantUid(String merchantUid) {
    return orderRepository.findByMerchantUid(merchantUid)
      .orElseThrow(() -> new RuntimeException("주문 정보를 찾을 수 없습니다."));
  }

  // 환불(취소) 처리 및 주문 상태 변경
  @Transactional
  public boolean cancelOrderWithRefund(String impUid, String reason, String merchantUid) {
    boolean refundSuccess = paymentService.cancelPortonePayment(impUid, reason);
    if (refundSuccess) {
      Order order = orderRepository.findByImpUid(impUid)
        .orElseThrow(() -> new RuntimeException("주문 정보를 찾을 수 없습니다. (impUid: " + impUid + ")"));
      order.setOrderStatus(com.petory.constant.OrderStatus.CANCEL);
      orderRepository.save(order);
      return true;
    }
    return false;
  }

  // 관리자용 전체 주문 목록 조회
  public List<OrderListDto> getAllOrdersForAdmin() {
    List<Order> orders = orderRepository.findAll();

    return orders.stream().map(order -> {
      List<OrderItemDto> orderItemDtos = order.getOrderItems().stream().map(orderItem -> {
        return OrderItemDto.builder()
          .itemId(orderItem.getItem().getItemId())
          .itemName(orderItem.getItemName())
          .thumbnailUrl(orderItem.getItemImage())
          .optionId(null)
          .optionName(orderItem.getOptionName())
          .quantity(orderItem.getCount())
          .orderPrice(orderItem.getOrderPrice())
          .optionAddPrice(orderItem.getOptionAddPrice())
          .build();
      }).collect(java.util.stream.Collectors.toList());

      return OrderListDto.builder()
        .merchantUid(order.getMerchantUid())
        .orderStatus(order.getOrderStatus().name())
        .orderDate(order.getRegDate())
        .totalPrice(order.getTotalPrice())
        .deliveryFee(order.getDeliveryFee())
        .usedMileage(order.getUsedMileage())
        .orderItems(orderItemDtos)
        .build();
    }).collect(java.util.stream.Collectors.toList());
  }

  // 관리자용 주문 상세 조회 (memberId 검증 없이)
  public com.petory.dto.shop.OrderDetailDto getOrderDetailForAdmin(String merchantUid) {
    // 주문 조회 (merchantUid만으로)
    Order order = orderRepository.findByMerchantUid(merchantUid)
      .orElseThrow(() -> new RuntimeException("주문 정보를 찾을 수 없습니다."));

    // 주문 상품 DTO 변환
    List<OrderItemDto> orderItems = getOrderItemDtosFromOrderItems(order.getOrderItems());

    // OrderDetailDto 생성 및 반환
    return com.petory.dto.shop.OrderDetailDto.builder()
      .merchantUid(order.getMerchantUid())
      .orderStatus(order.getOrderStatus().name())
      .orderDate(order.getRegDate())
      .totalPrice(order.getTotalPrice())
      .usedMileage(order.getUsedMileage())
      .deliveryFee(order.getDeliveryFee())
      .paymentMethod(order.getPaymentMethod())
      .memberEmail(order.getMember().getMember_Email()) // 회원 이메일 추가
      .orderMemo(order.getOrderMemo())
      .receiverName(order.getReceiverName())
      .receiverPhone(order.getReceiverPhone())
      .address(order.getAddress())
      .deliveryName(order.getDeliveryName().name())
      .orderItems(orderItems)
      .build();
  }
}
