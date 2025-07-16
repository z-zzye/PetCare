package com.petory.entity.shop;

import com.petory.entity.shop.CartItem;
import com.petory.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cart")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cartId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", unique = true)
    private Member member;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> cartItems = new ArrayList<>();

    // 생성/수정일자 등 필요시 BaseEntity 상속 가능
    // @EntityListeners(AuditingEntityListener.class)
    // private LocalDateTime createdDate;
    // private LocalDateTime modifiedDate;

    // 생성자
    public Cart(Member member) {
        this.member = member;
    }

    // CartItem 추가 메서드
    public void addCartItem(CartItem cartItem) {
        cartItems.add(cartItem);
        cartItem.setCart(this);
    }

    // CartItem 전체 삭제 등 필요시 메서드 추가
}
