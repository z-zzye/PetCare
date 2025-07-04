package com.petory.repository.shop;

import com.petory.dto.shop.ItemListDto;
import com.petory.entity.shop.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {

    // 전체 상품 목록
    @Query("""
    SELECT new com.petory.dto.shop.ItemListDto(
      i.itemId, i.itemName, i.itemPrice,
      (SELECT img.itemImageUrl FROM ItemImage img WHERE img.item = i AND img.isRepresentative = true)
    )
    FROM Item i
    """)
    List<ItemListDto> findAllItemList();

    // 전체 상품 목록 (검색)
    @Query("""
    SELECT new com.petory.dto.shop.ItemListDto(
      i.itemId, i.itemName, i.itemPrice,
      (SELECT img.itemImageUrl FROM ItemImage img WHERE img.item = i AND img.isRepresentative = true)
    )
    FROM Item i
    WHERE LOWER(i.itemName) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    List<ItemListDto> findAllItemListBySearch(@Param("search") String search);

    // 대분류(메인 카테고리)로 상품 목록 - 해당 대분류의 소분류들에 속한 상품들만 조회
    @Query("""
    SELECT new com.petory.dto.shop.ItemListDto(
      i.itemId, i.itemName, i.itemPrice,
      (SELECT img.itemImageUrl FROM ItemImage img WHERE img.item = i AND img.isRepresentative = true)
    )
    FROM Item i
    WHERE i.category.parentOption = :mainCategoryId
    """)
    List<ItemListDto> findByMainCategory(@Param("mainCategoryId") Long mainCategoryId);

    // 대분류(메인 카테고리) + 검색
    @Query("""
    SELECT new com.petory.dto.shop.ItemListDto(
      i.itemId, i.itemName, i.itemPrice,
      (SELECT img.itemImageUrl FROM ItemImage img WHERE img.item = i AND img.isRepresentative = true)
    )
    FROM Item i
    WHERE i.category.parentOption = :mainCategoryId
      AND LOWER(i.itemName) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    List<ItemListDto> findByMainCategoryAndSearch(@Param("mainCategoryId") Long mainCategoryId, @Param("search") String search);

    // 소분류(서브 카테고리)로 상품 목록
    @Query("""
    SELECT new com.petory.dto.shop.ItemListDto(
      i.itemId, i.itemName, i.itemPrice,
      (SELECT img.itemImageUrl FROM ItemImage img WHERE img.item = i AND img.isRepresentative = true)
    )
    FROM Item i
    WHERE i.category.categoryId = :subCategoryId
    """)
    List<ItemListDto> findBySubCategory(@Param("subCategoryId") Long subCategoryId);

    // 소분류(서브 카테고리) + 검색
    @Query("""
    SELECT new com.petory.dto.shop.ItemListDto(
      i.itemId, i.itemName, i.itemPrice,
      (SELECT img.itemImageUrl FROM ItemImage img WHERE img.item = i AND img.isRepresentative = true)
    )
    FROM Item i
    WHERE i.category.categoryId = :subCategoryId
      AND LOWER(i.itemName) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    List<ItemListDto> findBySubCategoryAndSearch(@Param("subCategoryId") Long subCategoryId, @Param("search") String search);

    // 상품 상세 정보 조회
    @Query("""
    SELECT i.itemId as itemId,
           i.itemName as itemName,
           i.itemPrice as itemPrice,
           i.itemDescription as itemDescription,
           c.optionValue as categoryName,
           i.itemStatus as itemStatus,
           c.categoryId as categoryId
    FROM Item i
    JOIN i.category c
    WHERE i.itemId = :itemId
    """)
    Object findItemDetailRawById(@Param("itemId") Long itemId);

    // 상품 이미지 URL과 대표 이미지 여부를 함께 반환
    @Query("""
    SELECT new com.petory.dto.shop.ItemImageDto(img.itemImageUrl, img.isRepresentative)
    FROM ItemImage img
    WHERE img.item.itemId = :itemId
    """)
    List<com.petory.dto.shop.ItemImageDto> findImageDtosByItemId(@Param("itemId") Long itemId);

    // 상품 옵션 목록
    @Query("""
    SELECT new com.petory.dto.shop.ItemOptionDto(o.optionId, o.optionName, o.optionAddPrice, o.optionStock, o.isActive)
    FROM ItemOption o
    WHERE o.item.itemId = :itemId
    """)
    List<com.petory.dto.shop.ItemOptionDto> findOptionsByItemId(@Param("itemId") Long itemId);

    // 특정 상품의 대표 이미지 URL 조회
    @Query("SELECT img.itemImageUrl FROM ItemImage img WHERE img.item.itemId = :itemId AND img.isRepresentative = true")
    String findRepresentativeImageUrlByItemId(@Param("itemId") Long itemId);
}
