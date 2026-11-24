// "문의할 때: …"처럼 앞에 이름표가 붙은 문단은 이름표를 굵게 보여 훑어 읽기 쉽게 한다.
export function PolicyParagraph({ text }: { text: string }) {
  const match = /^([^:：]{2,24})(?::\s|：\s?)(.+)$/s.exec(text);
  if (!match || /^https?/.test(match[1])) return <p>{text}</p>;
  return <p><strong>{match[1]}</strong> {match[2]}</p>;
}
