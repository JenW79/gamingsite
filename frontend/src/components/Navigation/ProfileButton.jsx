import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import * as sessionActions from "../../store/session";
import { NavLink } from "react-router-dom";
import OpenModalMenuItem from "./OpenModalMenuItem";
import LoginFormModal from "../LoginFormModal/LoginFormModal";
import SignupFormModal from "../SignupFormModal/SignupFormModal";

import { useNavigate } from "react-router-dom";

import "./ProfileButton.css";

function ProfileButton({ user }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const ulRef = useRef();

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  useEffect(() => {
    if (!showMenu) return;

    const closeMenu = (e) => {
      if (ulRef.current && !ulRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [showMenu]);

  const ulClassName = `profile-dropdown ${showMenu ? "" : "hidden"}`;

  const closeMenu = () => setShowMenu(false);

  const logout = async (e) => {
    e.preventDefault();
    await dispatch(sessionActions.logout());
    closeMenu();
    navigate("/");
  };

  return (
    <div className="profile-button-wrapper">
      <button onClick={toggleMenu} className="profile-toggle-button">
        <FaUserCircle size={24} className="user-icon" />
      </button>
      {showMenu && (
        <ul className={ulClassName} ref={ulRef}>
          {user ? (
            <>
              <li> Hello, {user.username || "Guest"}</li>
              <li>{user.email || "No Email"}</li>
              <hr className="dropdown-divider" />
              <li className="dropdown-link">
                <NavLink to={`/profiles/${user.id}`} onClick={closeMenu}>
                  View Profile
                </NavLink>
              </li>
              <li className="dropdown-link">
                <NavLink to={`/profiles/${user.id}/edit`} onClick={closeMenu}>
                  Edit Profile
                </NavLink>
              </li>
              <hr className="dropdown-divider" />
              <li className="dropdown-link">
                <NavLink to="/dashboard" onClick={closeMenu}>
                  Game Dashboard
                </NavLink>
              </li>
              <hr className="dropdown-divider" />
              <li className="dropdown-link">
                <NavLink to="/directory" onClick={closeMenu}>
                  Find Players
                </NavLink>
              </li>
              <li className="dropdown-link">
                <NavLink to="/chat" onClick={closeMenu}>
                  Lobby Chat
                </NavLink>
              </li>
              <li className="dropdown-link">
                <NavLink to="/store" onClick={closeMenu}>
                  Store
                </NavLink>
              </li>
              <hr className="dropdown-divider" />
              <li>
                <button className="logout-button" onClick={logout}>
                  Log Out
                </button>
              </li>
            </>
          ) : (
            <>
              <OpenModalMenuItem
                itemText="Log In"
                onItemClick={closeMenu}
                modalComponent={<LoginFormModal />}
              />
              <OpenModalMenuItem
                itemText="Sign Up"
                onItemClick={closeMenu}
                modalComponent={<SignupFormModal />}
              />
            </>
          )}
        </ul>
      )}
    </div>
  );
}

export default ProfileButton;
