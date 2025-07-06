package com.petory.dto.shop;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
//배송지정보
public class AddressInfoDto {
    private String receiverName; //받는 사람
    private String receiverPhone; //연락처
    private String address; //도로명주소
    private String addressDetail; //상세주소
    private String deliveryName; //배송지명
}
