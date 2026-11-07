
import { Navigate } from "react-router-dom";

export default function CustomerGuard({ children }) {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    user = null;
  }

  if (!user || user.role !== "customer") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
