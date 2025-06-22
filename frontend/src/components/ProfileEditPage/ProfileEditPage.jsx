import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editProfile } from "../../store/profiles";
import { restoreUser } from "../../store/session";
import "./ProfileEditPage.css";

function ProfileEditPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [location, setLocation] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
      setAvatarUrl(user.avatarUrl || "");
      setLocation(user.location || "");
      setAge(user.age || "");
      setSex(user.sex || "");
      setRelationshipStatus(user.relationshipStatus || "");
    }
  }, [user]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setMessage("❌ Invalid file type. Use .jpg, .png, .jpeg, or .gif.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setMessage("❌ File too large. Max 25MB allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    // ✅ Get the CSRF token manually from the cookie
    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    setIsUploading(true);

    try {
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatarUrl);
        setMessage("✅ Image uploaded! Click 'Save Changes' to apply.");
      } else {
        setMessage(data.message || "❌ Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("❌ Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        editProfile({
          username,
          email,
          avatarUrl,
          location,
          age,
          sex,
          relationshipStatus,
        })
      );
      await dispatch(restoreUser()); // Ensure user data is refreshed
      setMessage("✅ Profile updated successfully!");
    } catch (err) {
      setMessage("❌ Failed to update profile.");
    }
  };

  return (
    <div className="profile-edit-container">
      <h2>Edit Profile</h2>
      {message && <p className="success-message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Upload New Profile Picture:</label>
        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/gif"
          onChange={(e) => handleFileUpload(e.target.files[0])}
        />

        {isUploading && <p style={{ color: "#888" }}>Uploading image... ⏳</p>}

        {avatarUrl && !isUploading && (
          <div style={{ margin: "10px 0" }}>
            <img
              src={avatarUrl}
              alt="Avatar Preview"
              style={{ width: "100px", borderRadius: "50%" }}
            />
          </div>
        )}

        <input type="hidden" value={avatarUrl} />

        <label>Location:</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <label>Age:</label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        <label>Sex:</label>
        <input
          type="text"
          value={sex}
          onChange={(e) => setSex(e.target.value)}
        />

        <label>Relationship Status:</label>
        <input
          type="text"
          value={relationshipStatus}
          onChange={(e) => setRelationshipStatus(e.target.value)}
        />

        <button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Save Changes"}
        </button>
      </form>
      <h3 style={{ marginTop: "2rem" }}>Change Password</h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const csrfToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("XSRF-TOKEN="))
            ?.split("=")[1];

          const res = await fetch("/api/users/change-password", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken, // ⬅️ This is essential
            },
            credentials: "include",
            body: JSON.stringify({
              currentPassword,
              newPassword,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setMessage("✅ Password updated successfully");
          } else {
            setMessage(data.message || "❌ Failed to update password");
          }
        }}
      >
        <label>Current Password:</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <label>New Password:</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}
export default ProfileEditPage;
