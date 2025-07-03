package com.petory.entity.shop;

import com.petory.constant.ItemStatus;
import com.petory.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@AttributeOverrides({
    @AttributeOverride(name = "regDate", column = @Column(name = "item_reg_date")),
    @AttributeOverride(name = "updateDate", column = @Column(name = "item_update_date"))
})
public class Item extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long itemId; // 상품식별번호

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id", nullable = false) //카테고리 식별번호
  private ItemCategory category;

  @Column(nullable = false)
  private String itemName; // 상품이름

  @Lob
  private String itemDescription; // 상품상세설명

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ItemStatus itemStatus; // 상품판매상태 (ENUM)

  @Column(nullable = false)
  private Integer itemPrice; // 상품가격

  @Column(nullable = false)
  private Boolean isActive = true; // 상품 활성/비활성(soft delete)

  @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ItemOption> itemOptions = new ArrayList<>();

  @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ItemImage> itemImages = new ArrayList<>();
}
