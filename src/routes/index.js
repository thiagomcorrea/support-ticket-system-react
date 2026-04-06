import { Routes, Route } from "react-router-dom";
import RouteWrapper from "./Route";

import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Customers from "../pages/Customers";
import New from "../pages/New";

export default function RoutesApp() {
  return (
    <Routes>
      <Route path="/" element={<RouteWrapper element={<SignIn />} />} />
      <Route path="/register" element={<RouteWrapper element={<SignUp />} />} />

      <Route
        path="/dashboard"
        element={<RouteWrapper isPrivate element={<Dashboard />} />}
      />
      <Route
        path="/profile"
        element={<RouteWrapper isPrivate element={<Profile />} />}
      />
      <Route
        path="/customers"
        element={<RouteWrapper isPrivate element={<Customers />} />}
      />
      <Route path="/new" element={<RouteWrapper isPrivate element={<New />} />} />
      <Route
        path="/new/:id"
        element={<RouteWrapper isPrivate element={<New />} />}
      />
    </Routes>
  );
}