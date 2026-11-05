import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

const ForgetPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setMessage("Email is required");
            return;
        }
        try {
            console.log("Sending email:", email);

            const res = await fetch("http://localhost:3002/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const result = await res.json();
            console.log("Server response:", result);

            setMessage(result.message);
            if (result.message === "Reset code sent successfully") {
                navigate("/reset-password/verify", { state: { email } });
            }
        } catch (error) {
            console.log("Frontend error:", error);
            setMessage("Server Error");
        }
    };

    return (
        <div className="login-page">
            <div className="login-overlay">
                <div className="login-box">
                    <img src="/logo.png" alt="HCS" className="login-logo" />

                    <h2 className="login-heading">Forget Password</h2>

                    <h5 style={{ color: "red" }}>{message}</h5>

                    <form onSubmit={handleSubmit}>
                        <div className="login-input-wrap">
                            <input
                                type="email"
                                placeholder="Email"
                                className="login-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button className="login-button" type="submit">
                            Send Reset Link
                        </button>
                    </form>

                    <p className="register-line">
                        Know your password ? <Link to="/login">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgetPassword;