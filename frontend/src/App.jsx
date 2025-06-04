import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Outlet, createBrowserRouter, RouterProvider } from "react-router-dom";
import Navigation from "./components/Navigation/Navigation";
import * as sessionActions from "./store/session";
import LandingPage from "./components/LandingPage/LandingPage";
import ProfilesPage from "./components/ProfilesPage/ProfilesPage";
import ProfileDetailPage from "./components/ProfilesDetailsPage/ProfilesDetailsPage";
import GameDashboard from "./components/GameDashboard/GameDashboard";
import ProfileEditPage from "./components/ProfileEditPage/ProfileEditPage";
import ChatPage from "./components/ChatPage/ChatPage";
import StorePage from "./components/StorePage/StorePage";
import DMModal from "./components/DMModal/DMModal";
import { fetchProfiles } from "./store/profiles";

function Layout() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
  const init = async () => {
    await dispatch(sessionActions.restoreUser());
    await dispatch(fetchProfiles());
    setIsLoaded(true);
  };
  init();
}, [dispatch]);

  return (
    <>
      <Navigation isLoaded={isLoaded} />
      {isLoaded && <Outlet />}
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/profiles", element: <ProfilesPage /> },
      { path: "/profiles/:userId", element: <ProfileDetailPage /> },
      { path: "/dm", element: <DMModal /> },
      { path: "dm/:userId", element: <DMModal /> },
      { path: "/dashboard", element: <GameDashboard /> },
      { path: "/profiles/edit", element: <ProfileEditPage /> },
      { path: "/chat", element: <ChatPage /> },
      { path: "store", element: <StorePage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
