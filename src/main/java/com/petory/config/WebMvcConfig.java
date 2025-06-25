package com.petory.config; // 사용자님의 config 패키지 경로

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    // application.properties에서 설정한 값을 주입받습니다.
    @Value("${upload.path}")
    String uploadPath;

    @Value("${resource.handler}")
    String resourceHandler;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // /images/** URL로 요청이 들어오면,
        // uploadPath 경로에서 파일을 찾아 제공하도록 설정합니다.
        registry.addResourceHandler(resourceHandler)
                .addResourceLocations(uploadPath);
    }
}
