import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './Navbar';

// Main App Components
import Login from './Auth/Login';
import Signup from './Auth/Signup';
import Session from './Auth/Session';
import ForgotPassword from './Auth/ForgotPassword';
import ResetPassword from './Auth/ResetPassword';
import PostFeed from './Posts/PostFeed';
import CreatePost from './Posts/CreatePost';
import PostDetail from './Posts/PostDetail';
import TopicList from './Topics/TopicList';
import TopicDetail from './Topics/TopicDetail';
import TopicAdmin from './Topics/TopicAdmin';
import JoinLeaveTopic from './Topics/JoinLeaveTopic';
import Notifications from './Notifications/Notifications';
import GlobalSearch from './Search/GlobalSearch';
import Groups from './Groups/Groups';
import Profile from './Profile/Profile';
import EditProfile from './Profile/EditProfile';
import Bookmarks from './Posts/Bookmarks';
import Messages from './Messages/Messages';
import MentionRedirect from './Profile/MentionRedirect';
import ConnectMultiverse from './Profile/ConnectMultiverse';
import Settings from './Settings/Settings';

// Layout for the main site (with Navbar)
const MainLayout = () => (
  <div className="App h-full bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 text-slate-300 relative overflow-hidden">
    {/* Global Background Blobs */}
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 blur-[120px] animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-20 w-[600px] h-[600px] bg-pink-600/20 blur-[120px] animate-blob animation-delay-4000"></div>
    </div>

    <div className="relative z-10 h-full flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-y-auto container mx-auto px-4 pt-20 pb-2">
        <Outlet />
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Application Routes (wrapped in MainLayout) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<PostFeed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/resetpassword/:resettoken" element={<ResetPassword />} />
          <Route path="/session" element={<Session />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/topics" element={<TopicList />} />
          <Route path="/topic/:id" element={<TopicDetail />} />
          <Route path="/topic/admin" element={<TopicAdmin />} />
          <Route path="/topic/join" element={<JoinLeaveTopic />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/search" element={<GlobalSearch />} />
          <Route path="/u/:username" element={<MentionRedirect />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/connect" element={<ConnectMultiverse />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
