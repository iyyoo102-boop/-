"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PostItem from "./PostItem";

type Category = "관계" | "업무" | "멘탈";

type Post = {
  id: number;
  category: Category;
  title: string;
  content: string;
  created_at: string;
  commentCount: number;
};

const CATEGORIES: Category[] = ["관계", "업무", "멘탈"];

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | "전체">(
    "전체"
  );
  const [isWriting, setIsWriting] = useState(false);
  const [category, setCategory] = useState<Category>("관계");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPosts() {
      const { data, error } = await supabase
        .from("posts")
        .select("*, comments(count)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPosts(
          data.map((post) => ({
            ...post,
            commentCount: post.comments?.[0]?.count ?? 0,
          })) as Post[]
        );
      }
      setIsLoading(false);
    }

    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    if (activeCategory === "전체") return posts;
    return posts.filter((post) => post.category === activeCategory);
  }, [posts, activeCategory]);

  function resetForm() {
    setCategory("관계");
    setTitle("");
    setContent("");
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("posts")
      .insert({ category, title: title.trim(), content: content.trim() })
      .select()
      .single();

    setIsSubmitting(false);

    if (error || !data) {
      alert("등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    setPosts((prev) => [{ ...data, commentCount: 0 } as Post, ...prev]);
    resetForm();
    setIsWriting(false);
  }

  function handleCommentAdded(postId: number) {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, commentCount: post.commentCount + 1 }
          : post
      )
    );
  }

  return (
    <div className="page">
      <header className="header">
        <Link href="/news" className="back-link">
          뉴스 검색 →
        </Link>
        <h1>테스트</h1>
        <p>문의사항을 자유롭게 남겨주세요. 작성자는 모두 익명으로 표시됩니다.</p>
      </header>

      <div className="filters">
        <button
          className={`filter-btn ${activeCategory === "전체" ? "active" : ""}`}
          onClick={() => setActiveCategory("전체")}
        >
          전체
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`filter-btn ${activeCategory === c ? "active" : ""}`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {!isWriting && (
        <button className="write-toggle" onClick={() => setIsWriting(true)}>
          + 새 문의사항 작성하기
        </button>
      )}

      {isWriting && (
        <div className="write-form">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="write-form-actions">
            <button
              className="btn secondary"
              onClick={() => {
                resetForm();
                setIsWriting(false);
              }}
            >
              취소
            </button>
            <button className="btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </div>
      )}

      <div className="post-list">
        {isLoading && <div className="empty">불러오는 중...</div>}
        {!isLoading && filteredPosts.length === 0 && (
          <div className="empty">아직 등록된 글이 없습니다.</div>
        )}
        {!isLoading &&
          filteredPosts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              onCommentAdded={handleCommentAdded}
            />
          ))}
      </div>
    </div>
  );
}
