package com.petory.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.HandshakeInterceptor;
import com.petory.config.JwtHandshakeInterceptor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
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

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws/chat")
      .addInterceptors(new JwtHandshakeInterceptor())
      .setAllowedOriginPatterns("*")  // 프론트 React와 연결 가능
      .withSockJS();  // SockJS fallback 허용
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
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (accessor.getUser() == null) {
          // Handshake에서 저장한 token을 꺼냄
          String token = (String) accessor.getSessionAttributes().get("token");
          if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
          }
          if (token != null) {
            String email = jwtTokenProvider.getEmail(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            accessor.setUser(auth);
            SecurityContextHolder.getContext().setAuthentication(auth);
          }
        }
        return message;
      }
    });
  }
}
