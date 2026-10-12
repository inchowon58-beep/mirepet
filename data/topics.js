import { cats } from "./cats.js";
import { dogs } from "./dogs.js";
import { extras } from "./extra.js";
import { services } from "./services.js";

const cluster = {
  강아지보호소: ["유기견보호소", "유기동물보호소", "유기견보호센터", "강아지파양", "강아지입양보내기"],
  고양이보호소: ["유기묘보호소", "유기묘보호센터", "고양이파양", "고양이입양보내기", "유기동물보호소"],
  강아지파양: ["강아지입양보내기", "유기견보호소", "유기견보호센터", "강아지보호소"],
  고양이파양: ["고양이입양보내기", "유기묘보호소", "유기묘보호센터", "고양이보호소"],
};

for (const topic of services) {
  if (cluster[topic.keyword]) topic.related = cluster[topic.keyword];
}

export const topics = [...dogs, ...cats, ...services, ...extras];

export const topicByKeyword = new Map(topics.map((topic) => [topic.keyword, topic]));

export function topicsInGroup(group) {
  return topics.filter((topic) => topic.group === group);
}
