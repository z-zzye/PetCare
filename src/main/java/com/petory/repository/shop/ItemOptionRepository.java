package com.petory.repository.shop;

import com.petory.entity.shop.ItemOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ItemOptionRepository extends JpaRepository<ItemOption, Long> {
    void deleteByItem_ItemId(Long itemId);
    List<ItemOption> findByItem_ItemId(Long itemId);
    List<ItemOption> findByItem_ItemIdAndIsActiveTrue(Long itemId);

    @Modifying
    @Transactional
    @Query("UPDATE ItemOption o SET o.optionStock = o.optionStock - :quantity WHERE o.optionId = :optionId AND o.optionStock >= :quantity")
    int decreaseStock(Long optionId, int quantity);
}
