package com.petory.repository.shop;

import com.petory.entity.shop.CartItem;
import com.petory.entity.shop.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCart(Cart cart);
    
    // fetch join을 사용하여 N+1 문제 방지
    @Query("SELECT ci FROM CartItem ci " +
           "JOIN FETCH ci.item " +
           "LEFT JOIN FETCH ci.option " +
           "WHERE ci.cart = :cart")
    List<CartItem> findByCartWithItemAndOption(@Param("cart") Cart cart);

    void deleteByItem_ItemId(Long itemId);

    int countByOption_OptionId(Long optionId);
} 