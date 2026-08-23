"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Comment = {
  id: number;
  content: string;
  created_at: string;
};

type PostItemProps = {
  post: {
    id: number;
    category: string;
    title: string;
    content: string;
    created_at: string;
    commentCount: number;
  };
  onCommentAdded: (postId: number) => void;
};

export default function PostItem({ post, onCommentAdded }: PostItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function toggleComments() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    setIsLoadingComments(true);

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    if (!error && data) setComments(data as Comment[]);
    setIsLoadingComments(false);
  }

  async function handleAddComment() {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, content: commentText.trim() })
      .select()
      .single();

    setIsSubmitting(false);

    if (error || !data) {
      alert("댓글 등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    setComments((prev) => [...prev, data as Comment]);
    setCommentText("");
    onCommentAdded(post.id);
  }

  return (
    <div className="post-item">
      <div className="post-top">
        <span className="badge">{post.category}</span>
        <p className="post-title">{post.title}</p>
      </div>
      <div className="post-content">{post.content}</div>
      <div className="post-meta">익명 · {post.created_at.slice(0, 10)}</div>

      <button className="comment-toggle" onClick={toggleComments}>
        댓글 {post.commentCount > 0 ? post.commentCount : ""}{" "}
        {expanded ? "숨기기" : "보기"}
      </button>

      {expanded && (
        <div className="comment-section">
          {isLoadingComments && (
            <div className="comment-empty">불러오는 중...</div>
          )}
          {!isLoadingComments && comments.length === 0 && (
            <div className="comment-empty">아직 댓글이 없습니다.</div>
          )}
          {!isLoadingComments &&
            comments.map((c) => (
              <div className="comment-item" key={c.id}>
                <div className="comment-body">{c.content}</div>
                <div className="comment-meta">
                  익명 · {c.created_at.slice(0, 10)}
                </div>
              </div>
            ))}

          <div className="comment-form">
            <input
              type="text"
              placeholder="댓글을 입력하세요"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddComment();
              }}
            />
            <button
              className="btn"
              onClick={handleAddComment}
              disabled={isSubmitting}
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
