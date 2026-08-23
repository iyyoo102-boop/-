import { NextRequest, NextResponse } from "next/server";

const VALID_SORT_BY = ["publishedAt", "popularity", "relevancy"];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q");
  const sortByParam = params.get("sortBy");
  const from = params.get("from");
  const to = params.get("to");

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "검색어를 입력해주세요." },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: ".env.local 파일에 NEWS_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const sortBy = VALID_SORT_BY.includes(sortByParam ?? "")
    ? sortByParam!
    : "publishedAt";

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", q.trim());
  url.searchParams.set("sortBy", sortBy);
  url.searchParams.set("pageSize", "20");
  if (from) url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);

  const response = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data.message || "뉴스를 불러오지 못했습니다." },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}
