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
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

Deno.serve(async (req) => {
  const key = new URL(req.url).searchParams.get("key");
  if (!key || key !== Deno.env.get("SEMINAR_SHEET_KEY")) {
    return new Response("forbidden", { status: 403 });
  }

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await db
    .from("seminar_applications")
    .select("created_at,name,phone,gender,age,job,purpose,agree,source")
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
