import { useEffect } from "react";

// Opening "/" (where every Logout button goes) ends the session
export default function ClearSession({ children }) {
  useEffect(() => {
    localStorage.removeItem("user");
  }, []);

  return children;
}