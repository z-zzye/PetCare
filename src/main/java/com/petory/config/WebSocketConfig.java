package com.petory.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws/chat")
      .setAllowedOriginPatterns("*")  // 프론트 React와 연결 가능
      .withSockJS();  // SockJS fallback 허용
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableSimpleBroker("/queue", "/topic"); // 브로커 구독 경로
    registry.setApplicationDestinationPrefixes("/app"); // 메시지 송신 경로
  }
}
