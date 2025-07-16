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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.petory.constant.AuctionStatus;
import com.petory.service.shop.AuctionSessionService;
import com.petory.service.shop.AuctionHistoryService;
import com.petory.constant.AuctionWinStatus;
import com.petory.service.shop.AuctionDeliveryService;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import com.petory.entity.shop.AuctionHistory;
import com.petory.repository.shop.AuctionSessionRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionService {

  private final AuctionItemRepository auctionItemRepository;
  private final AuctionSessionRepository auctionSessionRepository;
  private final AuctionBidRepository auctionBidRepository;
  private final ItemRepository itemRepository;
  private final AuctionSessionService auctionSessionService;
  private final AuctionBidService auctionBidService;
  private final AuctionHistoryService auctionHistoryService;
  private final AuctionDeliveryService auctionDeliveryService;

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

  @Transactional
  public void startAuction(Long auctionItemId, String startTime, String endTime) {
    AuctionItem auctionItem = auctionItemRepository.findById(auctionItemId)
      .orElseThrow(() -> new IllegalArgumentException("해당 경매 상품이 존재하지 않습니다."));
    auctionItem.setStartTime(LocalDateTime.parse(startTime));
    auctionItem.setEndTime(LocalDateTime.parse(endTime));
    auctionItem.setAuctionStatus(AuctionStatus.ACTIVE);
    auctionItemRepository.save(auctionItem);

    // 세션 즉시 생성 (강제 시작이므로 ACTIVE로)
    auctionSessionService.createSession(auctionItem, true);
  }

  @Transactional
  public void endAuction(Long auctionItemId, String endTime) {
    AuctionItem auctionItem = auctionItemRepository.findById(auctionItemId)
      .orElseThrow(() -> new IllegalArgumentException("해당 경매 상품이 존재하지 않습니다."));
    auctionItem.setEndTime(LocalDateTime.parse(endTime));
    auctionItem.setAuctionStatus(AuctionStatus.ENDED);
    auctionItemRepository.save(auctionItem);

    // 1. 모든 입찰자 조회
    List<Member> participants = auctionBidRepository.findAllParticipantsByAuctionItem(auctionItem);

    // 2. 최고 입찰자(낙찰자) 선정
    Member winner = auctionBidRepository.findCurrentWinnerByAuctionItem(auctionItem).orElse(null);
    Integer finalPrice = auctionBidRepository.findMaxBidAmountByAuctionItem(auctionItem).orElse(auctionItem.getStartPrice());

    for (Member participant : participants) {
      boolean isWinner = winner != null && participant.getMemberId().equals(winner.getMemberId());
      com.petory.constant.AuctionWinStatus status = isWinner ? AuctionWinStatus.WIN : null;
      AuctionHistory history = auctionHistoryService.createHistory(
        auctionItem, participant, finalPrice, isWinner, status
      );
      
      // 낙찰자인 경우 AuctionDelivery 생성
      if (isWinner && history != null) {
        auctionDeliveryService.createDelivery(history, LocalDateTime.now().plusDays(5));
      }
    }

    // 세션도 ENDED로 변경
    auctionSessionService.getSessionByAuctionItem(auctionItem)
        .ifPresent(session -> auctionSessionService.endSession(session.getId()));
  }

  @Transactional
  public void forceEndAuction(Long auctionItemId) {
    AuctionItem auctionItem = auctionItemRepository.findById(auctionItemId)
      .orElseThrow(() -> new IllegalArgumentException("해당 경매 상품이 존재하지 않습니다."));
    
    // 경매 상태를 ENDED로 변경
    auctionItem.setEndTime(LocalDateTime.now());
    auctionItem.setAuctionStatus(AuctionStatus.ENDED);
    auctionItemRepository.save(auctionItem);

    // 모든 입찰을 CANCELED 상태로 변경 (유찰 처리)
    auctionBidService.cancelAllBidsForAuction(auctionItemId);

    // 세션도 ENDED로 변경
    auctionSessionService.getSessionByAuctionItem(auctionItem)
        .ifPresent(session -> auctionSessionService.endSession(session.getId()));
  }

  @Transactional
  public void deleteAuctionItem(Long auctionItemId) {
    auctionItemRepository.deleteById(auctionItemId);
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

  public AuctionItemResponseDto getAuctionItem(Long auctionItemId) {
    AuctionItem auctionItem = auctionItemRepository.findById(auctionItemId)
      .orElse(null);
    if (auctionItem == null) return null;

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
  }


}
