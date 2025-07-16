package com.petory.controller;

import kr.co.shineware.nlp.komoran.core.Komoran;
import kr.co.shineware.nlp.komoran.constant.DEFAULT_MODEL;
import kr.co.shineware.nlp.komoran.model.KomoranResult;
import kr.co.shineware.nlp.komoran.model.Token;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/nlp")
public class NlpController {
    private final Komoran komoran = new Komoran(DEFAULT_MODEL.FULL);

    @PostMapping("/emergency")
    public String analyzeEmergency(@RequestBody Map<String, String> body) {
        String question = body.get("question");
        if (question == null || question.trim().isEmpty()) {
            return "질문이 비어 있습니다.";
        }
        KomoranResult result = komoran.analyze(question);
        List<Token> tokens = result.getTokenList();

        // 복합 응급상황 답변 처리
        List<String> answers = new ArrayList<>();
        Set<String> found = new HashSet<>();
        class Rule {
            List<String> keywords;
            String answer;
            Rule(List<String> keywords, String answer) { this.keywords = keywords; this.answer = answer; }
        }
        List<Rule> rules = Arrays.asList(
            new Rule(Arrays.asList("응급", "긴급", "위급"), "응급상황 발생 시, 신속하게 동물병원에 연락하거나 가까운 병원으로 이동하세요."),
            new Rule(Arrays.asList("호흡", "곤란", "숨"), "호흡 곤란 시 즉시 동물병원에 연락하세요. 인공호흡이 필요할 수 있습니다."),
            new Rule(Arrays.asList("출혈", "피", "상처"), "출혈 시 깨끗한 천으로 압박 후 병원 방문이 필요합니다. 출혈 부위를 심장보다 높게 유지하세요."),
            new Rule(Arrays.asList("중독", "약물", "독"), "중독이 의심되면 의심되는 물질과 함께 병원에 방문하세요. 억지로 토하게 하지 마세요."),
            new Rule(Arrays.asList("경련", "발작", "떨림"), "경련/발작 시 주변 위험물을 치우고 즉시 병원에 연락하세요. 억지로 입에 손을 넣지 마세요."),
            new Rule(Arrays.asList("이물질", "삼킴", "이물", "목에 걸림"), "이물질을 삼킨 경우 억지로 빼내려 하지 말고 병원에 방문하세요. 기도가 막힌 경우 즉시 응급처치가 필요합니다."),
            new Rule(Arrays.asList("화상", "화재", "데임"), "화상 시 흐르는 찬물로 식히고 병원에 방문하세요. 물집을 터뜨리지 마세요."),
            new Rule(Arrays.asList("탈수", "수분 부족", "건조"), "탈수 증상이 보이면 즉시 물을 제공하고, 심할 경우 병원에 방문하세요."),
            new Rule(Arrays.asList("저체온증", "체온 저하", "춥다"), "저체온증이 의심되면 따뜻하게 감싸고, 서서히 체온을 올리며 병원에 방문하세요."),
            new Rule(Arrays.asList("고열", "열", "체온 상승"), "고열이 의심되면 시원한 곳에 두고, 미지근한 물수건으로 닦아주며 병원에 방문하세요."),
            new Rule(Arrays.asList("구토", "토", "토함"), "구토가 반복되면 금식 후 병원에 방문하세요. 토사물은 병원에 가져가면 진단에 도움이 됩니다."),
            new Rule(Arrays.asList("설사", "묽은 변", "변"), "설사가 지속되면 탈수 위험이 있으니 병원에 방문하세요. 변 상태를 사진으로 기록해두면 도움이 됩니다."),
            new Rule(Arrays.asList("골절", "뼈", "부러"), "골절이 의심되면 부위를 고정하고 움직이지 않게 하며 병원에 방문하세요."),
            new Rule(Arrays.asList("쇼크", "의식 없음", "기절"), "쇼크 증상(의식 없음, 창백함 등)이 보이면 즉시 병원에 방문하세요."),
            new Rule(Arrays.asList("호흡정지", "심정지", "맥박 없음"), "호흡정지/심정지 시 즉시 심폐소생술(CPR)을 시도하고, 병원에 연락하세요."),
            new Rule(Arrays.asList("물림", "동물에 물림", "물다"), "다른 동물에 물린 경우 상처를 깨끗이 씻고, 병원에 방문하세요. 감염 위험이 있습니다."),
            new Rule(Arrays.asList("교통사고", "차에 치임", "차 사고"), "교통사고 시 외상 유무와 상관없이 반드시 병원에 방문하세요. 내출혈 위험이 있습니다.")
        );
        for (Rule rule : rules) {
            boolean matched = tokens.stream().anyMatch(t -> rule.keywords.stream().anyMatch(kw -> t.getMorph().contains(kw)));
            if (matched && !found.contains(rule.answer)) {
                answers.add(rule.answer);
                found.add(rule.answer);
            }
        }
        if (answers.isEmpty()) {
            return "죄송합니다. 해당 응급상황에 대한 답변을 준비 중입니다.";
        }
        return String.join("\n\n", answers);
    }
}
