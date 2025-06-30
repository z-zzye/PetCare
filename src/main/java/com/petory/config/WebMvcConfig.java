package com.petory.config; // 사용자님의 config 패키지 경로

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    // application.properties에서 설정한 값을 주입받습니다.
    @Value("${upload.path}")
    String uploadPath;

    @Value("${resource.handler}")
    String resourceHandler;

    @Value("${profile.resource.handler}")
    String profileResourceHandler;

    @Value("${profile.resource.location}")
    String profileResourceLocation;

    @Value("${item.resource.handler}")
    String itemResourceHandler;

    @Value("${item.resource.location}")
    String itemResourceLocation;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "http://localhost:8081"
                )
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // /images/** URL로 요청이 들어오면,
        // uploadPath 경로에서 파일을 찾아 제공하도록 설정합니다.
        registry.addResourceHandler(resourceHandler)
                .addResourceLocations(uploadPath);
        
        // 프로필 이미지 전용 핸들러
        registry.addResourceHandler(profileResourceHandler)
                .addResourceLocations(profileResourceLocation);
        
        // 상품 이미지 전용 핸들러
        registry.addResourceHandler(itemResourceHandler)
                .addResourceLocations(itemResourceLocation);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
      registry.addViewController("/{spring:\\w+}")
        .setViewName("forward:/index.html");
      registry.addViewController("/**/{spring:[\\w\\-]+}") // 경로에 하이픈(-) 포함 가능
        .setViewName("forward:/index.html");
    }
}
