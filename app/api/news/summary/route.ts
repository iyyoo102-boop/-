import { NextResponse } from "next/server";

type Article = {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
  publishedAt: string;
};

export async function GET() {
  const newsApiKey = process.env.NEWS_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!newsApiKey) {
    return NextResponse.json(
      { error: ".env.local 파일에 NEWS_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  if (!geminiApiKey) {
    return NextResponse.json(
      { error: ".env.local 파일에 GEMINI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const headlinesUrl = new URL("https://newsapi.org/v2/top-headlines");
  headlinesUrl.searchParams.set("country", "kr");
  headlinesUrl.searchParams.set("pageSize", "5");

  const headlinesRes = await fetch(headlinesUrl, {
    headers: { "X-Api-Key": newsApiKey },
  });
  const headlinesData = await headlinesRes.json();

  if (!headlinesRes.ok) {
    return NextResponse.json(
      { error: headlinesData.message || "뉴스를 불러오지 못했습니다." },
      { status: headlinesRes.status }
    );
  }

  const articles: Article[] = (headlinesData.articles ?? []).slice(0, 5);

  if (articles.length === 0) {
    return NextResponse.json({ articles: [] });
  }

  const prompt =
    `다음 뉴스 기사 ${articles.length}개를 각각 한국어로 한 문장(50자 이내)으로 요약해줘. ` +
    "기사 순서와 동일한 순서로 요약을 배열에 담아 응답해.\n\n" +
    articles
      .map(
        (a, i) =>
          `${i + 1}. 제목: ${a.title}\n설명: ${a.description ?? "없음"}`
      )
      .join("\n\n");

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: { type: "string" },
          },
        },
      }),
    }
  );

  const geminiData = await geminiRes.json();

  if (!geminiRes.ok) {
    return NextResponse.json(
      { error: geminiData.error?.message || "AI 요약에 실패했습니다." },
      { status: geminiRes.status }
    );
  }

  let summaries: string[] = [];
  try {
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    summaries = JSON.parse(text);
  } catch {
    summaries = [];
  }

  const result = articles.map((a, i) => ({
    title: a.title,
    url: a.url,
    source: a.source?.name,
    publishedAt: a.publishedAt,
    summary: summaries[i] ?? a.description ?? "",
  }));

  return NextResponse.json({ articles: result });
}
