"use client";

import { useState } from "react";
import Link from "next/link";

type Article = {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
  publishedAt: string;
};

type SortBy = "publishedAt" | "popularity" | "relevancy";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "publishedAt", label: "최신순" },
  { value: "popularity", label: "인기순" },
  { value: "relevancy", label: "관련도순" },
];

export default function NewsSearchPage() {
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("publishedAt");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function runSearch(overrides?: { sortBy?: SortBy }) {
    if (!keyword.trim() || isLoading) return;

    const activeSortBy = overrides?.sortBy ?? sortBy;

    setIsLoading(true);
    setError("");
    setSearched(true);

    const params = new URLSearchParams({
      q: keyword.trim(),
      sortBy: activeSortBy,
    });
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    try {
      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "뉴스를 불러오지 못했습니다.");
        setArticles([]);
      } else {
        setArticles(data.articles ?? []);
      }
    } catch {
      setError("뉴스를 불러오지 못했습니다.");
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSortChange(value: SortBy) {
    setSortBy(value);
    if (searched) runSearch({ sortBy: value });
  }

  return (
    <div className="page">
      <header className="header">
        <Link href="/" className="back-link">
          ← 엘렌 게시판
        </Link>
        <h1>뉴스 검색</h1>
        <p>키워드로 최신 뉴스를 검색해보세요.</p>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder="검색할 키워드를 입력하세요"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
        />
        <button className="btn" onClick={() => runSearch()} disabled={isLoading}>
          {isLoading ? "검색 중..." : "검색"}
        </button>
      </div>

      <div className="filters">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`filter-btn ${sortBy === option.value ? "active" : ""}`}
            onClick={() => handleSortChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="date-filter">
        <label>
          시작일
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>
        <label>
          종료일
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>
      </div>

      {error && <div className="empty">{error}</div>}

      {!error && searched && !isLoading && articles.length === 0 && (
        <div className="empty">검색 결과가 없습니다.</div>
      )}

      <div className="news-list">
        {articles.map((article, index) => (
          <a
            className="news-item"
            key={`${article.url}-${index}`}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <p className="news-title">{article.title}</p>
            {article.description && (
              <p className="news-desc">{article.description}</p>
            )}
            <div className="news-meta">
              {article.source?.name} · {article.publishedAt.slice(0, 10)}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
