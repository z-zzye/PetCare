package com.petory.controller.shop;

import com.petory.dto.shop.CartItemDto;
import com.petory.entity.Member;
import com.petory.service.shop.CartService;
import com.petory.config.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    // 장바구니 담기 (CartItemDto는 단일 옵션 구조)
    @PostMapping
    public void addToCart(@RequestBody CartItemDto dto, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) throw new RuntimeException("로그인이 필요합니다.");
        Member member = userDetails.getMember();
        cartService.addItemToCart(member, dto);
    }

    // 장바구니 조회
    @GetMapping
    public List<CartItemDto> getCartItems(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) throw new RuntimeException("로그인이 필요합니다.");
        Member member = userDetails.getMember();
        return cartService.getCartItemDtos(member);
    }

    // 장바구니 상품 삭제
    @DeleteMapping("/{cartItemId}")
    public void removeCartItem(@PathVariable Long cartItemId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) throw new RuntimeException("로그인이 필요합니다.");
        Member member = userDetails.getMember();
        cartService.removeCartItem(cartItemId);
    }

    // 장바구니 상품 수량 변경
    @PatchMapping("/{cartItemId}")
    public void updateCartItemQuantity(@PathVariable Long cartItemId, @RequestParam int quantity, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) throw new RuntimeException("로그인이 필요합니다.");
        Member member = userDetails.getMember();
        cartService.updateCartItemQuantity(cartItemId, quantity);
    }

    // 추후: 장바구니 조회, 삭제, 수량변경 등 추가 가능
} 