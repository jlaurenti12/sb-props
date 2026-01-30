import "./App.css";
import {HeroUIProvider} from "@heroui/react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Login from "./containers/Authentication/Login.js";
import Register from "./containers/Authentication/Register.js";
import Reset from "./containers/Authentication/Reset.js";
import SetNewPassword from "./containers/Authentication/SetNewPassword.js";
import Dashboard from "./containers/Dashboard/Dashboard.js";
import Admin from "./containers/Admin/Admin.js";
import Quiz from "./containers/Quiz/Quiz.js";
import Leaderboard from "./containers/Dashboard/Leaderboard";
import Navbar from "./components/Navigation/Navbar.js";
import {ThemeProvider as NextThemesProvider} from "next-themes";


function App() {

  const [ a, setA ] = useState();

  const getGameStatus = (year) => {
  
    if (year) {
      // currentYear = year;
      console.log(year)
      setA(year);
      return year;
    } else {
      let currentYear = "2026"
      console.log(currentYear)
      setA(currentYear);
      return currentYear;
    }
  };

  useEffect(() => {
    getGameStatus();
  }, []);


  
  return (
    <HeroUIProvider>
          <Router>
          <NextThemesProvider attribute="class" defaultTheme="dark">
            <Navbar getCurrentYear={getGameStatus}/>
            <div className="app main-content">
              <Routes>
                <Route exact path="/" element={<Login />} />
                <Route exact path="/register" element={<Register />} />
                <Route exact path="/reset" element={<Reset />} />
                <Route exact path="/set-new-password" element={<SetNewPassword />} />
                <Route exact path="/dashboard" element={<Dashboard year={a} />} />
                <Route exact path="/leaderboard" element={<Leaderboard />} />
                <Route exact path="/quiz" element={<Quiz />} />
                <Route exact path="/admin" element={<Admin year={a} />} />
              </Routes>
            </div>
            </NextThemesProvider>
          </Router>
     </HeroUIProvider>
  );
}

export default App; 