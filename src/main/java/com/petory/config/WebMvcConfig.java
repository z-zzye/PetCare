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

    @Value("${board.image.resource.handler}")
    String boardImageResourceHandler;

    @Value("${board.image.resource.location}")
    String boardImageResourceLocation;

    @Value("${crawling.image.resource.handler}")
    String crawlingImageResourceHandler;

    @Value("${crawling.image.resource.location}")
    String crawlingImageResourceLocation;

    @Value("${vetlicense.resource.handler}")
    String vetlicenseResourceHandler;

    @Value("${vetlicense.resource.location}")
    String vetlicenseResourceLocation;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    "http://localhost:3000",
                    //"http://127.0.0.1:3000",
                    "http://localhost:80",
                    "http://127.0.0.1:80",
                    "http://localhost"
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

        // 게시글 이미지 전용 핸들러
        registry.addResourceHandler(boardImageResourceHandler)
                .addResourceLocations(boardImageResourceLocation);

        // 크롤링 이미지 전용 핸들러
        registry.addResourceHandler(crawlingImageResourceHandler)
                .addResourceLocations(crawlingImageResourceLocation);

        // 수의사 자격증 이미지 전용 핸들러
        registry.addResourceHandler(vetlicenseResourceHandler)
                .addResourceLocations(vetlicenseResourceLocation);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // SPA 라우팅을 위한 설정
        // /api로 시작하는 경로는 제외하고, 나머지 모든 경로를 index.html로 포워딩
        registry.addViewController("/")
            .setViewName("forward:/index.html");
        registry.addViewController("/order")
            .setViewName("forward:/index.html");
        registry.addViewController("/order/complete")
            .setViewName("forward:/index.html");
        registry.addViewController("/shop/**")
            .setViewName("forward:/index.html");
        registry.addViewController("/members/**")
            .setViewName("forward:/index.html");
        registry.addViewController("/board/**")
            .setViewName("forward:/index.html");
        registry.addViewController("/trails/**")
            .setViewName("forward:/index.html");
        registry.addViewController("/admin/**")
            .setViewName("forward:/index.html");
        registry.addViewController("/place")
            .setViewName("forward:/index.html");
        registry.addViewController("/payment/**") //아임포트에서 /payment/success로 리다이렉트
            .setViewName("forward:/index.html");
        registry.addViewController("/toss-auth-success")
            .setViewName("forward:/index.html");
        registry.addViewController("/find-id")
            .setViewName("forward:/index.html");
        registry.addViewController("/find-pw")
            .setViewName("forward:/index.html");
        registry.addViewController("/reset-pw")
            .setViewName("forward:/index.html");
        registry.addViewController("/oauth2/**")
            .setViewName("forward:/index.html");
    }
}
