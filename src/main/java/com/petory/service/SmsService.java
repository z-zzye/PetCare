package com.petory.service;

import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.response.SingleMessageSentResponse;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

  private final DefaultMessageService messageService;

  public SmsService(
    @Value("${coolsms.api-key}") String apiKey,
    @Value("${coolsms.api-secret}") String apiSecret
  ) {
    this.messageService = NurigoApp.INSTANCE.initialize(
      apiKey,
      apiSecret,
      "https://api.coolsms.co.kr"
    );
  }

  @Value("${coolsms.from-phone}")
  private String fromPhone;

  public void sendSms(String toPhone, String code) {
    Message message = new Message();
    message.setFrom(fromPhone);
    message.setTo(toPhone);
    message.setText("[Petory] 인증번호는 [" + code + "] 입니다.");

    try {
      SingleMessageSentResponse response = messageService.sendOne(
        new SingleMessageSendingRequest(message)
      );
      System.out.println("전송 성공: " + response);
    } catch (Exception e) {
      System.err.println("전송 실패: " + e.getMessage());
    }
  }
}
