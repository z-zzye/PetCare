package com.petory.service; // 사용자님의 서비스 패키지 경로

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.util.UUID;

@Service
@Slf4j // 로그 출력을 위한 어노테이션
public class ImageService {

    // application.properties에서 설정한 경로를 주입받습니다.
    @Value("${profileImg.location}")
    private String profileImgLocation;

    @Value("${itemImg.location}")
    private String itemImgLocation;

    @Value("${petProfileImg.location}")
    private String petProfileImgLocation;
    /**
     * MultipartFile을 서버에 업로드하고 웹 경로를 반환합니다.
     * @param multipartFile 업로드할 이미지 파일
     * @param locationType "profile" 또는 "item" 등 저장할 위치 타입
     * @return 웹에서 접근 가능한 이미지 URL 경로
     * @throws Exception
     */
    public String uploadFile(MultipartFile multipartFile, String locationType) throws Exception {
        if (multipartFile == null || multipartFile.isEmpty()) {
            return null; // 업로드된 파일이 없으면 null 반환
        }
        String originalFileName = multipartFile.getOriginalFilename();
        byte[] fileData = multipartFile.getBytes();
        String savedFileName = saveFile(originalFileName, fileData, locationType);

        // locationType에 따라 다른 웹 경로를 반환합니다.
        if ("profile".equals(locationType)) {
            return "/images/profile/" + savedFileName;
        } else if ("item".equals(locationType)) {
            return "/images/item/" + savedFileName;
        } else if("petprofile".equals(locationType)){
            return "/images/petprofile/" + savedFileName;
        }
        return null;
    }

    /**
     * URL로부터 이미지를 다운로드하여 서버에 저장하고 웹 경로를 반환합니다.
     * @param imageUrl 다운로드할 이미지의 전체 URL
     * @param locationType "profile" 또는 "item" 등 저장할 위치 타입
     * @return 웹에서 접근 가능한 이미지 URL 경로
     */
    public String downloadAndSaveImage(String imageUrl, String locationType) {
        if (!StringUtils.hasText(imageUrl)) {
            return null; // URL이 비어있으면 null 반환
        }
        try (InputStream in = new URL(imageUrl).openStream()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int n;
            while ((n = in.read(buffer)) != -1) {
                out.write(buffer, 0, n);
            }
            byte[] fileData = out.toByteArray();

            // 파일 이름은 URL에서 마지막 부분을 사용하거나, 없으면 UUID로 생성
            String fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            if (!StringUtils.hasText(fileName) || fileName.length() > 100) { // 너무 길거나 이름이 없는 경우
                fileName = UUID.randomUUID().toString() + ".jpg";
            }

            String savedFileName = saveFile(fileName, fileData, locationType);

            if ("profile".equals(locationType)) {
                return "/images/profile/" + savedFileName;
            } else if ("item".equals(locationType)) {
                return "/images/item/" + savedFileName;
            } else if("petprofile".equals(locationType)){
              return "/images/petprofile/" + savedFileName;
            }
            return null;

        } catch (Exception e) {
            log.error("Failed to download and save image from URL: " + imageUrl, e);
            return null; // 실패 시 null 반환
        }
    }

    /**
     * 실제 파일을 저장하고, 고유한 파일명을 반환하는 핵심 로직
     */
    private String saveFile(String originalFileName, byte[] fileData, String locationType) throws Exception {
        String uploadPath;
        if ("profile".equals(locationType)) {
            uploadPath = profileImgLocation;
        } else if ("item".equals(locationType)) {
            uploadPath = itemImgLocation;
        } else if ("petprofile".equals(locationType)){
            uploadPath = petProfileImgLocation;
        }else {
            throw new IllegalArgumentException("Invalid location type: " + locationType);
        }

        UUID uuid = UUID.randomUUID();

        String extension;
        int dotIndex = originalFileName.lastIndexOf(".");

        // 파일 이름에 '.'이 있고, 그 위치가 파일 이름의 마지막이 아닌 경우에만 확장자로 인정합니다.
        if (dotIndex > -1 && dotIndex < originalFileName.length() - 1) {
            extension = originalFileName.substring(dotIndex);
        } else {
            // 확장자가 없는 경우, 기본적으로 .jpg를 붙여줍니다. (소셜 프로필 사진은 대부분 jpg 또는 png)
            extension = ".jpg";
        }

        String savedFileName = uuid.toString() + extension;
        String fileUploadFullUrl = uploadPath + savedFileName;

        // 폴더가 없으면 생성
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        // 파일 저장
        try (FileOutputStream fos = new FileOutputStream(fileUploadFullUrl)) {
            fos.write(fileData);
        }

        return savedFileName; // 저장된 파일의 이름(UUID.확장자) 반환
    }

    /**
     * 파일 삭제 로직 (추후 상품 수정/삭제 시 사용 가능)
     */
    public void deleteFile(String filePath) throws Exception {
        // filePath는 "/images/item/uuid-filename.jpg" 와 같은 웹 경로
        // 실제 물리적 경로로 변환하여 파일을 삭제해야 함
        // 예시: String physicalPath = filePath.replace("/images/item", itemImgLocation) ...
        // new File(physicalPath).delete();
    }
}
