import { useSelector } from "react-redux";
import { useModal } from "../../context/Modal";
import Leaderboard from "../LeaderBoard/LeaderBoard";
import SignupFormModal from "../SignupFormModal/SignupFormModal";
import "../LandingPage/LandingPage.css";

function LandingPage() {
  const { setModalContent } = useModal();
  const user = useSelector((state) => state.session.user);

  const openSignupModal = () => {
    setModalContent(<SignupFormModal />);
  };

  return (
    <div className="landing-page-container">
      <h1>Welcome to Game Me!</h1>
      <p>
        Embark on an epic adventure. Engage in battles, level up, and join a
        vibrant community of players.
      </p>

      {!user && (
        <button onClick={openSignupModal}>Create Your Character</button>
      )}

      {user && <Leaderboard />}
    </div>
  );
}

export default LandingPage;

