import { useContext, useEffect, useMemo, useState } from "react";
import "./profile.css";
import Header from "../../components/Header";
import Title from "../../components/Title";
import avatar from "../../assets/avatar.png";

import firebase from "../../services/firebaseConnection";
import { AuthContext } from "../../contexts/auth";

import { FiSettings, FiUser, FiMail, FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";

export default function Profile() {
  const { user, signOut, setUser, storageUser } = useContext(AuthContext);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const [name, setName] = useState(user?.nome || "");
  const [email] = useState(user?.email || "");

  const [saving, setSaving] = useState(false);

  const hasChanges = name !== (user?.nome || "");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    setName(user?.nome || "");
  }, [user]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  const displayAvatar = useMemo(() => {
    return user?.avatarUrl || avatar;
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setSaving(true);

    try {
      await firebase.firestore().collection("users").doc(user.uid).set(
        {
          nome: name.trim(),
          email: email,
        },
        { merge: true }
      );

      const data = {
        ...user,
        nome: name.trim(),
      };

      setUser(data);
      storageUser(data);

      toast.success("Profile updated successfully.");
    } catch (err) {
      console.log("Profile save error:", err);
      toast.error("Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <div className="content profile-page">
        <Title name="Profile Settings">
          <FiSettings size={22} />
        </Title>

        <div className="profile-layout">
          <section className="profile-card">
            <div className="profile-card-header">
              <div className="profile-avatar-wrap">
                <img
                  src={displayAvatar}
                  alt="User avatar"
                  className="profile-avatar"
                />
              </div>

              <div className="profile-header-text">
                <h2>Account Details</h2>
                <p>Manage your personal information and account settings.</p>
              </div>
            </div>

            <form className="profile-form" onSubmit={handleSave}>
              <div className="profile-field-group">
                <label htmlFor="profile-name">
                  <FiUser size={16} />
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="profile-field-group">
                <label htmlFor="profile-email">
                  <FiMail size={16} />
                  Email
                </label>
                <input
                  id="profile-email"
                  type="text"
                  value={email}
                  disabled
                />
                <small>This email is linked to your authentication account.</small>
              </div>

              <div className="profile-actions">
                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={saving || !hasChanges}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="profile-signout-button"
                  onClick={signOut}
                  disabled={saving}
                >
                  <FiLogOut size={16} />
                  Sign Out
                </button>
              </div>
            </form>
          </section>

          <aside className="profile-side-card">
            <h3>Profile Overview</h3>

            <div className="profile-overview-item">
              <span className="profile-overview-label">Current name</span>
              <strong>{user?.nome || "Not provided"}</strong>
            </div>

            <div className="profile-overview-item">
              <span className="profile-overview-label">Current email</span>
              <strong>{user?.email || "Not provided"}</strong>
            </div>

            <div className="profile-overview-note">
              Avatar upload will be available in production environment.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}