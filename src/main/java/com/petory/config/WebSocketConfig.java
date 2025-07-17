package com.petory.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.HandshakeInterceptor;
import com.petory.config.JwtHandshakeInterceptor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.config.ChannelRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  @Autowired
  private JwtTokenProvider jwtTokenProvider;
  @Autowired
  private UserDetailsService userDetailsService;
  @Autowired
  private JwtHandshakeInterceptor jwtHandshakeInterceptor;

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    // 채팅용 WebSocket 엔드포인트
    registry.addEndpoint("/ws/chat")
      .addInterceptors(jwtHandshakeInterceptor)
      .setAllowedOriginPatterns("*")  // 프론트 React와 연결 가능
      .withSockJS();  // SockJS fallback 허용

    // 경매용 WebSocket 엔드포인트
    registry.addEndpoint("/ws/auction")
      .addInterceptors(jwtHandshakeInterceptor)
      .setAllowedOriginPatterns("*")
      .withSockJS();
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableSimpleBroker("/queue", "/topic"); // 브로커 구독 경로
    registry.setApplicationDestinationPrefixes("/app"); // 메시지 송신 경로
  }

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(new ChannelInterceptor() {
      @Override
      public Message<?> preSend(Message<?> message, MessageChannel channel) {
        System.out.println("preSend - 메시지 타입: " + message.getClass().getSimpleName());
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        System.out.println("preSend - accessor.getCommand(): " + accessor.getCommand());
        System.out.println("preSend - accessor.getDestination(): " + accessor.getDestination());
        System.out.println("preSend - accessor.getUser(): " + accessor.getUser());

        if (accessor.getUser() == null) {
          // Handshake에서 저장한 token을 꺼냄
          String token = (String) accessor.getSessionAttributes().get("token");
          System.out.println("preSend - token: " + token);
          if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
          }
          System.out.println("preSend - processed token: " + token);
          if (token != null) {
            String email = jwtTokenProvider.getEmail(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            accessor.setUser(auth);
            SecurityContextHolder.getContext().setAuthentication(auth);
            System.out.println("preSend - auth created: " + auth);
            System.out.println("preSend - SecurityContextHolder set: " + SecurityContextHolder.getContext().getAuthentication());
          }
        }
        return message;
      }
      
      @Override
      public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        
        // 연결 해제 시 참여자 비활성화
        if (accessor.getCommand() == StompCommand.DISCONNECT) {
          String sessionId = accessor.getSessionId();
          System.out.println("🔌 WebSocket 연결 해제 감지: sessionId=" + sessionId);
          
          // 연결 ID로 참여자 조회하여 비활성화
          // (실제로는 AuctionParticipantService를 주입받아 처리)
        }
      }
    });
  }
}
