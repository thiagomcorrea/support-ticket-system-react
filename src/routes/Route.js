import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth";

export default function RouteWrapper({ element, isPrivate }) {
  const { signed, loading } = useContext(AuthContext);

  if (loading) {
    return <div />;
  }

  if (!signed && isPrivate) {
    return <Navigate to="/" replace />;
  }

  if (signed && !isPrivate) {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
}