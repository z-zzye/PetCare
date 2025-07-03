package com.petory.controller.shop;

import com.petory.dto.shop.ItemFormDto;
import com.petory.service.shop.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.petory.dto.shop.ItemListDto;
import com.petory.dto.shop.ItemDetailDto;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

  private final ItemService itemService;

  @PostMapping(value = "/new", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> registerItem(
    @RequestParam("itemDto") String itemDtoJson,
    @RequestParam(value = "images", required = false) List<MultipartFile> images,
    @RequestParam(value = "imagesIsRep", required = false) List<String> imagesIsRep
  ) {
    try {
      ObjectMapper objectMapper = new ObjectMapper();
      ItemFormDto formDto = objectMapper.readValue(itemDtoJson, ItemFormDto.class);
      itemService.saveItem(formDto, images, imagesIsRep);
      return ResponseEntity.ok("상품 등록 성공");
    } catch (MultipartException e) {
      return ResponseEntity.badRequest().body("파일 업로드 실패: " + e.getMessage());
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body("등록 중 오류 발생: " + e.getMessage());
    }
  }

  // 상품 목록 조회 API
  @GetMapping("/list")
  public ResponseEntity<List<ItemListDto>> getItemList(
    @RequestParam(value = "mainCategory", required = false) Long mainCategoryId,
    @RequestParam(value = "subCategory", required = false) Long subCategoryId,
    @RequestParam(value = "search", required = false) String search
  ) {
    List<ItemListDto> items = itemService.getItemList(mainCategoryId, subCategoryId, search);
    return ResponseEntity.ok(items);
  }

  // 상품 상세 정보 조회 API
  @GetMapping("/{itemId}/detail")
  public ResponseEntity<ItemDetailDto> getItemDetail(@PathVariable Long itemId) {
    ItemDetailDto detail = itemService.getItemDetail(itemId);
    return ResponseEntity.ok(detail);
  }

  // 상품 삭제 API
  @DeleteMapping("/{itemId}")
  public ResponseEntity<?> deleteItem(@PathVariable Long itemId) {
    itemService.deleteItem(itemId);
    return ResponseEntity.ok("상품 삭제 성공");
  }

  // 상품 수정 폼용 상세 조회 (ItemFormDto 반환)
  @GetMapping("/{itemId}/form")
  public ItemFormDto getItemForm(@PathVariable Long itemId) {
    return itemService.getItemFormDto(itemId);
  }

  // 상품 수정 API
  @PutMapping(value = "/{itemId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> updateItem(
    @PathVariable Long itemId,
    @RequestParam("itemDto") String itemDtoJson,
    @RequestParam(value = "images", required = false) List<MultipartFile> images,
    @RequestParam(value = "imagesIsRep", required = false) List<String> imagesIsRep,
    @RequestParam(value = "remainImageUrls", required = false) String remainImageUrlsJson
  ) {
    try {
      ObjectMapper objectMapper = new ObjectMapper();
      ItemFormDto formDto = objectMapper.readValue(itemDtoJson, ItemFormDto.class);
      List<String> remainImageUrls = remainImageUrlsJson != null && !remainImageUrlsJson.isEmpty()
        ? objectMapper.readValue(remainImageUrlsJson, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class))
        : List.of();
      itemService.updateItem(itemId, formDto, images, imagesIsRep, remainImageUrls);
      return ResponseEntity.ok("상품 수정 성공");
    } catch (MultipartException e) {
      return ResponseEntity.badRequest().body("파일 업로드 실패: " + e.getMessage());
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body("수정 중 오류 발생: " + e.getMessage());
    }
  }
}
