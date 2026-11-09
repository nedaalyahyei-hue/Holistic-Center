import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegisterValidation from "../../validations/RegisterValidation";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import "./Auth.css";

const Register = () => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm({ resolver: yupResolver(RegisterValidation) });

  const handleSubmit = async (data) => {
    try {
      const res = await fetch("http://localhost:3002/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      setMessage(result.message);

      if (result.message === "User Registered") {
        setMessage("Please check your email and verify your account before logging in.");
      }
    } catch (error) {
      setMessage("Server Error");
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay">
        <div className="login-box">
          <img src="/logo.png" alt="HCS" className="login-logo" />

          <h2 className="register-heading">Registration</h2>

          <h5 style={{ color: message.includes("verify your account") ? "green" : "red" }}>
            {message}
          </h5>

          <form onSubmit={submitForm(handleSubmit)}>
            <div className="register-input-wrap">
              <input className="register-input" type="text" placeholder="Username" {...register("username")} />
              <p style={{ color: "red" }}>{errors.username?.message}</p>
            </div>

            <div className="register-input-wrap">
              <input className="register-input" type="email" placeholder="Email" {...register("email")} />
              <p style={{ color: "red" }}>{errors.email?.message}</p>
            </div>

            <div className="register-input-wrap">
              <input className="register-input" type="tel" placeholder="Phone Number" {...register("phone")} />
              <p style={{ color: "red" }}>{errors.phone?.message}</p>
            </div>

            <div className="register-input-wrap">
              <input className="register-input" type="password" placeholder="Password" {...register("password")} />
              <p style={{ color: "red" }}>{errors.password?.message}</p>
            </div>

            <div className="register-input-wrap">
              <input className="register-input" type="password" placeholder="Confirm Password" {...register("confirmPassword")} />
              <p style={{ color: "red" }}>{errors.confirmPassword?.message}</p>
            </div>

            <button className="register-button" type="submit">
              Register
            </button>
          </form>

          <p className="login-link">
            Already have an account ? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;