package com.petory.repository.shop;

import com.petory.entity.shop.ItemOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemOptionRepository extends JpaRepository<ItemOption, Long> {
    void deleteByItem_ItemId(Long itemId);
    List<ItemOption> findByItem_ItemId(Long itemId);
    List<ItemOption> findByItem_ItemIdAndIsActiveTrue(Long itemId);
}
