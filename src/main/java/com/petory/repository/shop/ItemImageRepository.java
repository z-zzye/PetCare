package com.petory.repository.shop;

import com.petory.entity.shop.ItemImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemImageRepository extends JpaRepository<ItemImage, Long> {
    void deleteByItem_ItemId(Long itemId);
    List<ItemImage> findByItem_ItemId(Long itemId);
}
