package com.petory.controller;

import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.petory.constant.BoardKind;
import com.petory.dto.board.BoardListDto;
import com.petory.dto.board.BoardUpdateDto;
import com.petory.dto.member.MemberSearchDto;
import com.petory.dto.CreatorApplyAdminDto;
import com.petory.dto.VetApplyAdminDto;
import com.petory.entity.Board;
import com.petory.service.BoardService;
import com.petory.service.CleanBotService;
import com.petory.service.MemberService;
import com.petory.service.CreatorApplyService;
import com.petory.service.VetApplyService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CleanBotService cleanBotService;
    private final BoardService boardService;
    private final MemberService memberService;
    private final CreatorApplyService creatorApplyService;
    private final VetApplyService vetApplyService;

    /**
     * 금지어 목록을 조회하는 API
     */
    @GetMapping("/profanity")
    public ResponseEntity<String> getProfanityList() {
        String currentProfanityList = cleanBotService.getProfanityListAsString();
        return ResponseEntity.ok(currentProfanityList);
    }

    /**
     * 금지어 목록을 갱신하는 API
     */
    @PostMapping("/profanity/update")
    public ResponseEntity<String> updateProfanityList(@RequestBody Map<String, String> payload) {
        try {
            String updatedList = payload.get("list");
            cleanBotService.updateProfanityList(updatedList);
            return ResponseEntity.ok("금지어 목록이 성공적으로 갱신되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("금지어 목록 갱신에 실패했습니다: " + e.getMessage());
        }
    }

    @PostMapping("/boards/{id}/blind")
    public ResponseEntity<String> blindOrUnblindBoard(@PathVariable Long id) {
        try {
            Board board = boardService.getBoardById(id);
            if (board.isBlinded()) {
                boardService.unblindBoard(id);
                return ResponseEntity.ok("블라인드 해제 완료");
            } else {
                boardService.blindBoard(id);
                return ResponseEntity.ok("블라인드 처리 완료");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("처리 중 오류 발생: " + e.getMessage());
        }
    }

    @DeleteMapping("/boards/{id}")
    public ResponseEntity<String> deleteBoard(@PathVariable Long id) {
        boardService.deleteBoardByAdmin(id);
        return ResponseEntity.ok("삭제 완료");
    }

    @GetMapping("/boards/{id}/original-title")
    public ResponseEntity<String> getOriginalTitle(@PathVariable Long id) {
        String originalTitle = boardService.getOriginalTitle(id);
        return ResponseEntity.ok(originalTitle);
    }

    @GetMapping("/boards/{id}/original-content")
    public ResponseEntity<String> getOriginalContent(@PathVariable Long id) {
        String originalContent = boardService.getOriginalContent(id);
        return ResponseEntity.ok(originalContent);
    }

    @PatchMapping("/boards/{id}")
    public ResponseEntity<String> updateBoardByAdmin(@PathVariable Long id, @RequestBody BoardUpdateDto updateDto) {
        boardService.updateBoardByAdmin(id, updateDto);
        return ResponseEntity.ok("수정 완료");
    }

    @GetMapping("/boards")
    public ResponseEntity<List<BoardListDto>> getAdminBoardList(@RequestParam String category) {
        BoardKind boardKind = BoardKind.valueOf(category.toUpperCase());
        List<BoardListDto> list = boardService.getBoardListByKind(boardKind);
        return ResponseEntity.ok(list);
    }

    /**
     * 기존 게시글들 중 클린봇이 감지했지만 blinded 필드가 설정되지 않은 게시글들을 업데이트하는 API
     */
    @PostMapping("/boards/update-blinded")
    public ResponseEntity<String> updateExistingBlindedPosts() {
        try {
            boardService.updateExistingBlindedPosts();
            return ResponseEntity.ok("기존 블라인드 게시글 업데이트가 완료되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("업데이트 중 오류 발생: " + e.getMessage());
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<MemberSearchDto>> getUsersByRole(@RequestParam("role") String role) {
        // memberService를 사용하여 회원 정보를 조회합니다.
        com.petory.constant.Role roleEnum = com.petory.constant.Role.valueOf(role.toUpperCase());

        // 변환된 Enum을 서비스로 전달
        List<MemberSearchDto> users = memberService.findMembersByRole(roleEnum);
        return ResponseEntity.ok(users);
    }

    /**
     * 관리자용 크리에이터 신청 목록 조회 (페이징)
     */
    @GetMapping("/creator-applies")
    public ResponseEntity<Page<CreatorApplyAdminDto>> getCreatorApplies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<CreatorApplyAdminDto> applies = creatorApplyService.getAllCreatorAppliesForAdmin(pageable);
            return ResponseEntity.ok(applies);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("크리에이터 신청 목록 조회 오류: " + e.getMessage());
            System.err.println("오류 타입: " + e.getClass().getName());
            System.err.println("오류 스택 트레이스:");
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 크리에이터 신청 상세 조회
     */
    @GetMapping("/creator-applies/{applyId}")
    public ResponseEntity<CreatorApplyAdminDto> getCreatorApplyDetail(@PathVariable Long applyId) {
        try {
            CreatorApplyAdminDto applyDetail = creatorApplyService.getCreatorApplyDetail(applyId);
            return ResponseEntity.ok(applyDetail);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * 크리에이터 신청 승인/거절 처리
     */
    @PatchMapping("/creator-applies/{applyId}/status")
    public ResponseEntity<String> updateCreatorApplyStatus(
            @PathVariable Long applyId,
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            String rejectReason = request.get("rejectReason");
            
            if (status == null || (!status.equals("APPROVED") && !status.equals("REJECTED"))) {
                return ResponseEntity.badRequest().body("유효하지 않은 상태값입니다.");
            }
            
            creatorApplyService.updateApplyStatus(applyId, status, rejectReason);
            return ResponseEntity.ok("크리에이터 신청 상태가 성공적으로 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("처리 중 오류 발생: " + e.getMessage());
        }
    }

    /**
     * 관리자용 수의사 신청 목록 조회 (페이징)
     */
    @GetMapping("/vet-applies")
    public ResponseEntity<Page<VetApplyAdminDto>> getVetApplies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<VetApplyAdminDto> applies = vetApplyService.getAllVetAppliesForAdmin(pageable);
            return ResponseEntity.ok(applies);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("수의사 신청 목록 조회 오류: " + e.getMessage());
            System.err.println("오류 타입: " + e.getClass().getName());
            System.err.println("오류 스택 트레이스:");
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 수의사 신청 상세 조회
     */
    @GetMapping("/vet-applies/{applyId}")
    public ResponseEntity<VetApplyAdminDto> getVetApplyDetail(@PathVariable Long applyId) {
        try {
            VetApplyAdminDto applyDetail = vetApplyService.getVetApplyDetail(applyId);
            return ResponseEntity.ok(applyDetail);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * 수의사 신청 승인/거절 처리
     */
    @PatchMapping("/vet-applies/{applyId}/status")
    public ResponseEntity<String> updateVetApplyStatus(
            @PathVariable Long applyId,
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            String rejectReason = request.get("rejectReason");
            
            if (status == null || (!status.equals("APPROVED") && !status.equals("REJECTED"))) {
                return ResponseEntity.badRequest().body("유효하지 않은 상태값입니다.");
            }
            
            vetApplyService.updateApplyStatus(applyId, status, rejectReason);
            return ResponseEntity.ok("수의사 신청 상태가 성공적으로 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("처리 중 오류 발생: " + e.getMessage());
        }
    }
}
