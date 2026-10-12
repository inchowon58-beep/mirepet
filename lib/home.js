import { site } from "../site.config.js";
import { imageUrl } from "../data/media.js";
import { escapeHtml } from "./util.js";
import { absUrl, shell } from "./layout.js";

const NOTES = [
  ["아파트 발성", "소형견과 스피츠는 체구보다 짖음과 공실 시간이 먼저입니다. 층간 환경을 듣고 견종을 좁힙니다."],
  ["털의 현실", "무탈모와 알레르기 프리는 약속하지 않습니다. 이중모, 컬, 장모의 실제 주기를 나눠 설명합니다."],
  ["보호소 무료분양", "개인 사정으로 더 이상 키울 수 없어 파양된 아이를 새 가정에 연결합니다. 판매 대금 없이 상담하고, 건강과 성격은 사실대로 알려 드립니다."],
  ["파양 상담", "군 입대, 이사, 이민, 보호자의 부재처럼 피치 못할 사정이라면 같이 고민합니다. 오시면 새 가족을 만날 때까지 아이를 정성껏 돌봅니다."],
  ["애견미용학원", "주말반, 평일반, 야간반과 국비지원·내일배움카드 가능 여부를 실습 횟수와 함께 안내합니다."],
  ["병원과 야간", "전화로 병명을 말하지 않습니다. 호흡 곤란, 경련, 출혈은 상담보다 진료가 먼저입니다."],
  ["호텔 위탁", "접종, 합사 여부, 약 복용, 비상 연락을 맡기기 전에 확인합니다."],
];

export function renderHome(topics) {
  const dogs = topics.filter((topic) => topic.group === "dog");
  const cats = topics.filter((topic) => topic.group === "cat");
  const services = topics.filter((topic) => !["dog", "cat"].includes(topic.group));
  const hero = imageUrl("doodle", 2);
  const cards = [
    ["견종·묘종", "포메라니안부터 랙돌까지, 크기와 털, 공실 시간을 기준으로 비교합니다.", imageUrl("pome", 4)],
    ["보호소", "강아지보호소와 고양이보호소는 사진보다 이력과 적응을 먼저 봅니다.", imageUrl("dogboho", 3)],
    ["호텔·병원", "애견호텔 준비물과 24시 내원 신호를 같은 창구에서 구분합니다.", imageUrl("maincoon", 5)],
    ["장례·파양", "작별은 서두르지 않고, 파양은 피치 못할 사정을 같이 들은 뒤 새 가족까지 돌봅니다.", imageUrl("catboho", 6)],
  ];
  const breedCard = (topic) => `<a class="breed-card" href="/guide/${topic.keyword}/">
    <img src="${imageUrl(topic.folder, 1)}" alt="${escapeHtml(topic.name)}" loading="lazy" />
    <span>${escapeHtml(topic.en || "")}</span>
    <strong>${escapeHtml(topic.name)}</strong>
    <em>${escapeHtml(topic.keyword)}</em>
  </a>`;
  const serviceCard = (topic) => `<a class="info-card" href="/guide/${topic.keyword}/">
    <span>${escapeHtml(topic.en || "Care")}</span>
    <strong>${escapeHtml(topic.keyword)}</strong>
    <p>${escapeHtml(topic.summary)}</p>
  </a>`;
  const faqs = [
    ["미르펫은 어떤 상담을 하나요?", "강아지분양, 고양이분양, 보호소 입양, 강아지호텔과 애견호텔, 동물병원과 24시동물병원, 강아지장례식장, 강아지·고양이 파양 준비를 전화로 정리합니다."],
    ["지역마다 페이지가 있는 이유는?", "화성, 부산, 제주처럼 주거와 날씨, 이동 거리가 달라 같은 키워드라도 생활 메모를 나눠 두었습니다."],
    ["전화번호는 무엇인가요?", "0505-464-1004입니다. 신청서 없이 생활 환경과 원하는 키워드를 말씀해 주세요."],
    ["진료도 해 주나요?", "진단, 처방, 용량 안내는 하지 않습니다. 급한 증상은 가까운 동물병원이나 24시동물병원으로 먼저 이동하세요."],
    ["파양은 어떤 상담인가요?", "군 입대, 이사, 이민, 보호자가 자리를 비우는 일처럼 더 함께하기 어려운 사정을 같이 듣습니다. 오시면 아이가 새 가족을 만나 다시 입양될 때까지 정성껏 돌봅니다."],
    ["애견미용학원국비지원도 상담되나요?", "주말반, 평일반, 야간반과 실습 횟수, 애견미용사자격증, 내일배움카드 가능 여부를 0505-464-1004에서 과정별로 안내합니다."],
    ["비용은 페이지에 고정되어 있나요?", "아닙니다. 견종, 일정, 포함 항목에 따라 달라 전화에서 현재 기준으로 항목을 나눕니다."],
  ];

  const body = `
    <section class="home-hero">
      <img src="${hero}" alt="미르펫 반려동물 상담" />
      <div class="home-hero-shade"></div>
      <div class="wrap home-hero-copy">
        <p class="eyebrow">${site.nameEn}</p>
        <h1>분양부터 돌봄,<br />병원과 작별까지</h1>
        <p class="lede">강아지·고양이 분양과 무료분양, 파양 입소, 애견호텔, 동물병원, 애견미용학원까지. ${site.name}이 준비할 것과 확인할 점을 전화로 정리합니다.</p>
        <div class="hero-actions">
          <a class="btn clay" href="tel:${site.phoneDigits}">${site.phone}</a>
          <a class="btn ghost" href="/guide/">상담 주제 보기</a>
        </div>
      </div>
    </section>
    <section class="band" id="services">
      <div class="wrap">
        <p class="eyebrow">Services</p>
        <h2>한 번호로 이어지는 여섯 갈래가 아닙니다. 필요한 준비만 나눕니다.</h2>
        <div class="intro-grid">
          ${cards.map(([title, copy, src]) => `<article class="intro-card"><img src="${src}" alt="${escapeHtml(title)}" /><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></div></article>`).join("")}
        </div>
      </div>
    </section>
    <section class="band band-white" id="dogs">
      <div class="wrap">
        <p class="eyebrow">Dogs</p>
        <h2>강아지 종류</h2>
        <p class="section-lead">화이트테리어부터 포메라니안까지. 각 견종 기본 안내를 읽고, 사는 지역 페이지에서 주거와 날씨를 더합니다.</p>
        <div class="breed-grid">${dogs.map(breedCard).join("")}</div>
      </div>
    </section>
    <section class="band" id="cats">
      <div class="wrap">
        <p class="eyebrow">Cats</p>
        <h2>고양이 종류</h2>
        <div class="breed-grid">${cats.map(breedCard).join("")}</div>
      </div>
    </section>
    <section class="band band-white" id="care">
      <div class="wrap">
        <p class="eyebrow">Care desk</p>
        <h2>분양 외의 상담</h2>
        <div class="service-grid">${services.map(serviceCard).join("")}</div>
      </div>
    </section>
    <section class="band">
      <div class="wrap split">
        <div>
          <p class="eyebrow">How</p>
          <h2>상담은 네 단계면 충분합니다.</h2>
        </div>
        <ol class="steps compact">
          <li><span>01</span><div><h3>전화로 상황 듣기</h3><p>${site.phone}에서 지역, 주거, 일정, 키워드를 듣습니다.</p></div></li>
          <li><span>02</span><div><h3>확인 항목 나누기</h3><p>접종, 계약, 합사, 응급 여부를 취향과 섞지 않습니다.</p></div></li>
          <li><span>03</span><div><h3>지역 생활 반영</h3><p>아파트 소음, 더위, 병원까지 거리처럼 동네마다 다른 점을 붙입니다.</p></div></li>
          <li><span>04</span><div><h3>이후 질문</h3><p>적응과 일정 변경도 같은 번호로 이어 받습니다.</p></div></li>
        </ol>
      </div>
    </section>
    <section class="band band-white" id="notes">
      <div class="wrap">
        <p class="eyebrow">Notes</p>
        <h2>상담에서 반복되는 기준</h2>
        <div class="note-grid">
          ${NOTES.map(([title, copy]) => `<article><h3>${title}</h3><p>${copy}</p></article>`).join("")}
        </div>
      </div>
    </section>
    <section class="gallery-strip">
      ${[imageUrl("selti", 4), imageUrl("ragdoll", 3), imageUrl("samoyed", 2), imageUrl("catboho", 8), imageUrl("dogboho", 12), imageUrl("shichu", 2)].map((src, index) => `<img src="${src}" alt="미르펫 갤러리 ${index + 1}" loading="lazy" />`).join("")}
    </section>
    <section class="band" id="faq">
      <div class="wrap narrow">
        <p class="eyebrow">FAQ</p>
        <h2>처음 전화하시기 전에</h2>
        <div class="faq">
          ${faqs.map(([q, a]) => `<article class="faq-item"><button type="button" aria-expanded="false">${escapeHtml(q)}<span>+</span></button><div class="faq-a"><p>${escapeHtml(a)}</p></div></article>`).join("")}
        </div>
      </div>
    </section>
    <section class="contact-band" id="contact">
      <div class="wrap">
        <p class="eyebrow">Contact</p>
        <h2>편안하게 말씀해 주세요.</h2>
        <p>견종, 지역, 호텔 일정, 야간 진료가 급한지부터 들려 주셔도 됩니다.</p>
        <a class="btn clay" href="tel:${site.phoneDigits}">${site.phone}</a>
      </div>
    </section>`;

  return shell({
    title: `강아지분양·고양이분양·보호소·호텔·동물병원 | ${site.name}`,
    description: `${site.name}은 강아지분양, 고양이분양, 보호소, 애견호텔, 동물병원, 24시동물병원, 장례식장과 책임 있는 파양 상담을 ${site.phone}로 안내합니다.`,
    canonical: absUrl("/"),
    image: hero,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: site.name,
        alternateName: site.nameEn,
        url: absUrl("/"),
        telephone: site.phone,
        areaServed: "KR",
        knowsAbout: services.map((topic) => topic.keyword).concat(["강아지분양", "고양이분양"]),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(([name, text]) => ({
          "@type": "Question",
          name,
          acceptedAnswer: { "@type": "Answer", text },
        })),
      },
    ],
    body,
  });
}
