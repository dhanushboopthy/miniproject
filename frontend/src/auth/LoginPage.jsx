import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login, fetchMe } from "../api/authApi.js";
import { useAuthStore } from "./useAuth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const data = await login({ email, password });
      setAccessToken(data.access_token);
      const me = await fetchMe();
      setUser(me);
      navigate("/");
    } catch (err) {
      setError("Login failed. Check your credentials.");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="badge">Welcome back</div>
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">
          Access growth monitoring, alerts, and reports in one place.
        </p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button type="submit">Sign in</button>
        </form>
        {error ? <p className="text-muted">{error}</p> : null}
        <p className="text-muted">
          Need an account? <Link className="link" to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
