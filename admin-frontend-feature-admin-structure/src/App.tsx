import "./App.css";
import "./component/CameraPlayer/VideoRTC";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MainPage } from "@page/Main";
import { CamerasPage } from "@page/Cameras";
import { KiosksPage } from "@page/Kiosks";
import { ConfigurationPage } from "@page/Configuration";
import { CameraPage } from "@page/Cameras/Camera";
import RecordingsPage from "@page/Recordings";
import KioskPage from "@page/Kiosks/Kiosk";
import RecordingPage from "@page/Recordings/Recording";
import LoginPage from "@page/LoginPage/LoginPage";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import ProtectedRoute from "@utils/protectedRoute";
import { useEffect } from "react";
import { getUser } from "@store/slice/globalApi/apiSlice";
import RangePage from "@page/Ranges/Range/RangePage";
import GlobalRangeStats from "@page/Ranges/GlobalRangeStats/GlobalRangeStats";
import UsersPage from "@page/Users/Users";
import UserPage from "@page/Users/User/User";
import useUserPermissions from "@utils/hooks/useUserPermissions";

function App() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.api);
  const perms = useUserPermissions();

  useEffect(() => {
    dispatch(getUser({}));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute isAllowed={!!user} />}>
          {/* User protected  routes */}
          <Route path="/" element={<MainPage />} />
          <Route path="/user" element={<UsersPage />} />
          <Route path="/user/:userId" element={<UserPage />} />

          <Route element={<ProtectedRoute isAllowed={!!user?.isGlobalAdmin} />}>
            {/* Global admin protected routes */}
            <Route path="/range/stats" element={<GlobalRangeStats />} />
          </Route>

          <Route path="/range/:rangeId">
            <Route path="" element={<RangePage />} />
            <Route path="camera" element={<CamerasPage />} />
            <Route path="camera/:id" element={<CameraPage />} />
            <Route
              path="camera/:camId/recording"
              element={<RecordingsPage />}
            />
            <Route path="camera/recording/:id" element={<RecordingPage />} />

            <Route path="kiosk" element={<KiosksPage />} />
            <Route path="kiosk/:id" element={<KioskPage />} />

            <Route
              element={
                <ProtectedRoute isAllowed={!!perms?.includes("owner")} />
              }
            >
              {/* Owner protected routes */}
              <Route path="configuration" element={<ConfigurationPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
