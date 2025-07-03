package com.petory.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TossBillingConfirmRequestDto {
  private String authKey;
  private String customerKey;
}
