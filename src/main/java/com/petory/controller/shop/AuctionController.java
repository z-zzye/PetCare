package com.petory.controller.shop;

import com.petory.dto.shop.AuctionItemDto;
import com.petory.service.shop.AuctionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import com.petory.dto.shop.AuctionItemResponseDto;
import java.util.List;

@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
public class AuctionController {

  private final AuctionService auctionService;

  @PostMapping("/new")
  public ResponseEntity<?> registerAuction(@RequestBody AuctionItemDto auctionItemDto) {
    try {
      Long auctionId = auctionService.saveAuctionItem(auctionItemDto);
      Map<String, Object> result = new HashMap<>();
      result.put("auction_item_id", auctionId);
      result.put("id", auctionId);
      result.put("message", "경매 상품 등록 성공");
      return ResponseEntity.ok(result);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body("경매 등록 중 오류 발생: " + e.getMessage());
    }
  }

  @GetMapping("/list")
  public ResponseEntity<List<AuctionItemResponseDto>> getAuctionList() {
    List<AuctionItemResponseDto> list = auctionService.getAuctionList();
    return ResponseEntity.ok(list);
  }

  @PutMapping("/{auctionItemId}")
  public ResponseEntity<?> updateAuction(
      @PathVariable Long auctionItemId,
      @RequestBody AuctionItemDto auctionItemDto
  ) {
    try {
      auctionService.updateAuctionItem(auctionItemId, auctionItemDto);
      return ResponseEntity.ok("경매 상품 수정 성공");
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body("경매 수정 중 오류 발생: " + e.getMessage());
    }
  }
} 