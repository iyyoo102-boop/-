// 강연 신청 내역을 CSV로 내보내는 주소. 구글 시트의 =IMPORTDATA() 가 이 주소를 불러온다.
// 비밀 키(?key=)가 맞을 때만 응답하므로 주소를 모르는 사람은 명단을 볼 수 없다.
import { createClient } from "jsr:@supabase/supabase-js@2";

const HEADERS = ["신청일시", "이름", "휴대폰", "성별", "나이대", "현재직업", "강의신청목적", "개인정보동의", "유입경로"];

function cell(v: unknown): string {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // 시트에서 수식으로 실행되지 않게
  return '"' + s.replace(/"/g, '""').replace(/\r?\n/g, " ") + '"';
}

function kst(iso: string): string {
  // 시트가 숫자로 바꾸지 않도록 "2026년 10월 17일 10:07" 형태의 글자로 보낸다
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // 비밀 키는 seminar_sheet_key 테이블에 저장 (외부에서는 읽을 수 없음)
  const key = new URL(req.url).searchParams.get("key");
  const { data: saved } = await db.from("seminar_sheet_key").select("key").eq("id", 1).single();
  if (!key || !saved || key !== saved.key) {
    return new Response("forbidden", { status: 403 });
  }

  const { data, error } = await db
    .from("seminar_applications")
    .select("created_at,name,phone,gender,age,job,purpose,agree,source")
    .or("source.is.null,source.neq.test") // 연동 시험용 신청은 시트에 보내지 않는다
    .order("id", { ascending: true });
  if (error) return new Response("error", { status: 500 });

  const lines = [HEADERS.map(cell).join(",")];
  for (const r of data) {
    lines.push([kst(r.created_at), r.name, r.phone, r.gender, r.age, r.job, r.purpose, r.agree, r.source].map(cell).join(","));
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" },
  });
});
