package com.petory.service.shop;

import com.petory.dto.shop.OrderItemDto;
import org.springframework.stereotype.Service;
import java.util.List;
import com.petory.entity.shop.CartItem;
import com.petory.repository.shop.ItemRepository;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class OrderService {
    private final ItemRepository itemRepository;

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
    // 추가적인 주문 관련 비즈니스 메서드 작성 예정
} 