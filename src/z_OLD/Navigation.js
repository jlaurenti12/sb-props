import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import "./Navigation.css";
import { useNavigate, NavLink } from "react-router-dom";
import { IoClose, IoMenu } from "react-icons/io5";
import { auth, logout, db } from "../firebase";
import { getDocs, collection, query, where } from "firebase/firestore";


function Navigation({parentToChild}) {

  // console.log(parentToChild);

  const [user, loading] = useAuthState(auth);
  const [name, setName] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const closeMenuOnMobile = () => {
    if (window.innerWidth <= 1150) {
      setShowMenu(false);
    }
  };


  const fetchUser = async () => {
    const q = query(collection(db, "users"), where("uid", "==", user?.uid));
    const doc = await getDocs(q);
    const snapshot = doc.docs[0];
    return snapshot
  }

  const fetchUserName = async () => {
    try {
      const snapshot = await fetchUser();
      const data = snapshot.data();
      setName(data.name);
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };

  // const backToDash = async () => {
  //   return navigate("/")
  // }

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/");

    fetchUserName();
  }, [user, loading]);


  return (
      // <div>
      //   Logged in as
      //   <div>{name}</div>
      //   <div>{user?.email}</div>
      //   <button onClick={logout}>
      //     Logout
      //   </button>
      //   <div>
      //      {parentToChild? 
      //      <button onClick={backToDash}>Back to Dashboard</button>
      //      :
      //      <></>
      //     }
      //   </div>
      // </div>

   <header className="header">
     <nav className="nav container">
       <NavLink to="/" className="nav__logo">
         Super Bowl Props
       </NavLink>

      { user? 
          <>
             <div
             className={"nav__menu"}
             id="nav-menu"
             >
              <ul className="nav__list">
                <li className="nav__item">
                  <NavLink
                    to="/dashboard"
                    className="nav__link"
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav__item">
                  <NavLink
                    to="/leaderboard"
                    className="nav__link"
                  >
                    Leaderboard
                  </NavLink>
                </li>
                <li className="nav__item">
                  <NavLink onClick={logout} className="nav__link nav__cta">
                    Logout
                  </NavLink>
                </li>
                <div className="nav__close" id="nav-close" onClick={toggleMenu}>
                  <IoClose />
                </div>
                </ul>
              </div>

               <div className="nav__toggle" id="nav-toggle" onClick={toggleMenu}>
                <IoMenu />
              </div>
            </>

           :

           <></>
    
      }

     </nav>
   </header>
      
  );
}

export default Navigation;