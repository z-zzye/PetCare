package com.petory.config;

import com.petory.entity.shop.ItemCategory;
import com.petory.repository.shop.ItemCategoryRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ItemCategoryInitializer {

  private final ItemCategoryRepository itemCategoryRepository;

  @PostConstruct
  public void initCategories() {
    if (itemCategoryRepository.count() == 0) { //테이블의 전체 행 개수가 0이면 초기값 넣기
      // === 대분류 ===
      ItemCategory dog = itemCategoryRepository.save(new ItemCategory(null, null, "강아지"));
      ItemCategory cat = itemCategoryRepository.save(new ItemCategory(null, null, "고양이"));
      ItemCategory etc = itemCategoryRepository.save(new ItemCategory(null, null, "기타"));

      // === 소분류 (강아지)
      itemCategoryRepository.save(new ItemCategory(null, dog.getCategoryId(), "사료"));
      itemCategoryRepository.save(new ItemCategory(null, dog.getCategoryId(), "간식"));
      itemCategoryRepository.save(new ItemCategory(null, dog.getCategoryId(), "영양제"));
      itemCategoryRepository.save(new ItemCategory(null, dog.getCategoryId(), "용품"));
      itemCategoryRepository.save(new ItemCategory(null, dog.getCategoryId(), "장난감"));

      // === 소분류 (고양이)
      itemCategoryRepository.save(new ItemCategory(null, cat.getCategoryId(), "사료"));
      itemCategoryRepository.save(new ItemCategory(null, cat.getCategoryId(), "간식"));
      itemCategoryRepository.save(new ItemCategory(null, cat.getCategoryId(), "영양제"));
      itemCategoryRepository.save(new ItemCategory(null, cat.getCategoryId(), "용품"));
      itemCategoryRepository.save(new ItemCategory(null, cat.getCategoryId(), "장난감"));

      // 기타(앵무새)에는 '기타' 소분류만 추가
      itemCategoryRepository.save(new ItemCategory(null, etc.getCategoryId(), "기타"));
    }
  }
}
