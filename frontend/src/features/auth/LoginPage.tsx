import { FormEvent, useState } from "react";
import { ArrowRight, Building2, Lock, UserRound } from "lucide-react";
import { adminLogin, studentLogin } from "../../lib/api";
import { saveTokens } from "../../lib/storage";

type LoginPageProps = {
  onLogin: (token: string) => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [registrationNumber, setRegistrationNumber] = useState("22CSE001");
  const [email, setEmail] = useState("admin@example.edu");
  const [password, setPassword] = useState("Password@123");
  const [mode, setMode] = useState<"STUDENT" | "ADMIN">("STUDENT");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = mode === "STUDENT"
        ? await studentLogin({ registrationNumber, password })
        : await adminLogin({ email, password });
      saveTokens(response.data.tokens);
      onLogin(response.data.tokens.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Hostel allocation overview">
        <div className="brand-mark">
          <Building2 size={28} />
        </div>
        <div className="login-copy">
          <p className="eyebrow">College Hostel Counseling</p>
          <h1>Hostel Allocation</h1>
          <p>
            Rank-aware room selection, live availability, and structured
            counseling for students.
          </p>
        </div>
        <div className="login-stats" aria-label="Platform highlights">
          <div>
            <strong>45</strong>
            <span>Rooms seeded</span>
          </div>
          <div>
            <strong>5</strong>
            <span>Categories</span>
          </div>
          <div>
            <strong>CGPA</strong>
            <span>Priority ranking</span>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-label="Student login">
        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <p className="eyebrow">{mode === "STUDENT" ? "Student Portal" : "Admin Portal"}</p>
            <h2>Sign in</h2>
          </div>

          <div className="login-toggle">
            <button className={mode === "STUDENT" ? "is-selected" : ""} onClick={() => setMode("STUDENT")} type="button">
              Student
            </button>
            <button className={mode === "ADMIN" ? "is-selected" : ""} onClick={() => setMode("ADMIN")} type="button">
              Admin
            </button>
          </div>

          {mode === "STUDENT" ? (
            <label className="field">
              <span>Registration number</span>
              <div className="input-shell">
                <UserRound size={18} />
                <input
                  value={registrationNumber}
                  onChange={(event) => setRegistrationNumber(event.target.value)}
                  placeholder="22CSE001"
                  autoComplete="username"
                />
              </div>
            </label>
          ) : (
            <label className="field">
              <span>Admin email</span>
              <div className="input-shell">
                <UserRound size={18} />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.edu"
                  autoComplete="username"
                />
              </div>
            </label>
          )}

          <label className="field">
            <span>Password</span>
            <div className="input-shell">
              <Lock size={18} />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type="password"
                autoComplete="current-password"
              />
            </div>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" disabled={isSubmitting} type="submit">
            <span>{isSubmitting ? "Signing in" : "Continue"}</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}
