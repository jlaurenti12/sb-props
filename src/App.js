import "./App.css";
import {NextUIProvider} from "@nextui-org/react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./containers/Authentication/Login.js";
import Register from "./containers/Authentication/Register.js";
import Reset from "./containers/Authentication/Reset.js";
import Dashboard from "./containers/Dashboard/Dashboard.js";
import EditQuestions from "./containers/Admin/EditQuestions.js";
import Quiz from "./containers/Quiz/Quiz.js";
import Leaderboard from "./containers/Dashboard/Leaderboard";
import Navbar from "./components/Navigation/Navbar.js";


function App() {
  return (
    <NextUIProvider>
          <Router>
          <div className="dark text-foreground bg-background">
            <Navbar />
            <div className="app main-content">
              <Routes>
                <Route exact path="/" element={<Login />} />
                <Route exact path="/register" element={<Register />} />
                <Route exact path="/reset" element={<Reset />} />
                <Route exact path="/dashboard" element={<Dashboard />} />
                <Route exact path="/leaderboard" element={<Leaderboard />} />
                <Route exact path="/quiz" element={<Quiz />} />
                <Route exact path="/admin" element={<EditQuestions />} />
              </Routes>
            </div>
            </div>
          </Router>
    </NextUIProvider>
  );
}

export default App; 