import React, { useState } from "react";
import { Route } from "react-router-dom";

// Simple CSS styles
const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f5f5f5",
    },
    form: {
        background: "#fff",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        minWidth: "300px",
    },
    input: {
        width: "100%",
        padding: "0.75rem",
        margin: "0.5rem 0",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontSize: "1rem",
    },
    button: {
        width: "100%",
        padding: "0.75rem",
        background: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        fontSize: "1rem",
        cursor: "pointer",
        marginTop: "1rem",
    },
    title: {
        marginBottom: "1rem",
        fontWeight: "bold",
        fontSize: "1.5rem",
        textAlign: "center",
    },
};

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Connect to authentication logic here
        alert(`Email: ${email}\nPassword: ${password}`);
    };

    return (
        <div style={styles.container}>
            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.title}>Login</div>
                <input
                    style={styles.input}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    style={styles.input}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button style={styles.button} type="submit">
                    Sign In
                </button>
            </form>
        </div>
    );
};

export default Login;