import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { auth, logout, db } from "../../services/firebase.js";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { FiChevronDown } from "react-icons/fi";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  Image,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  Skeleton,
} from "@heroui/react";
import mainLogo from "../../assets/images/sb_logo_lx.png";

const Navigation = ({getCurrentYear}) => {
  const [user, loading] = useAuthState(auth);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [isAdmin, setIsAdmin] = useState("false");
  const userCollectionRef = collection(db, "users");
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [years, setYears] = useState([]);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  let z;
  const [currentYear, setCurrentYear] = useState();
  const isQuizPage = location.pathname.startsWith("/quiz");


  const fetchYear = async (year) => {
    z = await getCurrentYear(year);
    fetchUser(z);
  }

  const fetchUser = (year) => {
    try {
      const q = query(userCollectionRef, where("uid", "==", user?.uid));
      setCurrentYear(year);

      onSnapshot(q, (querySnapshot) => {
        var test = querySnapshot.docs;
        if (test.length > 0) {
          fetchUserInfo();
        }
      });

      onSnapshot(doc(db, "games", year), (snapshot) => {
        getGameStatus();
      });      
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };


  const getGameStatus = async () => {
    const d = [];
    const a = collection(db, "games");
    const b = await getDocs(a);
    const c = b.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id
    }));
    c.forEach((y) => {
      d.push({key: y.id, label: y.id})
    });
    const e = d.toReversed();
    setYears(e);
  };

  const fetchUserInfo = async () => {
    try {
      const a = query(userCollectionRef, where("uid", "==", user?.uid));
      const person = await getDocs(a);
      const data = person.docs[0].data();
      setIsAdmin(data.isAdmin);
      setEmail(data.email);
      setName(data.name);
      const inits = data.name
        .match(/(\b\S)?/g)
        .join("")
        .match(/(^\S|\S$)?/g)
        .join("")
        .toUpperCase();
      setInitials(inits);
      setIsLoaded(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectionChange = (year) => {
    getCurrentYear(year);
    fetchYear(year);
  } 

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const publicPaths = ["/", "/register", "/reset", "/set-new-password"];
      if (!publicPaths.includes(location.pathname)) {
        navigate("/");
      }
      return;
    }

    fetchYear();


    // CRA/Vercel builds run with CI=true; we intentionally only re-run this
    // effect when auth state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, location.pathname]);

  return (
    <>
      {user ? (
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
              {isQuizPage ? (
                <Button
                  disableRipple
                  className="p-0 bg-transparent data-[hover=true]:bg-transparent"
                  radius="sm"
                  variant="light"
                >
                  {currentYear}
                </Button>
              ) : (
                <Dropdown onOpenChange={setIsYearDropdownOpen}>
                  <DropdownTrigger>
                    <Button
                      disableRipple
                      className="p-0 bg-transparent data-[hover=true]:bg-transparent"
                      radius="sm"
                      variant="light"
                    >
                      <span className="inline-flex items-center gap-1">
                        <span>{currentYear}</span>
                        <FiChevronDown
                          aria-hidden="true"
                          className={[
                            "h-4 w-4 shrink-0 transform-gpu",
                            "transition-transform duration-200 ease-out",
                            "motion-reduce:transition-none motion-reduce:transform-none",
                            isYearDropdownOpen
                              ? "-translate-y-0.5 rotate-180"
                              : "translate-y-0 rotate-0",
                          ].join(" ")}
                        />
                      </span>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    {years.map((year) => (
                      <DropdownItem
                        key={year.key}
                        textValue={year.label}
                        onPress={() => handleSelectionChange(year.key)}
                      >
                        {year.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}

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
                  <DropdownItem
                    key="profile"
                    textValue={`${name} ${email}`}
                    className="h-14 gap-2"
                    onPress={() => navigate("/dashboard")}
                  >
                    <p className="font-semibold">{name}</p>
                    <p className="text-small text-default-500">{email}</p>
                  </DropdownItem>
                  {isAdmin ? (
                    <DropdownItem
                      key="admin"
                      textValue="Admin"
                      className="h-14 gap-2"
                      onPress={() => navigate("/admin")}
                    >
                      <p className="font-semibold">Admin</p>
                    </DropdownItem>
                  ) : (
                    <></>
                  )}
                  <DropdownItem key="logout" textValue="Log Out" color="danger" onPress={logout}>
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarContent>
          </Navbar>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default Navigation;
