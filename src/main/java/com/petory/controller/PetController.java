package com.petory.controller;

import com.petory.dto.PetDto;
import com.petory.dto.PetRegisterDto;
import com.petory.entity.Pet;
import com.petory.service.PetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {
  private final PetService petService;

  @PostMapping(value = "/register", consumes = {"multipart/form-data"})
  public ResponseEntity<Map<String, Object>> registerPet(
    @RequestPart("data") @Valid PetRegisterDto dto,
    @RequestPart(value = "pet_ProfileImgFile", required = false) MultipartFile pet_ProfileImgFile,
    BindingResult bindingResult) {

    if (bindingResult.hasErrors()) {
      String errorMsg = bindingResult.getFieldErrors().stream()
        .map(FieldError::getDefaultMessage)
        .collect(Collectors.joining("\n"));
      Map<String, Object> errorBody = Map.of("message", errorMsg);
      return ResponseEntity.badRequest().body(errorBody);
    }

    try {
      dto.setPet_ProfileImg(pet_ProfileImgFile);
      Pet savedPet = petService.registerPet(dto);

      Map<String, Object> responseBody = new HashMap<>();

      responseBody.put("message", "펫 등록 완료!");
      responseBody.put("data", PetDto.from(savedPet));

      return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    } catch (Exception e) {
      Map<String, Object> errorBody = Map.of("message", "펫 등록 중 오류 발생: " + e.getMessage());
      return ResponseEntity.status(500).body(errorBody);
    }
  }


  @GetMapping("/member/{memberId}")
  public ResponseEntity<List<PetDto>> getPets(@PathVariable Long memberId) {
    List<Pet> pets = petService.getPetsByMember(memberId);
    List<PetDto> result = pets.stream()
      .map(PetDto::from)
      .toList();
    return ResponseEntity.ok(result);
  }

  // ✅ 특정 펫 1마리 조회 (수정 폼용)
  @GetMapping("/{petId}")
  public ResponseEntity<PetDto> getPetById(@PathVariable Long petId) {
    Pet pet = petService.findById(petId);
    PetDto dto = PetDto.from(pet);
    return ResponseEntity.ok(dto);
  }

  // ✅ 펫 수정 후 업데이트
  @PutMapping(value = "/{petId}", consumes = {"multipart/form-data"})
  public ResponseEntity<Map<String, Object>> updatePet(
    @PathVariable Long petId,
    @RequestPart("data") @Valid PetRegisterDto dto,
    @RequestPart(value = "pet_ProfileImgFile", required = false) MultipartFile pet_ProfileImgFile,
    BindingResult bindingResult
  ) {
    if (bindingResult.hasErrors()) {
      String errorMsg = bindingResult.getFieldErrors().stream()
        .map(FieldError::getDefaultMessage)
        .collect(Collectors.joining("\n"));
      Map<String, Object> errorBody = Map.of("message", errorMsg);
      return ResponseEntity.badRequest().body(errorBody);
    }

    try {
      dto.setPet_ProfileImg(pet_ProfileImgFile);
      Pet updatedPet = petService.updatePet(petId, dto); // 서비스 로직에서 처리

      Map<String, Object> responseBody = new HashMap<>();
      responseBody.put("message", "펫 정보 수정이 완료되었습니다!");
      responseBody.put("data", PetDto.from(updatedPet));

      return ResponseEntity.ok(responseBody);
    } catch (Exception e) {
      Map<String, Object> errorBody = Map.of("message", "펫 정보 수정 중 오류 발생: " + e.getMessage());
      return ResponseEntity.status(500).body(errorBody);
    }
  }

  /*✅ 펫 삭제*/
  /*@DeleteMapping("/{petId}")
  public ResponseEntity<Void> deletePet(@PathVariable Long petId) throws Exception {
    petService.deletePet(petId); // 이미지 포함 삭제
    return ResponseEntity.noContent().build(); // 204
  }*/
  @DeleteMapping("/{petId}")
  public ResponseEntity<String> deletePet(@PathVariable Long petId) {
    try {
      petService.deletePet(petId);
      return ResponseEntity.ok("펫 삭제 완료!");
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body("삭제 실패: " + e.getMessage());
    }
  }

}
