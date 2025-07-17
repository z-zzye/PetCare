package com.petory.service.shop;

import com.petory.dto.shop.ItemFormDto;
import com.petory.dto.shop.ItemImageDto;
import com.petory.dto.shop.ItemOptionDto;
import com.petory.dto.shop.ItemListDto;
import com.petory.dto.shop.ItemDetailDto;
import com.petory.dto.shop.ItemDto;
import com.petory.entity.shop.Item;
import com.petory.entity.shop.ItemCategory;
import com.petory.entity.shop.ItemImage;
import com.petory.entity.shop.ItemOption;
import com.petory.repository.shop.ItemCategoryRepository;
import com.petory.repository.shop.ItemImageRepository;
import com.petory.repository.shop.ItemOptionRepository;
import com.petory.repository.shop.ItemRepository;
import com.petory.repository.shop.CartItemRepository;
import com.petory.service.ImageService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class ItemService {

  private final ItemRepository itemRepository;
  private final ItemCategoryRepository itemCategoryRepository;
  private final ItemOptionRepository itemOptionRepository;
  private final ItemImageRepository itemImageRepository;
  private final CartItemRepository cartItemRepository;
  private final ImageService imageService;

  /*
  상품등록
   */
  @Transactional
  public Long saveItem(ItemFormDto formDto, List<org.springframework.web.multipart.MultipartFile> images, List<String> imagesIsRep) throws Exception {
    // 1. 카테고리 조회
    ItemCategory category = itemCategoryRepository.findById(formDto.getCategoryId())
      .orElseThrow(() -> new IllegalArgumentException("해당 카테고리가 존재하지 않습니다."));

    // 2. Item 생성 및 저장
    Item item = new Item();
    item.setItemName(formDto.getItemName());
    item.setItemDescription(formDto.getItemDescription());
    item.setItemPrice(formDto.getItemPrice());
    item.setItemStatus(formDto.getItemStatus());
    item.setCategory(category);
    itemRepository.save(item);

    // 3. 옵션 저장
    for (ItemOptionDto optionDto : formDto.getOptions()) {
      ItemOption option = ItemOption.builder()
        .optionName(optionDto.getOptionName())
        .optionAddPrice(optionDto.getOptionAddPrice())
        .optionStock(optionDto.getOptionStock())
        .item(item)
        .isActive(true)
        .build();
      itemOptionRepository.save(option);
    }

    // 4. 이미지 저장
    if (images != null) {
      for (int i = 0; i < images.size(); i++) {
        org.springframework.web.multipart.MultipartFile file = images.get(i);
        boolean isRep = imagesIsRep != null && imagesIsRep.size() > i && "true".equals(imagesIsRep.get(i));
        String imageUrl = imageService.uploadFile(file, "item");
        ItemImage image = ItemImage.builder()
          .item(item)
          .itemImageUrl(imageUrl)
          .isRepresentative(isRep)
          .build();
        itemImageRepository.save(image);
      }
    }
    return item.getItemId();
  }

  // 상품 목록 조회 (카테고리 조건별 + 검색)
  public List<ItemListDto> getItemList(Long mainCategoryId, Long subCategoryId, String search) {
    boolean hasSearch = search != null && !search.trim().isEmpty();
    if (subCategoryId != null) {
      if (hasSearch) {
        return itemRepository.findBySubCategoryAndSearch(subCategoryId, search);
      } else {
        return itemRepository.findBySubCategory(subCategoryId);
      }
    } else if (mainCategoryId != null) {
      if (hasSearch) {
        return itemRepository.findByMainCategoryAndSearch(mainCategoryId, search);
      } else {
        return itemRepository.findByMainCategory(mainCategoryId);
      }
    } else {
      if (hasSearch) {
        return itemRepository.findAllItemListBySearch(search);
      } else {
        return itemRepository.findAllItemList();
      }
    }
  }

  // 페이지네이션 상품 목록 조회
  public Page<ItemListDto> getItemListPaged(int page, int size, Long mainCategoryId, Long subCategoryId, String search) {
    Pageable pageable = PageRequest.of(page, size);
    return itemRepository.findPagedItems(mainCategoryId, subCategoryId, search, pageable);
  }

  // 상품 상세 정보 조회
  public ItemDetailDto getItemDetail(Long itemId) {
    // 1. 기본 정보 (item, category, status 등)
    Object[] raw = (Object[]) itemRepository.findItemDetailRawById(itemId);
    if (raw == null) throw new IllegalArgumentException("해당 상품이 존재하지 않습니다.");

    // 2. 이미지 목록 (url + isRepresentative)
    List<ItemImageDto> images = itemRepository.findImageDtosByItemId(itemId);

    // 3. 옵션 목록 (isActive=true만)
    List<ItemOptionDto> options = itemOptionRepository.findByItem_ItemIdAndIsActiveTrue(itemId)
      .stream()
      .map(opt -> new ItemOptionDto(
        opt.getOptionId(),
        opt.getOptionName(),
        opt.getOptionAddPrice(),
        opt.getOptionStock(),
        opt.getIsActive()
      ))
      .toList();

    // 4. 카테고리 경로 생성 (raw[6]이 categoryId)
    Long categoryId = (Long) raw[6];
    List<String> categoryPath = getCategoryPath(categoryId);

    // 5. DTO 조립
    return ItemDetailDto.builder()
      .itemId((Long) raw[0])
      .itemName((String) raw[1]) //상품명
      .itemPrice((Integer) raw[2]) //가격
      .itemDescription((String) raw[3]) //상세설명
      .categoryName((String) raw[4]) //카테고리명
      .categoryPath(categoryPath) // 카테고리 경로 추가
      .itemStatus(raw[5].toString()) //판매상태
      .images(images) // images 세팅
      .options(options) //상품옵션
      .build();
  }

  /**
   * 카테고리 ID로부터 대분류~소분류 전체 경로를 반환
   */
  private List<String> getCategoryPath(Long categoryId) {
    List<String> path = new ArrayList<>();
    Optional<ItemCategory> categoryOpt = itemCategoryRepository.findById(categoryId);
    while (categoryOpt.isPresent()) {
      ItemCategory category = categoryOpt.get();
      path.add(category.getOptionValue());
      if (category.getParentOption() == null) break;
      categoryOpt = itemCategoryRepository.findById(category.getParentOption());
    }
    Collections.reverse(path);
    return path;
  }

  // Item -> ItemDto 변환 (대표이미지 포함)
  public ItemDto toItemDto(Item item) {
    // ItemRepository와 동일한 방식으로 대표 이미지 URL 조회
    String thumbnailUrl = itemRepository.findRepresentativeImageUrlByItemId(item.getItemId());

    return ItemDto.builder()
        .itemId(item.getItemId())
        .itemName(item.getItemName())
        .itemPrice(item.getItemPrice())
        .thumbnailUrl(thumbnailUrl)
        .build();
  }

  // Item 삭제
  @Transactional
  public void deleteItem(Long itemId) {
    // 1. 해당 상품이 담긴 모든 CartItem 삭제
    cartItemRepository.deleteByItem_ItemId(itemId);
    // 2. 상품 삭제
    itemRepository.deleteById(itemId);
  }

  // 상품 상세 정보 조회 (수정 폼용)
  public ItemFormDto getItemFormDto(Long itemId) {
    Item item = itemRepository.findById(itemId)
      .orElseThrow(() -> new IllegalArgumentException("해당 상품이 존재하지 않습니다."));

    // 옵션 변환
    List<ItemOptionDto> options = itemRepository.findOptionsByItemId(itemId);

    // 이미지 변환 (url + isRepresentative)
    List<ItemImageDto> images = itemRepository.findImageDtosByItemId(itemId);

    return ItemFormDto.builder()
      .categoryId(item.getCategory().getCategoryId())
      .itemName(item.getItemName())
      .itemDescription(item.getItemDescription())
      .itemPrice(item.getItemPrice())
      .itemStatus(item.getItemStatus())
      .options(options)
      .images(images)
      .build();
  }

  // 상품 수정
  @Transactional
  public void updateItem(Long itemId, ItemFormDto formDto, List<org.springframework.web.multipart.MultipartFile> images, List<String> imagesIsRep, List<String> remainImageUrls) throws Exception {
    System.out.println("=== updateItem 호출됨 ===");
    System.out.println("remainImageUrls(초기): " + remainImageUrls);
    // 1. 기존 상품 조회
    Item item = itemRepository.findById(itemId)
        .orElseThrow(() -> new IllegalArgumentException("해당 상품이 존재하지 않습니다."));

    // 2. 상품 정보 수정
    item.setItemName(formDto.getItemName());
    item.setItemDescription(formDto.getItemDescription());
    item.setItemPrice(formDto.getItemPrice());
    item.setItemStatus(formDto.getItemStatus());

    // 3. 카테고리 변경
    ItemCategory category = itemCategoryRepository.findById(formDto.getCategoryId())
        .orElseThrow(() -> new IllegalArgumentException("해당 카테고리가 존재하지 않습니다."));
    item.setCategory(category);

    // 4. 옵션 변경 감지 및 soft delete/추가/수정
    List<ItemOption> existingOptions = itemOptionRepository.findByItem_ItemId(itemId);
    List<ItemOptionDto> newOptions = formDto.getOptions();

    boolean optionChanged = isOptionChanged(existingOptions, newOptions);

    if (optionChanged) {
      // 1) 기존 옵션 처리
      for (ItemOption option : existingOptions) {
        // 삭제된 옵션만 처리
        boolean stillExists = newOptions.stream()
          .anyMatch(dto -> dto.getOptionId() != null && dto.getOptionId().equals(option.getOptionId()));
        if (!stillExists) {
          // 참조 중이면 soft delete, 아니면 완전 삭제
          if (cartItemRepository.countByOption_OptionId(option.getOptionId()) > 0) {
            option.setIsActive(false);
            itemOptionRepository.save(option);
          } else {
            itemOptionRepository.delete(option);
          }
        } else {
          // 가격/재고 변경만 반영
          ItemOptionDto dto = newOptions.stream()
            .filter(d -> d.getOptionId() != null && d.getOptionId().equals(option.getOptionId()))
            .findFirst().orElse(null);
          if (dto != null) {
            if (!option.getOptionAddPrice().equals(dto.getOptionAddPrice()) || !option.getOptionStock().equals(dto.getOptionStock())) {
              option.setOptionAddPrice(dto.getOptionAddPrice());
              option.setOptionStock(dto.getOptionStock());
              itemOptionRepository.save(option);
            }
          }
        }
      }
      // 2) 새로 추가된 옵션 insert
      for (ItemOptionDto dto : newOptions) {
        if (dto.getOptionId() == null) { // 새 옵션
          ItemOption option = ItemOption.builder()
            .optionName(dto.getOptionName())
            .optionAddPrice(dto.getOptionAddPrice())
            .optionStock(dto.getOptionStock())
            .item(item)
            .isActive(true)
            .build();
          itemOptionRepository.save(option);
        }
      }
    }

    // 5. 이미지 수정 (리팩토링: 대표이미지 변경만 vs 이미지 추가/삭제)
    List<ItemImage> existingImages = itemImageRepository.findByItem_ItemId(itemId);
    System.out.println("기존 이미지 개수: " + existingImages.size());
    System.out.println("images 파라미터: " + (images == null ? "null" : images.size()));
    boolean hasImageChange = false;
    // remainImageUrls와 기존 이미지 URL이 다르거나, 새 이미지가 있으면 변경으로 간주
    List<String> existingUrls = existingImages.stream().map(ItemImage::getItemImageUrl).toList();
    if (remainImageUrls != null) {
        if (images != null && !images.isEmpty()) {
            hasImageChange = true;
        } else if (existingUrls.size() != remainImageUrls.size() || !existingUrls.containsAll(remainImageUrls)) {
            hasImageChange = true;
        }
    }
    try {
      if (!hasImageChange) {
          // 이미지 추가/삭제 없이 대표이미지만 변경
          if (remainImageUrls != null && !remainImageUrls.isEmpty()) {
              String repUrl = remainImageUrls.get(0); // 프론트에서 대표이미지 URL을 첫 번째로 보냄
              for (ItemImage img : existingImages) {
                  if (img.getItemImageUrl().equals(repUrl)) {
                      img.setIsRepresentative(true);
                  } else {
                      img.setIsRepresentative(false);
                  }
                  itemImageRepository.save(img);
              }
          }
      } else {
          // 이미지 추가/삭제가 있는 경우: 삭제/추가 처리 후 대표 지정
          List<ItemImage> remainImages = new ArrayList<>();
          System.out.println("remainImageUrls: " + remainImageUrls);
          for (ItemImage img : existingImages) {
              System.out.println("기존 이미지 itemImageUrl: " + img.getItemImageUrl());
              if (remainImageUrls != null && remainImageUrls.contains(img.getItemImageUrl())) {
                  System.out.println("==> 유지됨");
                  remainImages.add(img);
              } else {
                  System.out.println("==> 삭제됨");
                  itemImageRepository.delete(img);
              }
          }
          // 대표이미지 지정
          if (!remainImages.isEmpty()) {
              String repUrl = remainImageUrls.get(0);
              for (ItemImage img : remainImages) {
                  if (img.getItemImageUrl().equals(repUrl)) {
                      img.setIsRepresentative(true);
                  } else {
                      img.setIsRepresentative(false);
                  }
                  itemImageRepository.save(img);
              }
          }
          // 새 이미지 추가
          if (images != null) {
              for (int i = 0; i < images.size(); i++) {
                  org.springframework.web.multipart.MultipartFile file = images.get(i);
                  boolean isRep = imagesIsRep != null && imagesIsRep.size() > i && "true".equals(imagesIsRep.get(i));
                  String imageUrl = imageService.uploadFile(file, "item");
                  ItemImage image = ItemImage.builder()
                      .item(item)
                      .itemImageUrl(imageUrl)
                      .isRepresentative(isRep)
                      .build();
                  itemImageRepository.save(image);
              }

              // 새 이미지 중 대표이미지가 있다면, 기존 대표이미지들을 모두 false로 변경
              boolean hasNewRep = imagesIsRep != null && imagesIsRep.stream().anyMatch("true"::equals);
              if (hasNewRep) {
                  for (ItemImage img : remainImages) {
                      img.setIsRepresentative(false);
                      itemImageRepository.save(img);
                  }
              }
          }
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  // 옵션 변경 감지: 옵션 개수, 추가/삭제, 가격/재고 변경만 체크
  private boolean isOptionChanged(List<ItemOption> existingOptions, List<ItemOptionDto> newOptions) {
    if (existingOptions.size() != newOptions.size()) return true;
    for (ItemOption option : existingOptions) {
      ItemOptionDto dto = newOptions.stream()
        .filter(d -> d.getOptionId() != null && d.getOptionId().equals(option.getOptionId()))
        .findFirst().orElse(null);
      if (dto == null) return true; // 삭제됨
      if (!option.getOptionAddPrice().equals(dto.getOptionAddPrice()) || !option.getOptionStock().equals(dto.getOptionStock())) {
        return true; // 가격/재고 변경
      }
    }
    // 새로 추가된 옵션이 있는지
    for (ItemOptionDto dto : newOptions) {
      if (dto.getOptionId() == null) return true;
    }
    return false;
  }
}
