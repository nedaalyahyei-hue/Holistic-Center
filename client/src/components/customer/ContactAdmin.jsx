
import React, { useState, useEffect } from "react";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";

export default function ContactAdmin() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "null");

        if (!user?._id) return;

        fetch("http://localhost:3002/messages")
            .then((res) => res.json())
            .then((data) => {
                if (data.message === "success") {
                    const userMessages = data.messages.filter(
                        (msg) => msg.customerId === user._id
                    );

                    setMessages(userMessages);
                }
            })
            .catch((error) => console.error(error));
    }, []);
    const handleSend = async () => {
        if (!message.trim()) return;

        const user = JSON.parse(localStorage.getItem("user") || "null");

        if (!user?._id) {
            alert("Please login first");
            return;
        }

        try {
            const response = await fetch("http://localhost:3002/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerId: user._id,
                    customerName: user.username,
                    sender: "user",
                    text: message,
                }),
            });

            const data = await response.json();

            if (response.ok && data.message === "success") {
                setMessage("");
                alert("Message sent successfully!");
            } else {
                alert(data.message || "Failed to send message");
            }
        } catch (error) {
            alert("Cannot connect to server");
        }
    };

    return (
        <CustomerLayout>
            <div className="contact-admin-page">
                <h1>Contact With Admin</h1>

                <div className="contact-admin-chat">
                    <div className="contact-admin-header">
                        Chat with Admin
                    </div>

                    <div className="contact-admin-messages">
                        {messages.length === 0 ? (
                            <p className="contact-admin-welcome">
                                How can we help you? Send us a message.
                            </p>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg._id}
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            msg.sender === "user" ? "flex-end" : "flex-start",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <div
                                        style={{
                                            background:
                                                msg.sender === "user" ? "#76a37b" : "#f0f0f0",
                                            color: msg.sender === "user" ? "white" : "black",
                                            padding: "12px 18px",
                                            borderRadius: "15px",
                                            maxWidth: "70%",
                                        }}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="contact-admin-input-area">
                        <input
                            type="text"
                            className="contact-admin-input"
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />

                        <button
                            type="button"
                            className="contact-admin-send" onClick={handleSend}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
