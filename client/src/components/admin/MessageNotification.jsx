import React, { useEffect, useState } from "react";

export default function MessageNotification() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const response = await fetch("http://localhost:3002/messages");
        const data = await response.json();

        if (data.message === "success") {
          const count = data.messages.filter(
            (msg) => msg.sender === "user" && msg.isRead === false
          ).length;

          setUnreadCount(count);
        }
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };

    fetchUnreadMessages();

    const interval = setInterval(fetchUnreadMessages, 5000);

    return () => clearInterval(interval);
  }, []);

  if (unreadCount === 0) return null;

  return (
    <span
      style={{
        background: "#e74c3c",
        color: "white",
        borderRadius: "50%",
        minWidth: "24px",
        height: "24px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "bold",
        marginLeft: "10px",
      }}
    >
      {unreadCount}
    </span>
  );
}