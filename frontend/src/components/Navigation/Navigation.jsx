import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import ProfileButton from "./ProfileButton";
import MessageButton from "./MessageButton";
import "./Navigation.css";

function Navigation({ isLoaded }) {
  const user = useSelector((state) => state.session.user);

  return (
    <nav className="navbar">
      <div className="nav-left">
        <NavLink to="/" className="nav-logo">
          <img src="/logo.png" alt="App Logo" className="logo" />
        </NavLink>
      </div>

      <div className="nav-right">
        <MessageButton showText={false} />
        {isLoaded && <ProfileButton user={user} />}
      </div>
    </nav>
  );
}

export default Navigation;
