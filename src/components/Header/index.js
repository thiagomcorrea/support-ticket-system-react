import { useContext } from "react";
import "./header.css";
import { AuthContext } from "../../contexts/auth";
import avatar from "../../assets/avatar.png";
import { FiSun, FiMoon, FiHome, FiUser, FiSettings } from "react-icons/fi";
import { NavLink } from "react-router-dom";

export default function Header({ theme = "light", onToggleTheme }) {
  const { user } = useContext(AuthContext);

  return (
    <div className="sidebar">
      <div className="sidebar-profile">
        <img
          src={user?.avatarUrl ? user.avatarUrl : avatar}
          alt="User avatar"
        />
        <span>{user?.name || "User"}</span>
      </div>

      <nav>
        <NavLink to="/dashboard">
          <FiHome size={20} />
          Dashboard
        </NavLink>

        <NavLink to="/customers">
          <FiUser size={20} />
          Customers
        </NavLink>

        <NavLink to="/profile">
          <FiSettings size={20} />
          Settings
        </NavLink>
      </nav>

      <button
        type="button"
        className="theme-toggle-button"
        onClick={onToggleTheme}
      >
        {theme === "dark" ? (
          <>
            <FiSun size={16} />
            Light Mode
          </>
        ) : (
          <>
            <FiMoon size={16} />
            Dark Mode
          </>
        )}
      </button>
    </div>
  );
}