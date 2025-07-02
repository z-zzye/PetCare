package com.petory.controller;

import com.petory.dto.PetRegisterDto;
import com.petory.entity.Pet;
import com.petory.service.PetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {
  private final PetService petService;

  @PostMapping(value = "/register", consumes = {"multipart/form-data"})
  public ResponseEntity<?> registerPet(
    @RequestPart("data") @Valid PetRegisterDto dto,
    @RequestPart(value = "pet_ProfileImgFile", required = false) MultipartFile pet_ProfileImgFile,
    BindingResult bindingResult) {

    if (bindingResult.hasErrors()) {
      String errorMsg = bindingResult.getFieldErrors().stream()
        .map(FieldError::getDefaultMessage)
        .collect(Collectors.joining("\n"));
      return ResponseEntity.badRequest().body(errorMsg);
    }

    try {
      dto.setPet_ProfileImg(pet_ProfileImgFile);
      petService.registerPet(dto);
      return ResponseEntity.ok("펫 등록 완료!");
    } catch (Exception e) {
      return ResponseEntity.status(500).body("펫 등록 중 오류 발생: " + e.getMessage());
    }
  }


  @GetMapping("/member/{memberId}")
  public ResponseEntity<List<Pet>> getPets(@PathVariable Long memberId) {
    return ResponseEntity.ok(petService.getPetsByMember(memberId));
  }
}
