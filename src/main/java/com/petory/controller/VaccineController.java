package com.petory.controller;

import com.petory.dto.autoReservation.VaccineDto;
import com.petory.service.VaccineService; // 새로 만들 서비스
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vaccines")
@RequiredArgsConstructor
public class VaccineController {

  private final VaccineService vaccineService;

  @GetMapping("/pet/{petId}")
  public ResponseEntity<List<VaccineDto>> getVaccinesForPet(@PathVariable Long petId) {
    List<VaccineDto> vaccines = vaccineService.getSelectableVaccines(petId);
    return ResponseEntity.ok(vaccines);
  }
}
