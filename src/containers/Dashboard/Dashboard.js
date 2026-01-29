import React, { useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { auth, db } from "../../services/firebase";
import { IoArrowForwardCircleSharp } from "react-icons/io5";
import {
  getDocs,
  collection,
  getDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import Leaderboard from "./Leaderboard";
import NewDrawer from "./NewDrawer.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Tooltip,
  Button,
  Skeleton,
} from "@heroui/react";

function useCountUp(target, duration = 800) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  ref.current = display;
  useEffect(() => {
    const startVal = ref.current;
    const endVal = typeof target === "number" ? target : 0;
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(startVal + (endVal - startVal) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return display;
}

function Dashboard({year}) {
  const [user, loading] = useAuthState(auth);
  const [questionList, setQuestionList] = useState([]);
  const navigate = useNavigate();
  const userCollectionRef = collection(db, "users");
  const [quizList, setQuizList] = useState([]);
  const [name, setName] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState();
  const [selectedMax, setSelectedMax] = useState(null);
  const [selectedResponses, setSelectedResponses] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState();
  const [gameOver, setGameOver] = useState();
  // const [currentYear, setCurrentYear] = useState("2026");
  const [isLoaded, setIsLoaded] = useState(false);
  const [leaderboardStats, setLeaderboardStats] = useState({ entryCount: 0, winner: null });
  const [selectedUser, setSelectedUser] = useState(null);
  const animatedEntryCount = useCountUp(leaderboardStats.entryCount);
  const animatedPrize = useCountUp(leaderboardStats.entryCount * 10);
  const hasWinner = gameOver && leaderboardStats.winner && leaderboardStats.winner !== "TBD";
  // let z;

  // const fetchYear = async (year) => {
  //   const y = await getCurrentYear(year);
  //   z = y.toString();
  //   console.log(z);
  //   setCurrentYear(z);
  //   fetchUser();
  // }

  const fetchUser = () => {

    console.log(year);

    try {
      const q = query(userCollectionRef, where("uid", "==", user?.uid));

      onSnapshot(q, (querySnapshot) => {
        console.log(year);
        var test = querySnapshot.docs;
        if (test.length > 0) {
          const data = querySnapshot?.docs[0].data();
          const bothNames = data.name.trim().split(" ");
          if (bothNames.length > 1) {
            const initial = bothNames[1].substring(0, 1);
            setName(bothNames[0] + " " + initial);
          } else {
            setName(bothNames[0]);
          }

          fetchUserStatus();
          getGameStatus();
          getQuestionList();
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
    const docRef = doc(db, "games", year);

    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    console.log(data);
    setGameStarted(data.gameStatus);
    setGameOver(data.gameOver);
  };

  const getRemainingQuestions = (questions) => {
    let total = 0;
    questions.forEach((question) => {
      if (question.correctChoice) total++;
    });
    setRemainingQuestions(26 - total);
  };

  const getQuestionList = async () => {
    try {
      onSnapshot(
        query(collection(db, "games", year, "propQuestions"), orderBy("order")),
        (snapshot) => {
          const filteredData = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          setQuestionList(filteredData);
          getRemainingQuestions(filteredData);
          getScores();
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getScores = async () => {
    const docRef = doc(userCollectionRef, user?.uid);
    const docSnap = await getDoc(docRef);
    const person = docSnap.data();
    const c = query(collection(db, "games", year, "propEntries"), where("user", "==", docRef));
    const a = await getDocs(c);

    const data = a.docs.map((quiz) => ({
      ...quiz.data(),
      id: quiz.id,
    }));

    const answerData = await getDocs(
      query(collection(db, "games", year, "propQuestions"), orderBy("order"))
    );

    const filteredAnswerData = answerData.docs.map((doc) => ({
      ...doc.data(),
    }));
    const answers = [];
    const quizzes = [];

    filteredAnswerData.forEach((question) => {
      answers.push(question.correctChoice);
    });

    data.forEach((quiz) => {
      let score = 0;
      for (let index = 0; index < quiz.responses.length; index++) {
        if (quiz.responses[index] === answers[index]) {
          score++;
        }
      }
      quiz.score = score;
      quiz.user = person.name;
      quiz.userId = person.uid;
      quiz.id = a.docs[0].id;
      quizzes.push(quiz);
    });

    quizzes.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

    setQuizList(quizzes);
    setIsLoaded(true);
  };

  const fetchUserStatus = async () => {
    try {
      const docRef = doc(userCollectionRef, user?.uid);
      const c = query(collection(db, "games", year, "propEntries"), where("user", "==", docRef));
      const r = await getDocs(c);

      const filteredData = r.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      filteredData.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
      setQuizList(filteredData);
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };

  const onStartQuiz = async () => {
    const person = doc(userCollectionRef, user?.uid);
    const test = person.id;
    console.log(year);
    return navigate("/quiz", { state: { id: test, year: year } });
  };

  const openDrawer = (quiz, remaining) => {
    setSelectedMax(quiz.score + remaining);
    setSelectedUser(quiz);
    let arr = [];
    let arr2 = [];

    for (let index = 0; index < questionList.length; index++) {
      if (questionList[index].correctChoice == null) {
        arr.push(questionList[index].prompt, quiz.responses[index], "--", "--");
      } else if (
        questionList[index].correctChoice === "N/A" ||
        questionList[index].correctChoice === "Push"
      ) {
        arr.push(
          questionList[index].prompt,
          quiz.responses[index],
          questionList[index].correctChoice,
          "--"
        );
      } else if (questionList[index].correctChoice === quiz.responses[index]) {
        arr.push(
          questionList[index].prompt,
          quiz.responses[index],
          questionList[index].correctChoice,
          "Correct"
        );
      } else {
        arr.push(
          questionList[index].prompt,
          quiz.responses[index],
          questionList[index].correctChoice,
          "Incorrect"
        );
      }

      arr2.push(arr);
      arr = [];
    }

    setSelectedResponses(arr2);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedMax(null);
    setSelectedResponses([]);
    setIsDrawerOpen(false);
  };

  // const handleSelectionChange = (e) => {
  //   setCurrentYear(e.target.value);
  // } 

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) return navigate("/");
    if (year) fetchUser();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, year]);

  return (

    <div className="table">
      {/* <Select 
        label="Select a year"
        selectedKeys={[currentYear]}
        onChange={handleSelectionChange}
        >
          {years.map((year) => (
            <SelectItem key={year.key}>{year.label}</SelectItem>
          ))}
      </Select> */}
      <div className="tableContent flex flex-col gap-4">
        {gameOver ? (
          <div className="grid gap-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-default-100 p-4 text-center">
                <div className="text-small text-default-500 mb-1">Entries</div>
                <div className="text-xl font-semibold">{animatedEntryCount}</div>
              </div>
              <div className="rounded-lg bg-default-100 p-4 text-center">
                <div className="text-small text-default-500 mb-1">Prize Pool</div>
                <div className="text-xl font-semibold">${animatedPrize}</div>
              </div>
            </div>
            <div className="relative overflow-visible">
              {hasWinner && (
                <div
                  className="absolute -inset-2 pointer-events-none overflow-visible z-20"
                  aria-hidden
                >
                  {[
                    { x: "8%", y: "12%", color: "#f59e0b", rot: 15, shape: "strip" },
                    { x: "92%", y: "18%", color: "#10b981", rot: -20, shape: "circle" },
                    { x: "10%", y: "78%", color: "#ef4444", rot: -10, shape: "strip" },
                    { x: "90%", y: "72%", color: "#8b5cf6", rot: 25, shape: "strip" },
                    { x: "18%", y: "48%", color: "#06b6d4", rot: 5, shape: "circle" },
                    { x: "82%", y: "42%", color: "#ec4899", rot: -15, shape: "strip" },
                    { x: "50%", y: "8%", color: "#eab308", rot: 0, shape: "strip" },
                    { x: "50%", y: "92%", color: "#22c55e", rot: 10, shape: "circle" },
                    { x: "28%", y: "28%", color: "#f97316", rot: -25, shape: "strip" },
                    { x: "72%", y: "62%", color: "#6366f1", rot: 20, shape: "strip" },
                    { x: "15%", y: "35%", color: "#ec4899", rot: 40, shape: "strip" },
                    { x: "88%", y: "55%", color: "#f59e0b", rot: -35, shape: "circle" },
                    { x: "35%", y: "75%", color: "#10b981", rot: 12, shape: "strip" },
                    { x: "65%", y: "22%", color: "#ef4444", rot: -8, shape: "circle" },
                  ].map((piece, i) => {
                    const isStrip = piece.shape === "strip";
                    const isCircle = piece.shape === "circle";
                    return (
                      <motion.div
                        key={i}
                        className={`absolute ${isCircle ? "rounded-full w-2 h-2" : isStrip ? "w-4 h-1 rounded-full" : "w-2 h-2 rounded-sm"}`}
                        style={{
                          left: piece.x,
                          top: piece.y,
                          backgroundColor: piece.color,
                          transform: `translate(-50%, -50%) rotate(${piece.rot}deg)`,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.95 }}
                        transition={{ delay: i * 0.04, duration: 0.4, type: "spring", stiffness: 180 }}
                      />
                    );
                  })}
                </div>
              )}
              <div className="rounded-lg bg-default-100 p-4 text-center relative z-10">
                <div className="text-small text-default-500 mb-1">Winner</div>
                <motion.span
                  className="text-xl font-semibold inline-block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {leaderboardStats.winner ?? "TBD"}
                </motion.span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-default-100 p-4 text-center">
              <div className="text-small text-default-500 mb-1">Entries</div>
              <div className="text-xl font-semibold">{animatedEntryCount}</div>
            </div>
            <div className="rounded-lg bg-default-100 p-4 text-center">
              <div className="text-small text-default-500 mb-1">Prize Pool</div>
              <div className="text-xl font-semibold">${animatedPrize}</div>
            </div>
            <div className="rounded-lg bg-default-100 p-4 text-center">
              <div className="text-small text-default-500 mb-1">Winner</div>
              <div className="text-xl font-semibold">TBD</div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Your entries</h2>
          {gameStarted ? (
            <Tooltip
              delay={0}
              closeDelay={0}
              content="The game started. No more entries!"
            >
              <Skeleton className="rounded-lg" isLoaded={isLoaded}>
                <Button
                  radius="full"
                  isDisabled
                  size="md"
                  color="secondary"
                  onPress={onStartQuiz}
                >
                  Add Entry
                </Button>
              </Skeleton>
            </Tooltip>
          ) : (
            <Skeleton className="rounded-lg" isLoaded={isLoaded}>
              <Button
                adius="full"
                size="md"
                color="secondary"
                onPress={onStartQuiz}
              >
                Add Entry
              </Button>
            </Skeleton>
          )}
        </div>
        <Skeleton className="rounded-lg" isLoaded={isLoaded}>
          <Table color="secondary">
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>SCORE</TableColumn>
              <TableColumn>MAX</TableColumn>
              <TableColumn></TableColumn>
            </TableHeader>

            {quizList.length === 0 ? (
              <TableBody emptyContent={"You haven't submitted an entry yet."}>
                {[]}
              </TableBody>
            ) : (
              <TableBody>
                {quizList.map((quiz, index) =>
                    <TableRow key={index}>
                      <TableCell>{name}</TableCell>
                      <TableCell>{quiz.score}</TableCell>
                      <TableCell>{remainingQuestions + quiz.score}</TableCell>
                      <TableCell>
                        <Tooltip
                          delay={0}
                          closeDelay={0}
                          content="See your responses"
                          className="dark"
                        >
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() =>
                              openDrawer(
                                quiz,
                                remainingQuestions
                              )
                            }
                            aria-label=""
                          >
                            <IoArrowForwardCircleSharp fontSize="24px" />
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </Skeleton>

        { isDrawerOpen ? (
          <NewDrawer
          isOpen={isDrawerOpen}
          name={name}
          quizData={selectedUser}
          userEntries={selectedResponses}
          maxScore={selectedMax}
          isClosed={closeDrawer}
        />
        ) : ( 
          <></>
        )}

        <Leaderboard
          remaining={remainingQuestions}
          status={gameStarted}
          end={gameOver}
          year={year}
          onStatsReady={setLeaderboardStats}
        />
      </div>
    </div>

  );
}

export default Dashboard;
