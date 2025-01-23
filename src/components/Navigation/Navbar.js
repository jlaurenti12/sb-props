import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate, NavLink } from "react-router-dom";
import { auth, logout, db } from "../../services/firebase.js";
import { getDocs, collection, query, where } from "firebase/firestore";
import {Navbar, NavbarBrand, NavbarContent, Image, DropdownItem, DropdownTrigger, Dropdown, DropdownMenu, Avatar} from "@heroui/react";
import mainLogo from "../../assets/images/sb_logo.png";


const Navigation = () => {

  const [user, loading] = useAuthState(auth);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
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
      setIsAdmin(data.isAdmin);
      setEmail(data.email);
      setName(data.name);
      const inits = data.name.match(/(\b\S)?/g).join("").match(/(^\S|\S$)?/g).join("").toUpperCase()
      setInitials(inits);
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
            <Image
              height="40"
              width="40"
              alt="Event image"
              src={mainLogo}
              radius="none"
            />
          </NavLink> 
          </NavbarBrand>

          <NavbarContent as="div" justify="end">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="default"
                  name={initials}
                  size="sm"
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <NavLink to="/dashboard">
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-semibold">{name}</p>
                    <p className="font-semibold">{email}</p>
                  </NavLink>
                </DropdownItem>
                { isAdmin ? (
                  <DropdownItem key="admin" className="h-14 gap-2">
                    <NavLink to="/admin">
                    <p className="font-semibold">
                      Admin
                    </p>
                    </NavLink> 
                  </DropdownItem>
                ) : (
                  console.log("false")
                )}
                <DropdownItem key="logout" color="danger" onPress={logout}>
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