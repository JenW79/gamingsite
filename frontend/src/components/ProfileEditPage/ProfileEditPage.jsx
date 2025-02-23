import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editProfile } from "../../store/profiles";
import "./ProfileEditPage.css";

function ProfileEditPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) =>
    state.session.user ? { ...state.session.user } : null
  );

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(editProfile({ username, email, avatarUrl }));
    setMessage("Profile updated successfully!");
  };

  return (
    <div className="profile-edit-container">
      <h2>Edit Profile</h2>
      {message && <p className="success-message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>Username:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />

        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Profile Picture URL:</label>
        <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}

export default ProfileEditPage;
