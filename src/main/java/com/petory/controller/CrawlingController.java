package com.petory.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.petory.dto.board.BoardCreateDto;
import com.petory.dto.board.CrawlingRequestDto;
import com.petory.service.BoardService;
import com.petory.service.CrawlingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/crawling")
@RequiredArgsConstructor
public class CrawlingController {
    
    private final CrawlingService crawlingService;
    private final BoardService boardService;
    
    /**
     * 웹 페이지를 크롤링하여 게시글을 생성합니다.
     */
    @PostMapping("/create-board")
    public ResponseEntity<Long> createBoardFromCrawling(
            @Valid @RequestBody CrawlingRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            // 크롤링 수행
            BoardCreateDto boardCreateDto = crawlingService.crawlWebPage(requestDto);
            
            // 게시글 생성
            Long savedBoardId = boardService.createBoard(boardCreateDto, userDetails.getUsername());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedBoardId);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(-1L); // 에러 시 -1 반환
        }
    }
    
    /**
     * URL을 입력받아 크롤링 설정을 미리보기합니다.
     */
    @GetMapping("/preview")
    public ResponseEntity<BoardCreateDto> previewCrawling(
            @RequestParam String url,
            @RequestParam(required = false) String titleSelector,
            @RequestParam(required = false) String contentSelector) {
        
        try {
            CrawlingRequestDto requestDto = new CrawlingRequestDto();
            requestDto.setUrl(url);
            requestDto.setTitleSelector(titleSelector);
            requestDto.setContentSelector(contentSelector);
            requestDto.setTitle("미리보기"); // 임시 제목
            
            // 크롤링 미리보기
            BoardCreateDto preview = crawlingService.crawlWebPage(requestDto);
            
            return ResponseEntity.ok(preview);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * 특정 사이트에 대한 크롤링 설정을 가져옵니다.
     */
    @GetMapping("/config")
    public ResponseEntity<CrawlingRequestDto> getCrawlingConfig(@RequestParam String url) {
        try {
            CrawlingRequestDto config = crawlingService.getCrawlingConfigForSite(url);
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
} 