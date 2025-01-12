import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate, NavLink } from "react-router-dom";
import { IoClose, IoMenu } from "react-icons/io5";
import { useMediaQuery } from "react-responsive";
import { auth, logout, db } from "../firebase";
import { getDocs, collection, query, where } from "firebase/firestore";
import "./NavHook.css";

const NavHook = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isMobile = useMediaQuery({ maxWidth: "1150px" });
    const [user, loading] = useAuthState(auth);
    const [name, setName] = useState("");
    const [isAdmin, setIsAdmin] = useState("false");
    const navigate = useNavigate();


    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };
  
    const closeMobileMenu = () => {
      if (isMobile) {
        setIsMenuOpen(false);
      }
    };

    const fetchUser = async () => {
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const snapshot = doc.docs[0];
      return snapshot
    }
  
    const fetchUserInfo = async () => {
      try {
        const snapshot = await fetchUser();
        const data = snapshot.data();
        setIsAdmin(data.isAdmin);
        setName(data.name);
      } catch (err) {
        console.error(err);
        alert("An error occured while fetching user data");
      }
    };
  
    useEffect(() => {
      if (loading) return;
      if (!user) return navigate("/");
  
      fetchUserInfo();
    }, [user, loading]);
  
    const renderNavLinks = () => {
      
      const listClassName = isMobile ? "nav__list" : "nav__list__web";
      const linkClassName = "nav__link";
      const buttonClassName = "nav__cta";
  
      return (
        <ul className={listClassName}>
          <li>
            <NavLink
              to="/dashboard"
              className={linkClassName}
              onClick={closeMobileMenu}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/leaderboard"
              className={linkClassName}
              onClick={closeMobileMenu}
            >
              Leaderboard
            </NavLink>
          </li>
          { isAdmin?
          <li>
            <NavLink
              to="/admin"
              className={linkClassName}
              onClick={closeMobileMenu}
            >
              Admin
            </NavLink>

          </li>
          : <></>
          }
          <li>
            <NavLink
              // to="/"
              className={`${linkClassName} ${buttonClassName}`}
              // onClick={logout} {closeMobileMenu}
              onClick={logout}
            >
              Logout
            </NavLink>
          </li>
        </ul>
      );
    };
  
    return (
      <header className="header">

        { user ?

        <nav className="nav container">
          <NavLink to="/" className="nav__logo">
            Superbowl Props
          </NavLink>

          {isMobile && (
            <div className="nav__toggle" id="nav-toggle" onClick={toggleMenu}>
              <IoMenu />
            </div>
          )}
  
          {isMobile ? (
            <div
              className={`nav__menu  ${isMenuOpen ? "show-menu" : ""}`}
              id="nav-menu"
            >
              {renderNavLinks()}
              <div className="nav__close" id="nav-close" onClick={toggleMenu}>
                <IoClose />
              </div>
            </div>
          ) : (
            renderNavLinks()
          )}

        </nav>
        :
        <></>
        }
      </header>
    );
  };

export default NavHook;