package com.petory.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentRegisterDto {
  private String billingKey;
  private String cardInfo;
}
