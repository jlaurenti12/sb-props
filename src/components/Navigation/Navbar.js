import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate, NavLink } from "react-router-dom";
import { auth, logout, db } from "../../services/firebase.js";
import { getDocs, collection, query, where, onSnapshot } from "firebase/firestore";
import {Navbar, NavbarBrand, NavbarContent, Image, DropdownItem, DropdownTrigger, Dropdown, DropdownMenu, Avatar, Skeleton} from "@heroui/react";
import mainLogo from "../../assets/images/sb_logo.png";


const Navigation = () => {

  const [user, loading] = useAuthState(auth);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [isAdmin, setIsAdmin] = useState("false");
  const userCollectionRef = collection(db, "users");
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchUser = () => {
    try {
      const q = query(userCollectionRef, where("uid", "==", user?.uid));
     
      onSnapshot(q, (querySnapshot) => {
        var test = querySnapshot.docs;
        if (test.length > 0) {
          fetchUserInfo();
        }
      })
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };
  const fetchUserInfo = async () => {
    try {
      const a = query(userCollectionRef, where("uid", "==", user?.uid));
      const person = await getDocs(a);
      const data = person.docs[0].data();
      setIsAdmin(data.isAdmin);
      setEmail(data.email);
      setName(data.name);
      const inits = data.name.match(/(\b\S)?/g).join("").match(/(^\S|\S$)?/g).join("").toUpperCase()
      setInitials(inits);
      setIsLoaded(true);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/");

    fetchUser();
  }, [user, loading]);


    return (

      <>
      { user ? (

          <div>

          <Navbar className="w-full">
          <NavbarBrand>
          <NavLink to="/dashboard">
          <Skeleton className="rounded-lg" isLoaded={isLoaded}>
            <Image
              height="40"
              width="40"
              alt="Event image"
              src={mainLogo}
              radius="none"
            />
          </Skeleton>
          </NavLink> 
          </NavbarBrand>

          <NavbarContent as="div" justify="end">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Skeleton className="rounded-full" isLoaded={isLoaded}>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="default"
                  name={initials}
                  size="sm"
                />
                </Skeleton>
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
                  <></>
                )}
                <DropdownItem key="logout" color="danger" onPress={logout}>
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarContent>
        </Navbar>

        </div>

      ) : (

      <></>
      
    )};

    </>

    );
  }

export default Navigation;
