package com.petory.service;

import com.petory.dto.AmenityDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KakaoMapService {

    @Value("${kakao.rest.api.key}")
    private String kakaoApiKey; // application.properties에 KakaoAK xxxxxxx 형태로 저장

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 카카오맵 바운딩 박스 내 장소(카테고리) 검색
     */
    public List<AmenityDto> searchInBounds(String category, double minLat, double maxLat, double minLng, double maxLng) {
        String rect = String.format("%f,%f,%f,%f", minLng, minLat, maxLng, maxLat);
        String url;
        if ("동물병원".equals(category)) {
            // 동물병원 카테고리 코드(PM9)로 category API 사용
            url = UriComponentsBuilder.fromHttpUrl("https://dapi.kakao.com/v2/local/search/category.json")
                .queryParam("category_group_code", "PM9")
                .queryParam("rect", rect)
                .queryParam("size", 15)
                .build().toUriString();
        } else {
            // 기존 keyword API 사용
            url = UriComponentsBuilder.fromHttpUrl("https://dapi.kakao.com/v2/local/search/keyword.json")
                .queryParam("query", category)
                .queryParam("rect", rect)
                .queryParam("size", 15)
                .build().toUriString();
        }

        System.out.println("카카오맵 API 요청 URL: " + url);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", kakaoApiKey); // KakaoAK xxxxxxx
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

        System.out.println("카카오맵 API 응답: " + response.getBody());

        List<AmenityDto> result = new ArrayList<>();
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List<Map<String, Object>> docs = (List<Map<String, Object>>) response.getBody().get("documents");
            for (Map<String, Object> doc : docs) {
                String name = (String) doc.get("place_name");
                String address = (String) doc.get("address_name");
                String distance = doc.get("distance") != null ? doc.get("distance") + "m" : "-";
                String placeUrl = (String) doc.get("place_url");
                double lat = Double.parseDouble((String) doc.get("y"));
                double lng = Double.parseDouble((String) doc.get("x"));
                result.add(new AmenityDto(name, address, distance, placeUrl, lat, lng));
            }
        }
        System.out.println("카카오맵 검색 결과(필터 전): " + result.size());
        return result;
    }
}

// application.properties 예시:
// kakao.rest.api.key=KakaoAK xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx 