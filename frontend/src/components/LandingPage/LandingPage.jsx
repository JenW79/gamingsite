import { useNavigate } from "react-router-dom";
import Leaderboard from '../Leaderboard/Leaderboard';
import "../LandingPage/LandingPage.css";

function LandingPage() {
  
  const navigate = useNavigate();
 

  return (
    <div className="landing-page-container">
      <h1>Welcome to [Your Game Name]!</h1>
      <p>Embark on an epic adventure. Engage in battles, level up, and join a vibrant community of players.</p>
      <button onClick={() => navigate('/game')}>Start Your Adventure</button>
      <Leaderboard />
    </div>
  );
}

export default LandingPage;
