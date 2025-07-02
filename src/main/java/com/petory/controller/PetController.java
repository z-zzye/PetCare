package com.petory.controller;

import com.petory.dto.PetRegisterDto;
import com.petory.entity.Pet;
import com.petory.service.PetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {
  private final PetService petService;

  @PostMapping("/register")
  public ResponseEntity<Void> registerPet(@RequestBody PetRegisterDto dto) {
    petService.registerPet(dto);
    return ResponseEntity.ok().build();
  }

  @GetMapping("/member/{memberId}")
  public ResponseEntity<List<Pet>> getPets(@PathVariable Long memberId) {
    return ResponseEntity.ok(petService.getPetsByMember(memberId));
  }
}
