import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editProfile } from "../../store/profiles";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(editProfile({ username, email, avatarUrl, location, age, sex, relationshipStatus }));
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage("Failed to update profile.");
    }
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

        <label>Location:</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />

        <label>Age:</label>
        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />

        <label>Sex:</label>
        <input type="text" value={sex} onChange={(e) => setSex(e.target.value)} />

        <label>Relationship Status:</label>
        <input type="text" value={relationshipStatus} onChange={(e) => setRelationshipStatus(e.target.value)} />

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}

export default ProfileEditPage;

