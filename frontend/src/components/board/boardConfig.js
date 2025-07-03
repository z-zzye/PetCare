// frontend/src/components/board/boardConfig.js

/**
 * 게시판 카테고리별 설정
 * - name: 사용자에게 보여질 게시판 이름
 * - apiPath: 해당 카테고리의 API 엔드포인트
 * - allowedRoles: 글 작성(생성) 가능한 권한 목록
 *   (권한 예시: USER, VET, ADMIN)
 */
export const boardConfig = {
    info: {
      name: "정보게시판",
      apiPath: "/api/boards/info",
      allowedRoles: ["VET", "ADMIN"], // 정보게시판은 수의사, 관리자만 작성 가능
    },
    free: {
      name: "자유게시판",
      apiPath: "/api/boards/free",
      allowedRoles: ["USER", "VET", "ADMIN"], // 모두 작성 가능
    },
    qna: {
      name: "Q&A",
      apiPath: "/api/boards/qna",
      allowedRoles: ["USER", "VET", "ADMIN"], // 모두 작성 가능
    },
    // 추후 산책동행 등 추가 가능
    // walk: {
    //   name: "산책 동행",
    //   apiPath: "/api/boards/walk",
    //   allowedRoles: ["USER", "VET", "ADMIN"],
    // },
  };