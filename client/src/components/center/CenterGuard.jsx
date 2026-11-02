import { Navigate } from "react-router-dom";

export default function CenterGuard({ children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    user = null;
  }

  if (!user || user.role !== "center") {
    return <Navigate to="/login" replace />;
  }

  return children;
}