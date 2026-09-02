import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { GraduationCap, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, signInWithPassword } from "@/lib/supabase";

export default function Login() {
  const [, navigate] = useLocation();
  const roleAccounts = { teacher: "Lavinia@csps.tn.edu.tw", cingshan: "CINGSHAN@csps.tn.edu.tw", dongyuan: "DONGYUAN@csps.tn.edu.tw" } as const;
  const [selectedRole, setSelectedRole] = useState<keyof typeof roleAccounts>("teacher");
  const email = roleAccounts[selectedRole];
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!isSupabaseConfigured()) {
      setError("Supabase 尚未設定，請先設定 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY。\nSupabase is not configured.");
      return;
    }
    setSubmitting(true);
    const { error: authError } = await signInWithPassword(email, password);
    setSubmitting(false);
    if (authError) {
      setError(authError.message || "登入失敗 · Unable to sign in");
      return;
    }
    navigate("/");
  };

  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff9ed] via-[#f3f8f1] to-[#eef3fb] px-5 py-10 text-[#27352f]"><div aria-hidden="true" className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-[#f7c9b9]/35 blur-2xl" /><div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#c9d9f4]/45 blur-2xl" />
    <Card className="w-full max-w-md border-0 bg-white/90 shadow-[0_20px_60px_rgba(48,75,59,0.12)]">
      <CardHeader className="space-y-5 p-8 pb-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#304b3b] text-white shadow-lg shadow-[#304b3b]/15"><GraduationCap className="h-7 w-7" /></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#87968a]">休假系統 · Leave System</p><CardTitle className="mt-2 text-2xl">登入休假系統</CardTitle><p className="mt-2 text-sm text-[#92978f]">請使用已註冊的 Supabase Auth 帳號登入。</p></div>
      </CardHeader>
      <CardContent className="p-8 pt-3"><form onSubmit={handleSubmit} className="space-y-5">
        <label className="block space-y-2 text-sm font-medium text-[#58655d]">登入身份 · Account<select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as keyof typeof roleAccounts)} className="mt-1 h-11 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm outline-none focus:border-[#78947c] focus:ring-2 focus:ring-[#d8e5d5]"><option value="teacher">外師 · Foreign Teacher</option><option value="cingshan">青山國小 · Cingshan School</option><option value="dongyuan">東原國中 · Dongyuan Junior High</option></select><span className="mt-1 block text-xs font-normal text-[#92978f]">登入信箱：{email}</span></label>
        <label className="block space-y-2 text-sm font-medium text-[#58655d]">密碼 · Password<Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="mt-1 h-11" placeholder="請輸入密碼" /></label>
        {error && <p role="alert" className="whitespace-pre-line rounded-xl border border-[#e1b1a9] bg-[#fff1ed] px-4 py-3 text-sm text-[#a55045]">{error}</p>}
        <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl bg-[#304b3b] hover:bg-[#41644f]"><LogIn className="mr-2 h-4 w-4" />{submitting ? "登入中 · Signing in…" : "登入 · Sign in"}</Button>
      </form></CardContent>
    </Card>
  </main>;
}
