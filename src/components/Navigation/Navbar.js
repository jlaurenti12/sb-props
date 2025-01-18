import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate, NavLink } from "react-router-dom";
import { auth, logout, db } from "../../services/firebase.js";
import { getDocs, collection, query, where } from "firebase/firestore";
import {Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, DropdownItem, DropdownTrigger, Dropdown, DropdownMenu, Avatar} from "@heroui/react";


const Navigation = () => {

  const [user, loading] = useAuthState(auth);
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState("false");
  const navigate = useNavigate();

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
      console.log(data);
      setIsAdmin(data.isAdmin);
      setEmail(data.email);
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


    return (
      <div>
      { user ? (

          <Navbar className="w-full">
          <NavbarBrand>
          <NavLink to="/dashboard">
            <span>
              {/* <AcmeLogo /> */}
              <p className="font-bold text-inherit">SUPERBOWL PROPS</p>
            </span>
          </NavLink> 
          </NavbarBrand>

          {/* 
          <NavbarContent className="hidden sm:flex gap-4" justify="center">
            <NavbarItem>
              <Link color="foreground" href="#">
                Features
              </Link>
            </NavbarItem>
            <NavbarItem isActive>
              <Link href="#" aria-current="page" color="secondary">
                Customers
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link color="foreground" href="#">
                Integrations
              </Link>
            </NavbarItem>
          </NavbarContent> */}

          <NavbarContent as="div" justify="end">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="secondary"
                  name="Jason Hughes"
                  size="sm"
                  src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{email}</p>
                </DropdownItem>
                { isAdmin ? (
                  <DropdownItem to="/admin" key="admin" className="h-14 gap-2">
                    <NavLink to="/admin">
                    <p className="font-semibold">
                      Admin
                    </p>
                    </NavLink> 
                  </DropdownItem>
                ) : (
                  console.log("false")
                )}
                <DropdownItem key="logout" color="danger" onClick={logout}>
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarContent>
        </Navbar>

      ) : (
        <></>
      )}
    </div>
    );
  }

export default Navigation;