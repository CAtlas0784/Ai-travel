import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, LogIn } from "lucide-react";
import { AuthShell } from "./auth-shell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../providers/auth-provider";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, remember);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="เข้าสู่ระบบ" subtitle="เริ่มวางแผนเที่ยวอุทัยธานีด้วยผู้ช่วย AI ที่ตอบเป็นภาษาไทยและจัดเส้นทางให้เหมาะกับคุณ">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Input type={show ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" className="absolute right-3 top-3 text-slate-400" onClick={() => setShow((value) => !value)} aria-label="Toggle password">
              <Eye size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded accent-primary" />
            Remember me
          </label>
          <button type="button" className="font-semibold text-primary">Forgot password?</button>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button className="w-full" disabled={loading}>
          <LogIn size={18} />
          {loading ? "กำลังเข้าสู่ระบบ..." : "Login"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        ยังไม่มีบัญชี? <Link className="font-bold text-primary" to="/register">Register</Link>
      </p>
    </AuthShell>
  );
}
