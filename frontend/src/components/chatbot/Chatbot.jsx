import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../api/axios";
import "../css/ChatRoomListPopup.css";
import ChatPage from "../chat/ChatPage";
import "./Chatbot.css";

const initialMessages = [
  {
    sender: "bot",
    text: `안녕하세요! Q&A 챗봇입니다.\n\n아래에서 원하는 메뉴를 선택해 주세요.`,
    type: "menu"
  },
];

const animalGuideRules = [
  {
    keywords: ["강아지", "개", "견"],
    answer: "강아지 기본 가이드를 다운로드할 수 있습니다.",
    pdfUrl: "/pdf/guide/dog"
  },
  {
    keywords: ["고양이", "묘", "캣"],
    answer: "고양이 기본 가이드를 다운로드할 수 있습니다.",
    pdfUrl: "/pdf/guide/cat"
  },
];

const emergencyKeywords = [
  "응급", "호흡", "곤란", "출혈", "피", "중독", "경련", "발작", "이물질", "삼킴", "화상", "화재", "탈수", "저체온증", "고열", "구토", "설사", "골절", "쇼크", "호흡정지", "심정지", "물림", "교통사고", "부러", "뼈"
];

const faqList = [
  {
    question: "회원가입은 어떻게 하나요?",
    answer: "상단 메뉴의 '회원가입' 버튼을 클릭한 후, 필수 정보를 입력하고 약관에 동의하면 회원가입이 완료됩니다.",
  },
  {
    question: "이메일 인증이 안 와요. 어떻게 하나요?",
    answer: "스팸메일함을 확인해 주세요. 그래도 메일이 오지 않으면, 회원가입 화면에서 '인증메일 재발송'을 눌러주세요.",
  },
  {
    question: "비밀번호를 잊어버렸어요. 어떻게 찾나요?",
    answer: "로그인 화면의 '비밀번호 찾기'를 클릭한 후, 가입한 이메일을 입력하면 임시 비밀번호가 발송됩니다.",
  },
  {
    question: "회원정보(닉네임, 연락처 등) 수정은 어디서 하나요?",
    answer: "로그인 후 마이페이지에서 닉네임, 연락처 등 회원정보를 수정할 수 있습니다.",
  },
  {
    question: "회원탈퇴는 어떻게 하나요?",
    answer: "마이페이지 하단의 '회원탈퇴' 메뉴에서 본인 확인 후 탈퇴할 수 있습니다. 탈퇴 시 모든 정보가 삭제됩니다.",
  },
  {
    question: "소셜 계정(카카오, 네이버 등)으로도 가입할 수 있나요?",
    answer: "네, 로그인/회원가입 화면에서 카카오, 네이버, 구글 등 소셜 계정 버튼을 클릭해 간편하게 가입할 수 있습니다.",
  },
  {
    question: "반려동물 등록은 어떻게 하나요?",
    answer: "동물병원이나 시/군/구청에서 반려동물 등록이 가능합니다. 등록 후 등록증을 꼭 보관하세요.",
  },
  {
    question: "강아지 예방접종은 언제 해야 하나요?",
    answer: "생후 6~8주부터 시작해 3~4주 간격으로 3~4회 접종이 필요합니다. 이후 매년 추가접종을 권장합니다.",
  },
  {
    question: "고양이 중성화 수술은 언제가 적기인가요?",
    answer: "생후 5~6개월령에 중성화 수술을 권장합니다. 건강 상태에 따라 수의사와 상담하세요.",
  },
  {
    question: "반려동물 미용은 얼마나 자주 해야 하나요?",
    answer: "견종, 모질에 따라 다르지만 보통 1~2개월에 한 번 미용을 권장합니다.",
  },
  {
    question: "사료는 어떻게 선택해야 하나요?",
    answer: "연령, 건강상태, 기호성에 맞는 사료를 선택하세요. 수의사와 상담하면 더욱 좋습니다.",
  },
  {
    question: "강아지가 자꾸 짖어요. 어떻게 해야 하나요?",
    answer: "짖는 원인을 파악하고, 충분한 산책과 놀이, 긍정적 훈련을 병행하세요.",
  },
  {
    question: "고양이가 밥을 안 먹어요. 어떻게 해야 하나요?",
    answer: "식욕부진이 지속되면 건강 이상일 수 있으니 동물병원 진료를 권장합니다.",
  },
  // 추가 FAQ 가능
];

function getAnimalGuideAnswer(userInput) {
  const lower = userInput.toLowerCase();
  for (const rule of animalGuideRules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule;
    }
  }
  return { answer: "죄송합니다. 해당 동물에 대한 기본 가이드는 준비 중입니다." };
}

const downloadPdf = async (pdfUrl) => {
  try {
    const response = await axiosInstance.get(pdfUrl, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', pdfUrl.includes('dog') ? 'BasicGuide(Dog).pdf' : 'BasicGuide(Cat).pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF 다운로드 실패:', error);
    alert('PDF 다운로드에 실패했습니다.');
  }
};

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // null, 'animal', 'emergency', 'faq', 'faq_answer'
  const [awaitingAnimal, setAwaitingAnimal] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [showMenuButtons, setShowMenuButtons] = useState(true);
  const [showAdminChatModal, setShowAdminChatModal] = useState(false);
  const messagesEndRef = useRef(null);

  // 스크롤을 최하단으로 이동시키는 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지가 추가될 때마다 스크롤을 최하단으로 이동
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const resetToMenu = () => {
    setMessages([{
      sender: "bot",
      text: `안녕하세요! Q&A 챗봇입니다.\n\n아래에서 원하는 메뉴를 선택해 주세요.`,
      type: "menu"
    }]);
    setInput("");
    setMode(null);
    setAwaitingAnimal(false);
    setSelectedFaq(null);
    setShowMenuButtons(true);
  };

  const handleMenuClick = (selected) => {
    setShowMenuButtons(false);
    if (selected === 1) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "기르시는 반려동물은 어떤 동물인가요? (강아지 or 고양이 )" },
      ]);
      setMode("animal");
      setAwaitingAnimal(true);
    } else if (selected === 2) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "응급상황에 대해 궁금한 점을 입력해 주세요." },
      ]);
      setMode("emergency");
      setAwaitingAnimal(false);
    } else if (selected === 3) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "많이 묻는 질문입니다. 궁금한 항목을 선택해 주세요.", type: "faq_menu" },
      ]);
      setMode("faq");
      setAwaitingAnimal(false);
    }
  };

  // 복합 응급상황 답변 생성 함수
  const getEmergencyAnswers = (tokens) => {
    const rules = [
      { keywords: ["응급", "긴급", "위급"], answer: "응급상황 발생 시, 신속하게 동물병원에 연락하거나 가까운 병원으로 이동하세요." },
      { keywords: ["호흡", "곤란", "숨"], answer: "호흡 곤란 시 즉시 동물병원에 연락하세요. 인공호흡이 필요할 수 있습니다." },
      { keywords: ["출혈", "피", "상처"], answer: "출혈 시 깨끗한 천으로 압박 후 병원 방문이 필요합니다. 출혈 부위를 심장보다 높게 유지하세요." },
      { keywords: ["중독", "약물", "독"], answer: "중독이 의심되면 의심되는 물질과 함께 병원에 방문하세요. 억지로 토하게 하지 마세요." },
      { keywords: ["경련", "발작", "떨림"], answer: "경련/발작 시 주변 위험물을 치우고 즉시 병원에 연락하세요. 억지로 입에 손을 넣지 마세요." },
      { keywords: ["이물질", "삼킴", "이물", "목에 걸림"], answer: "이물질을 삼킨 경우 억지로 빼내려 하지 말고 병원에 방문하세요. 기도가 막힌 경우 즉시 응급처치가 필요합니다." },
      { keywords: ["화상", "화재", "데임"], answer: "화상 시 흐르는 찬물로 식히고 병원에 방문하세요. 물집을 터뜨리지 마세요." },
      { keywords: ["탈수", "수분 부족", "건조"], answer: "탈수 증상이 보이면 즉시 물을 제공하고, 심할 경우 병원에 방문하세요." },
      { keywords: ["저체온증", "체온 저하", "춥다"], answer: "저체온증이 의심되면 따뜻하게 감싸고, 서서히 체온을 올리며 병원에 방문하세요." },
      { keywords: ["고열", "열", "체온 상승"], answer: "고열이 의심되면 시원한 곳에 두고, 미지근한 물수건으로 닦아주며 병원에 방문하세요." },
      { keywords: ["구토", "토", "토함"], answer: "구토가 반복되면 금식 후 병원에 방문하세요. 토사물은 병원에 가져가면 진단에 도움이 됩니다." },
      { keywords: ["설사", "묽은 변", "변"], answer: "설사가 지속되면 탈수 위험이 있으니 병원에 방문하세요. 변 상태를 사진으로 기록해두면 도움이 됩니다." },
      { keywords: ["골절", "뼈", "부러"], answer: "골절이 의심되면 부위를 고정하고 움직이지 않게 하며 병원에 방문하세요." },
      { keywords: ["쇼크", "의식 없음", "기절"], answer: "쇼크 증상(의식 없음, 창백함 등)이 보이면 즉시 병원에 방문하세요." },
      { keywords: ["호흡정지", "심정지", "맥박 없음"], answer: "호흡정지/심정지 시 즉시 심폐소생술(CPR)을 시도하고, 병원에 연락하세요." },
      { keywords: ["물림", "동물에 물림", "물다"], answer: "다른 동물에 물린 경우 상처를 깨끗이 씻고, 병원에 방문하세요. 감염 위험이 있습니다." },
      { keywords: ["교통사고", "차에 치임", "차 사고"], answer: "교통사고 시 외상 유무와 상관없이 반드시 병원에 방문하세요. 내출혈 위험이 있습니다." },
    ];
    const found = new Set();
    const answers = [];
    for (const rule of rules) {
      if (tokens.some(t => rule.keywords.some(kw => t.getMorph().includes(kw)))) {
        if (!found.has(rule.answer)) {
          answers.push(rule.answer);
          found.add(rule.answer);
        }
      }
    }
    return answers.length > 0 ? answers.join("\n\n") : "죄송합니다. 해당 응급상황에 대한 답변을 준비 중입니다.";
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");

    if (mode === "animal" && awaitingAnimal) {
      const guideInfo = getAnimalGuideAnswer(input);
      if (guideInfo.pdfUrl) {
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "bot",
            text: guideInfo.answer,
            type: "pdf_download",
            pdfUrl: guideInfo.pdfUrl
          },
          { sender: "bot", type: "guide_with_btn", text: "버튼을 눌러 처음 선택지로 돌아가실 수 있습니다.", buttons: ["reset_btn"] },
        ]);
      } else {
        setMessages((msgs) => [
          ...msgs,
          { sender: "bot", text: guideInfo.answer },
          { sender: "bot", type: "guide_with_btn", text: "버튼을 눌러 처음 선택지로 돌아가실 수 있습니다.", buttons: ["reset_btn"] },
        ]);
      }
      setAwaitingAnimal(false);
      return;
    }

    if (mode === "emergency") {
      setLoading(true);
      try {
        const res = await axiosInstance.post("/nlp/emergency", { question: input });
        let answer = res.data;
        setMessages((msgs) => [
          ...msgs,
          { sender: "bot", text: answer },
          { sender: "bot", type: "guide_with_btn", text: "버튼을 눌러 처음 선택지로 돌아가시거나 계속 질문을 해주세요.", buttons: ["reset_btn"] },
        ]);
      } catch (e) {
        setMessages((msgs) => [
          ...msgs,
          { sender: "bot", text: "서버 오류로 답변을 받을 수 없습니다." },
          { sender: "bot", type: "guide_with_btn", text: "버튼을 눌러 처음 선택지로 돌아가시거나 계속 질문을 해주세요.", buttons: ["reset_btn"] },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // 메뉴 버튼 메시지 렌더링
  const renderMenuButtons = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
      <button onClick={() => handleMenuClick(1)} className="chatbot-btn">1. 반려동물 기본 가이드</button>
      <button onClick={() => handleMenuClick(2)} className="chatbot-btn">2. 반려동물 응급사항 대처 가이드</button>
      <button onClick={() => handleMenuClick(3)} className="chatbot-btn">3. 많이 묻는 질문</button>
    </div>
  );

  // FAQ 메뉴 렌더링
  const renderFaqMenu = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
      {faqList.map((faq, idx) => (
        <button key={idx} onClick={() => handleFaqClick(idx)} style={{ textAlign: "left", padding: 12, borderRadius: 12, background: "#f1f1f1", color: "#222", border: "1.5px solid #1976d2", fontWeight: "bold", fontSize: 15 }}>{faq.question}</button>
      ))}
    </div>
  );

  const handleFaqClick = (idx) => {
    setSelectedFaq(idx);
    setMode("faq_answer");
    setMessages((msgs) => [
      ...msgs,
      { sender: "bot", text: faqList[idx].answer },
      { sender: "bot", type: "guide_with_btn", text: "버튼을 눌러 처음 선택지로 돌아가시거나 관리자에게 문의하실 수 있습니다.", buttons: ["reset_btn", "contact_btn"] },
    ]);
  };

  // 버튼 메시지 클릭 핸들러
  const handleBotButtonClick = (type) => {
    if (type === "reset_btn") {
      resetToMenu();
    } else if (type === "contact_btn") {
      setShowAdminChatModal(true);
    }
  };

  // 버튼형 메시지 렌더링 (기본 메뉴 버튼과 동일 스타일)
  const renderBotButton = (type) => {
    if (type === "reset_btn") {
      return (
        <button onClick={() => handleBotButtonClick("reset_btn")} className="chatbot-btn">처음으로</button>
      );
    }
    if (type === "contact_btn") {
      return (
        <button onClick={() => handleBotButtonClick("contact_btn")} className="chatbot-btn contact">관리자에게 문의하기</button>
      );
    }
    return null;
  };

  // PDF 다운로드 버튼 렌더링
  const renderPdfDownloadButton = (pdfUrl) => {
    return (
      <button
        onClick={() => downloadPdf(pdfUrl)}
        className="chatbot-btn"
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          marginTop: '8px'
        }}
      >
        📄 PDF 다운로드
      </button>
    );
  };

  // 안내문구+버튼 메시지 박스 렌더링 (응급상황, FAQ 등에서 사용)
  const renderGuideWithButton = (msg, buttonTypes) => (
    <div>
      <div style={{ marginBottom: 8 }}>{msg.text && msg.text.split("\n").map((line, i) => <div key={i}>{line}</div>)}</div>
      {buttonTypes.map((type) => renderBotButton(type))}
    </div>
  );

  return (
    <>
      <div className="chatbot-popup">
        <div className="chatbot-header">
          <span>Q&A 챗봇</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#fff" }} aria-label="챗봇 닫기">×</button>
        </div>
        <div className="chatbot-messages">
          {messages.map((msg, idx) => (
            <div key={idx} style={{ textAlign: msg.sender === "bot" ? "left" : "right" }}>
              <div className={"chat-bubble" + (msg.sender === "user" ? " user" : "") }>
                {msg.type === "guide_with_btn"
                  ? renderGuideWithButton(msg, msg.buttons)
                  : msg.type === "pdf_download"
                    ? (
                        <div>
                          <div>{msg.text && msg.text.split("\n").map((line, i) => <div key={i}>{line}</div>)}</div>
                          {renderPdfDownloadButton(msg.pdfUrl)}
                        </div>
                      )
                  : msg.type === "menu" && showMenuButtons
                    ? renderMenuButtons()
                    : msg.text && msg.text.split("\n").map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </div>
          ))}
          {messages[messages.length - 1]?.type === "faq_menu" && renderFaqMenu()}
          {loading && <div style={{ color: '#888', fontSize: 14, marginTop: 8 }}>답변을 불러오는 중...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="chatbot-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === "animal" && awaitingAnimal ? "반려동물 종류를 입력하세요..." : "질문을 입력하세요..."}
            className="chatbot-input"
            disabled={loading || (mode === null && !selectedFaq)}
          />
          <button onClick={handleSend} className="chatbot-send-btn" disabled={loading || (mode === null && !selectedFaq)}>
            전송
          </button>
        </div>
      </div>
      {/* 관리자 채팅 모달 */}
      {showAdminChatModal && (
        <div className="chatroom-popup-overlay" style={{ zIndex: 2000 }} onClick={() => setShowAdminChatModal(false)}>
          <div className="chatroom-popup" onClick={e => e.stopPropagation()}>
            <button className="chatroom-popup-close" onClick={() => setShowAdminChatModal(false)}>×</button>
            <ChatPage receiverId={1} />
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
