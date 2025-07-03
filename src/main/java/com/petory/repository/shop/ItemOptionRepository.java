package com.petory.repository.shop;

import com.petory.entity.shop.ItemOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemOptionRepository extends JpaRepository<ItemOption, Long> {
    void deleteByItem_ItemId(Long itemId);
}
