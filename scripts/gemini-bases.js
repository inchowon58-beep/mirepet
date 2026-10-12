import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { topics } from "../data/topics.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFile = path.join(root, "data", "gemini-bases.json");
const key = process.env.GEMINI_API_KEY || "";
const model = "gemini-3.8-flash";

if (!key) {
  console.error("GEMINI_API_KEY가 필요합니다.");
  process.exit(1);
}

const banned = /봉사|후원|기부|안락사|자원봉사|모금/;

function facts(topic) {
  const lines = [];
  if (topic.summary) lines.push(topic.summary);
  for (const group of Object.values(topic.slots || {})) {
    for (const line of group.slice(0, 2)) lines.push(line);
  }
  return lines.join("\n");
}

function rules(topic) {
  const common = [
    "글을 읽은 사람이 전화 상담을 할지 판단할 수 있게 설득하고 정보를 주세요.",
    "페이지를 채우기 위한 추상적인 약속, 브랜드 자랑, 검색어 나열은 넣지 마세요.",
    "문장 끝은 ~해요, ~하세요, ~합니다, ~입니다를 자연스럽게 섞으세요.",
    "전화는 0505-464-1004 입니다. 진단, 약 용량, 확정 가격은 말하지 마세요.",
    "지역 이름은 쓰지 말고, 필요할 때만 {place} 자리표시자를 한 문단에 한 번만 쓰세요.",
  ];
  if (topic.group === "dog" || topic.group === "cat") {
    common.push(
      `${topic.name}무료분양 문장을 반드시 포함하세요. 무료분양은 개인 사정으로 더 이상 키울 수 없어 파양된 같은 종류를 판매 대금 없이 새 가정에 연결하는 상담입니다. 모든 아이가 무료라고 단정하지 말고, 가능 여부는 전화로 확인한다고 쓰세요.`,
      "털, 크기, 운동, 건강에서 실제로 확인해야 할 점을 구체적으로 쓰세요.",
    );
  }
  if (topic.group === "shelter" || topic.group === "rehome") {
    common.push(
      "보호소 무료분양은 개인 사정으로 키울 수 없어 파양된 아이를 새 가정에 분양하는 것입니다.",
      "강아지파양·고양이파양은 군 입대, 이사, 이민, 보호자 부재처럼 피치 못할 사정으로 더 함께하기 어려울 때, 혼자가 아니라 같이 상의하고 고민하는 글입니다. 그다음 우리한테 오면 새 가족을 만나 다시 입양될 때까지 정성껏 돌본다고 쓰세요.",
      "봉사활동, 후원, 기부, 모금, 안락사, 자원봉사라는 단어는 절대 쓰지 마세요.",
      "길거리 유기 구조나 캠페인 이야기로 포장하지 마세요.",
    );
  }
  if (topic.keyword === "애견미용학원국비지원") {
    common.push(
      "제목과 본문에 애견미용학원국비지원을 자연스럽게 넣으세요. 지역 이름 뒤에 국비지원이 붙는 검색을 의식하세요.",
      "주말반, 평일반, 야간반, 내일배움카드를 실제로 비교하는 정보로 넣으세요.",
      "국비지원은 모든 수강생에게 확정이라고 쓰지 말고, 과정과 카드 발급, 출석 조건에 따라 달라 전화로 확인한다고 쓰세요.",
      "기초·안전, 클리핑·가위컷, 배스·드라이, 푸들·말티즈·비숑·리트리버, 애견미용사자격증, 취업·창업, 애견미용학원비용, 강아지미용학원, 애견미용배우기를 정보로 설명하세요.",
      "특정 도로명 주소와 확정 수강료는 만들지 마세요.",
    );
  }
  return common.join("\n");
}

function promptFor(topic) {
  return `너는 반려동물 상담 글을 쓰는 에디터다. 아래 사실만 바탕으로 고객에게 말하듯 써라. 없는 가격, 주소, 병원 이름은 만들지 마라.

키워드: ${topic.keyword}
이름: ${topic.name}
구분: ${topic.group}

사실:
${facts(topic)}

규칙:
${rules(topic)}

JSON만 출력:
{
  "summary": "두 문장",
  "lead": ["서로 다른 도입 문단 3개. 각 2문장"],
  "blocks": [
    {"title": "고객이 바로 이해하는 소제목", "paragraphs": ["같은 정보의 다른 표현 A", "같은 정보의 다른 표현 B"]},
    {"title": "...", "paragraphs": ["A", "B"]},
    {"title": "...", "paragraphs": ["A", "B"]},
    {"title": "...", "paragraphs": ["A", "B"]}
  ],
  "cares": ["준비 또는 관리 문장 4개"],
  "faqs": [{"q": "고객 질문", "a": "답"}, {"q": "...", "a": "..."}, {"q": "...", "a": "..."}, {"q": "...", "a": "..."}]
}`;
}

async function callGemini(topic) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptFor(topic) }] }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("JSON 없음");
  const parsed = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(parsed.lead) || parsed.lead.length < 2) throw new Error("lead 부족");
  if (!Array.isArray(parsed.blocks) || parsed.blocks.length < 3) throw new Error("blocks 부족");
  if ((topic.group === "shelter" || topic.group === "rehome") && banned.test(JSON.stringify(parsed))) {
    throw new Error("금지 표현");
  }
  return parsed;
}

function loadCache() {
  if (!fs.existsSync(outFile)) return {};
  return JSON.parse(fs.readFileSync(outFile, "utf8"));
}

const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const selected = only ? topics.filter((topic) => topic.keyword === only) : topics;
const cache = loadCache();

for (const topic of selected) {
  if (cache[topic.keyword] && !only) {
    console.log("skip", topic.keyword);
    continue;
  }
  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      cache[topic.keyword] = await callGemini(topic);
      fs.writeFileSync(outFile, JSON.stringify(cache));
      console.log("ok", topic.keyword);
      lastError = "";
      break;
    } catch (error) {
      lastError = error.message;
      console.log("retry", topic.keyword, attempt, lastError.slice(0, 180));
      await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
    }
  }
  if (lastError) console.log("fail", topic.keyword, lastError.slice(0, 180));
}

console.log("saved", Object.keys(cache).length);
