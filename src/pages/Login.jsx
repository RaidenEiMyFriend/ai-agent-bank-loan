import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/"); // ✅ chuyển về Home
      } else {
        setError(data.error || "Đăng nhập thất bại.");
      }
    } catch (err) {
      setError("Lỗi kết nối đến server.");
    }
  };

  return (
    <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f0f2f5"
    }}>
        <div style={{
        padding: 32,
        borderRadius: 12,
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        width: 360
        }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Đăng nhập</h2>

        <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 16,
            border: "1px solid #ccc",
            borderRadius: 8
            }}
        />

        <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 16,
            border: "1px solid #ccc",
            borderRadius: 8
            }}
        />

        <button
            onClick={handleLogin}
            style={{
            width: "100%",
            padding: "10px",
            background: "#4a90e2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
            }}
        >
            Đăng nhập
        </button>

        {error && (
            <p style={{ color: "red", marginTop: 16, textAlign: "center" }}>{error}</p>
        )}
        </div>
    </div>
    );
}
