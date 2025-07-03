package com.petory.service.shop;

import com.petory.entity.shop.Cart;
import com.petory.entity.shop.CartItem;
import com.petory.entity.Member;
import com.petory.dto.shop.CartItemDto;
import com.petory.repository.shop.CartRepository;
import com.petory.repository.shop.CartItemRepository;
import com.petory.entity.shop.ItemOption;
import com.petory.dto.shop.ItemOptionDto;
import com.petory.repository.shop.ItemOptionRepository;
import com.petory.repository.shop.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ItemOptionRepository itemOptionRepository;
    private final ItemRepository itemRepository;
    private final ItemService itemService;

    // 1. 회원의 장바구니 조회(없으면 생성)
    public Cart getOrCreateCart(Member member) {
        return cartRepository.findByMember(member)
                .orElseGet(() -> cartRepository.save(new Cart(member)));
    }

    // 2. 장바구니에 상품 추가
    public void addItemToCart(Member member, CartItemDto dto) {
        Cart cart = getOrCreateCart(member);
        
        // 옵션 엔티티 조회 (optionId로)
        final ItemOption option;
        if (dto.getOption() != null && dto.getOption().getOptionId() != null) {
            option = itemOptionRepository.findById(dto.getOption().getOptionId())
                .orElseThrow(() -> new IllegalArgumentException("Option not found: " + dto.getOption().getOptionId()));
        } else {
            option = null;
        }
        
        // 이미 담긴 상품+옵션인지 확인
        CartItem exist = cart.getCartItems().stream()
            .filter(ci -> ci.getItem().getItemId().equals(dto.getItem().getItemId())
                && ((option == null && ci.getOption() == null) || 
                    (option != null && ci.getOption() != null && ci.getOption().getOptionId().equals(option.getOptionId()))))
            .findFirst()
            .orElse(null);
            
        if (exist != null) {
            exist.setQuantity(exist.getQuantity() + dto.getQuantity());
        } else {
            // Item 엔티티 조회
            var item = itemRepository.findById(dto.getItem().getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + dto.getItem().getItemId()));
                
            CartItem newItem = CartItem.builder()
                .cart(cart)
                .item(item)
                .option(option)
                .quantity(dto.getQuantity())
                .build();
            cart.addCartItem(newItem);
        }
        cartRepository.save(cart);
    }

    // 3. 장바구니 상품 수량 변경
    public void updateCartItemQuantity(Long cartItemId, int quantity) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("CartItem not found: " + cartItemId));
        cartItem.setQuantity(quantity);
        // JPA dirty checking으로 자동 반영
    }

    // 4. 장바구니 상품 삭제
    public void removeCartItem(Long cartItemId) {
        cartItemRepository.deleteById(cartItemId);
    }

    // 5. 장바구니 전체 비우기
    public void clearCart(Member member) {
        Cart cart = getOrCreateCart(member);
        cart.getCartItems().clear();
        cartRepository.save(cart);
    }

    // 6. 장바구니 DTO 변환
    public List<CartItemDto> getCartItemDtos(Member member) {
        Cart cart = getOrCreateCart(member);
        List<CartItem> items = cartItemRepository.findByCartWithItemAndOption(cart); // fetch join 사용
        return items.stream()
            .map(ci -> CartItemDto.builder()
                .cartItemId(ci.getCartItemId())
                .item(itemService.toItemDto(ci.getItem())) // ItemService의 toItemDto 메서드 사용
                .quantity(ci.getQuantity())
                .option(ci.getOption() != null ? ItemOptionDto.builder()
                    .optionId(ci.getOption().getOptionId())
                    .optionName(ci.getOption().getOptionName())
                    .optionAddPrice(ci.getOption().getOptionAddPrice())
                    .optionStock(ci.getOption().getOptionStock())
                    .build() : null)
                .build())
            .toList();
    }
} 