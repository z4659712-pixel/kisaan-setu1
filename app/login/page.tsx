"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Sprout } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("farmer");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { role } },
        });
        if (error) throw error;
        if (data.session) {
          setMessage("Account created. A profile is created by the database trigger. Buyer verification, if applicable, must be approved by an administrator.");
        } else {
          setMessage("Check your email to confirm your account, then sign in. A profile is created after registration.");
        }
        setMode("login");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page">
    <section className="auth-card">
      <Link href="/" className="auth-brand"><span><Sprout size={25}/></span><b>Kisaan Setu</b></Link>
      <p className="auth-eyebrow">SMART FARM. FAIR PRICE.</p>
      <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="auth-subtitle">Access market information and farmer-buyer tools.</p>
      <div className="auth-switch">
        <button className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Sign in</button>
        <button className={mode === "signup" ? "selected" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Create account</button>
      </div>
      <form onSubmit={submit} className="auth-form">
        <label>Email address<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>
        <label>Password<input type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
        {mode === "signup" && <label>Account type<select value={role} onChange={e => setRole(e.target.value)}><option value="farmer">Farmer</option><option value="fpo">FPO manager</option><option value="buyer">Buyer (requires admin verification)</option></select></label>}
        <button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      {message && <p className="auth-message" role="status">{message}</p>}
      <p className="auth-foot">Prototype authentication uses Supabase Auth. Do not share your password or secret API keys.</p>
      <Link href="/" className="back-link">← Back to dashboard</Link>
    </section>
  </main>;
}
