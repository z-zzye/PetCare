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
public class AuctionController {  //기본 경매 CRUD

  private final AuctionService auctionService;

  @PostMapping("/new") //경매 상품 등록(프론트에서)
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

  @GetMapping("/list") // 경매 상품 목록 조회(메인,관리자페이지에서 사용)
  public ResponseEntity<List<AuctionItemResponseDto>> getAuctionList() {
    List<AuctionItemResponseDto> list = auctionService.getAuctionList();
    return ResponseEntity.ok(list);
  }

  @GetMapping("/{auctionItemId}") // 경매 상품 단건 조회(경매방에서 사용)
  public ResponseEntity<AuctionItemResponseDto> getAuctionItem(@PathVariable Long auctionItemId) {
    AuctionItemResponseDto item = auctionService.getAuctionItem(auctionItemId);
    if (item == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(item);
  }



  @PutMapping("/{auctionItemId}") // 경매 상품 수정(관리자페이지에서 사용)
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

  @PostMapping("/{auctionItemId}/start") // 경매 시작(관리자 페이지에서 사용)
  public ResponseEntity<?> startAuction(
      @PathVariable Long auctionItemId,
      @RequestBody Map<String, String> body
  ) {
    try {
      String startTime = body.get("start_time");
      String endTime = body.get("end_time");
      auctionService.startAuction(auctionItemId, startTime, endTime);
      return ResponseEntity.ok("경매가 시작되었습니다.");
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body("경매 시작 중 오류 발생: " + e.getMessage());
    }
  }



  @PostMapping("/{auctionItemId}/force-end") // 경매 강제 종료 - 유찰 처리(관리자 페이지에서 사용)
  public ResponseEntity<?> forceEndAuction(@PathVariable Long auctionItemId) {
    try {
      auctionService.forceEndAuction(auctionItemId);
      return ResponseEntity.ok("경매가 강제 종료되었습니다. (유찰 처리)");
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body("경매 강제 종료 중 오류 발생: " + e.getMessage());
    }
  }

  @DeleteMapping("/{auctionItemId}") // 경매 상품 삭제 (관리자 페이지에서 사용)
  public ResponseEntity<?> deleteAuction(@PathVariable Long auctionItemId) {
    try {
      auctionService.deleteAuctionItem(auctionItemId);
      return ResponseEntity.ok().body("경매 상품이 삭제되었습니다.");
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body("경매 상품 삭제 중 오류 발생: " + e.getMessage());
    }
  }
}
