import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // if using cookies/sessions
      });
      const data = await res.json();
      if (res.ok) {
        try { localStorage.setItem("user", JSON.stringify(data.user)); } catch {}
        navigate("/"); // redirect to dashboard
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  }
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-container">
          <svg width="400" height="400" viewBox="0 0 455 455" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="227.5" cy="227.5" r="227.5" fill="#006599"/>
            <circle cx="227.5" cy="227.5" r="193.16" fill="white"/>
            <path d="M140.951 127.969H103.529C101.731 127.969 100.336 129.541 100.559 131.325C104.916 166.25 110.493 184.475 140.409 199.412C140.737 199.576 140.96 199.92 140.974 200.287C143.652 269.113 159.348 294.41 207.792 319.334C208.122 319.503 208.339 319.854 208.345 320.224C208.72 342.085 212.142 350.49 220.603 358.677C222.108 360.133 224.402 360.372 226.225 359.342C243.063 349.835 250.854 342.152 260.667 326.754C260.804 326.537 261.027 326.377 261.276 326.314C322.103 310.989 351.749 283.191 355.154 217.855C355.443 212.295 350.922 207.717 345.355 207.717H196.971C196.419 207.717 195.971 207.27 195.971 206.717V200.266C195.971 199.905 196.175 199.567 196.49 199.389C227.118 182.082 235.187 165.952 236.094 131.017C236.138 129.344 234.786 127.969 233.112 127.969H194.117C181.468 129.408 176.981 132.109 169.492 139.042C169.091 139.414 168.466 139.397 168.079 139.011C160.385 131.324 153.186 129.153 140.951 127.969Z" fill="#006599" stroke="#006599"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M122.404 145.896C127.891 167.846 135.441 176.994 159.409 185.221C159.823 185.363 160.107 185.771 160.097 186.209C158.668 248.818 167.643 275.657 211.426 299.212C213.321 290.154 215.979 284.714 221.711 276.047C222.617 274.677 224.154 273.819 225.794 273.911C229.182 274.101 231.328 274.905 233.104 277.394C233.972 278.612 233.941 280.22 233.336 281.587C223.033 304.872 220.204 318.481 226.881 341.868C248.437 322.649 257.667 309.026 265.271 278.607C265.629 277.176 266.595 275.96 267.906 275.284C286.682 265.61 294.092 257.304 301.934 240.201C302.566 238.823 303.767 237.733 305.271 237.538C309.485 236.99 312.31 238.363 314.158 240.635C314.984 241.651 315.084 243.047 314.699 244.299C307.794 266.757 298.019 274.127 279.754 285.41C279.547 285.538 279.389 285.74 279.319 285.973L273.246 306.012C316.319 290.611 329.767 272.824 337.941 228.687C338.054 228.075 337.65 227.497 337.028 227.494C324.343 227.433 208.89 226.881 197.207 226.881C184.926 226.881 174.329 213.763 179.178 187.239C179.239 186.906 179.474 186.618 179.786 186.489C201.451 177.489 210.386 166.82 216.371 145.896C194.456 143.054 183.765 145.743 170.102 162.33C169.722 162.791 169.013 162.825 168.59 162.402C151.826 145.617 141.455 143.004 122.404 145.896Z" fill="white" stroke="white"/>
            <path d="M275.72 197.826C249.188 176.836 294.482 170.145 263.974 150.842C287.219 169.363 240.329 176.307 275.72 197.826Z" fill="#006599"/>
            <path d="M306.123 138.419C288.592 158.327 326.034 180.064 285.612 197.826C313.147 177.467 282.616 164.651 306.123 138.419C306.287 138.233 306.456 138.046 306.631 137.86C306.459 138.047 306.289 138.234 306.123 138.419Z" fill="#006599"/>
            <path d="M278.193 184.844C317.141 155.788 261.502 151.46 275.721 122.405C257.174 153.315 301.067 145.897 278.193 184.844Z" fill="#006599"/>
            <circle cx="276.957" cy="242.955" r="9.2731" fill="#006599"/>
            <ellipse cx="275.102" cy="239.864" rx="7.41848" ry="7.41848" fill="white"/>
          </svg>
          <div className="logo-text">
            <h1>blue52</h1>
            <h3>your neighborhood cafe.</h3>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-title">Sign In</div>

          {error ? (
            <div style={{
              textAlign: "left",
              color: "#b91c1c",
              padding: "8px 12px",
              marginBottom: 12,
              fontSize: ".95rem"
            }}>
              {error}
            </div>
          ) : null}
          
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="login-button" type="submit" disabled={loading}>
            {"Login"}
          </button>

          <Link to="/forgot-password">Forgot Password?</Link>
        </form>
      </div>
    </div>
  );
};

export default Login;
