import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { AuthShell } from "./auth-shell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../providers/auth-provider";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => {
    let score = 0;
    if (form.password.length >= 8) score += 1;
    if (/[A-Z]/.test(form.password)) score += 1;
    if (/[a-z]/.test(form.password)) score += 1;
    if (/\d/.test(form.password)) score += 1;
    return score;
  }, [form.password]);
  const passwordRequirements = [
    { label: "อย่างน้อย 8 ตัวอักษร", valid: form.password.length >= 8 },
    { label: "มีตัวพิมพ์ใหญ่ A-Z", valid: /[A-Z]/.test(form.password) },
    { label: "มีตัวพิมพ์เล็ก a-z", valid: /[a-z]/.test(form.password) },
    { label: "มีตัวเลข 0-9", valid: /\d/.test(form.password) }
  ];
  const isPasswordStrong = passwordRequirements.every((requirement) => requirement.valid);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="สมัครสมาชิก" subtitle="สร้างโปรไฟล์สำหรับบันทึกบทสนทนา สถานที่โปรด และการตั้งค่าการใช้งานของคุณ">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label>Username</Label>
          <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required minLength={3} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} />
          <div className="grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className={`h-1 rounded-full ${index < strength ? "bg-primary" : "bg-slate-200"}`} />
            ))}
          </div>
          {form.password && !isPasswordStrong && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              <p className="font-semibold">ยังสมัครไม่ได้ เพราะรหัสผ่านต้องมี:</p>
              <ul className="mt-1 list-inside list-disc">
                {passwordRequirements
                  .filter((requirement) => !requirement.valid)
                  .map((requirement) => (
                    <li key={requirement.label}>{requirement.label}</li>
                  ))}
              </ul>
              <p className="mt-1">ตัวอย่างที่ใช้ได้: Test1234</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Confirm Password</Label>
          <Input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button className="w-full" disabled={loading || !isPasswordStrong}>
          <UserPlus size={18} />
          {loading ? "กำลังสร้างบัญชี..." : "Register"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        มีบัญชีอยู่แล้ว? <Link className="font-bold text-primary" to="/login">Login</Link>
      </p>
    </AuthShell>
  );
}
