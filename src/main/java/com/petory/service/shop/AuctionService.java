package com.petory.service.shop;

import com.petory.dto.shop.AuctionItemDto;
import com.petory.dto.shop.AuctionItemResponseDto;
import com.petory.entity.shop.AuctionItem;
import com.petory.entity.shop.Item;
import com.petory.entity.Member;
import com.petory.repository.shop.AuctionItemRepository;
import com.petory.repository.shop.AuctionBidRepository;
import com.petory.repository.shop.ItemRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.petory.constant.AuctionStatus;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuctionService {

  private final AuctionItemRepository auctionItemRepository;
  private final AuctionBidRepository auctionBidRepository;
  private final ItemRepository itemRepository;

  @Transactional
  public Long saveAuctionItem(AuctionItemDto auctionItemDto) { //경매상품등록
    // 1. Item 조회
    Item item = itemRepository.findById(auctionItemDto.getItem_id())
      .orElseThrow(() -> new IllegalArgumentException("해당 상품이 존재하지 않습니다."));

    // 2. AuctionItem 생성 및 저장
    AuctionItem auctionItem = AuctionItem.builder()
      .item(item)
      .startPrice(auctionItemDto.getStart_price())
      .startTime(auctionItemDto.getStart_time())
      .endTime(auctionItemDto.getEnd_time())
      .bidUnit(auctionItemDto.getBid_unit())
      .auctionDescription(auctionItemDto.getAuction_description())
      .auctionStatus(AuctionStatus.SCHEDULED) // 무조건 예정으로 세팅
      .build();

    auctionItemRepository.save(auctionItem);
    return auctionItem.getId();
  }

  @Transactional
  public void updateAuctionItem(Long auctionItemId, AuctionItemDto auctionItemDto) {
    AuctionItem auctionItem = auctionItemRepository.findById(auctionItemId)
      .orElseThrow(() -> new IllegalArgumentException("해당 경매 상품이 존재하지 않습니다."));

    auctionItem.setStartPrice(auctionItemDto.getStart_price());
    auctionItem.setStartTime(auctionItemDto.getStart_time());
    auctionItem.setEndTime(auctionItemDto.getEnd_time());
    auctionItem.setBidUnit(auctionItemDto.getBid_unit());
    auctionItem.setAuctionDescription(auctionItemDto.getAuction_description());
    // 필요시 상태 등 추가 필드 업데이트
    // JPA 변경감지로 자동 반영
  }

  public List<AuctionItemResponseDto> getAuctionList() { //경매 상품 목록 조회
    List<AuctionItem> auctionItems = auctionItemRepository.findAll();
    return auctionItems.stream().map(auctionItem -> {
      // 현재 최고 입찰가 조회
      Integer currentPrice = auctionBidRepository.findMaxBidAmountByAuctionItem(auctionItem)
          .orElse(auctionItem.getStartPrice());
      
      // 현재 최고 입찰자 조회
      Member currentWinner = auctionBidRepository.findCurrentWinnerByAuctionItem(auctionItem)
          .orElse(null);
      
      String rawThumbnailUrl = itemRepository.findRepresentativeImageUrlByItemId(auctionItem.getItem().getItemId());
      String thumbnailUrl = null;
      if (rawThumbnailUrl != null && !rawThumbnailUrl.startsWith("/")) {
        thumbnailUrl = "/images/" + rawThumbnailUrl;
      } else {
        thumbnailUrl = rawThumbnailUrl;
      }
      return AuctionItemResponseDto.builder()
        .auction_item_id(auctionItem.getId())
        .item_id(auctionItem.getItem().getItemId())
        .itemName(auctionItem.getItem().getItemName())
        .itemPrice(auctionItem.getItem().getItemPrice())
        .thumbnailUrl(thumbnailUrl)
        .start_price(auctionItem.getStartPrice())
        .start_time(auctionItem.getStartTime())
        .end_time(auctionItem.getEndTime())
        .current_price(currentPrice)
        .bid_unit(auctionItem.getBidUnit())
        .auction_status(auctionItem.getAuctionStatus())
        .auction_description(auctionItem.getAuctionDescription())
        .currentWinnerName(currentWinner != null ? currentWinner.getMember_NickName() : null)
        .currentWinnerId(currentWinner != null ? currentWinner.getMemberId() : null)
        .build();
    }).collect(Collectors.toList());
  }
}
