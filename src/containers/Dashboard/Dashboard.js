import React, { useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
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
import AnswerBreakdownDrawer from "./AnswerBreakdownDrawer.js";
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
  Alert,
} from "@heroui/react";

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
  const [, setLeaderboardStats] = useState({ entryCount: 0, winner: null });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, color: "success", title: "", description: "" });
  const prevAnswersRef = useRef([]);
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

    const isRevealed = (choice) =>
      choice != null && choice !== "" && choice !== "N/A" && choice !== "Push";

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

    // Check for newly revealed questions and show toast
    if (quizzes.length > 0 && prevAnswersRef.current.length > 0) {
      const userQuiz = quizzes[0];
      for (let i = 0; i < answers.length; i++) {
        const wasRevealed = isRevealed(prevAnswersRef.current[i]);
        const isNowRevealed = isRevealed(answers[i]);
        
        if (!wasRevealed && isNowRevealed) {
          // This question was just revealed
          const question = filteredAnswerData[i];
          const userAnswer = userQuiz.responses[i];
          const isCorrect = userAnswer === answers[i];
          
          setToast({
            show: true,
            color: isCorrect ? "success" : "danger",
            title: isCorrect ? "Correct" : "Incorrect",
            description: `Your answer "${userAnswer}" to "${question.prompt}" was ${isCorrect ? "correct!" : "incorrect :("}`,
          });
          
          // Only show toast for the first newly revealed question
          break;
        }
      }
    }
    
    prevAnswersRef.current = [...answers];

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
    // Reset the answers ref when year changes to prevent false toast triggers
    prevAnswersRef.current = [];
  }, [year]);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) return navigate("/");
    if (year) fetchUser();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, year]);

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 6500);
    return () => clearTimeout(t);
  }, [toast.show]);

  return (

    <div className="table">
      {toast.show && (
        <div className="fixed top-4 left-4 right-4 z-[9999] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <Alert
            color={toast.color}
            variant="solid"
            title={toast.title}
            description={toast.description}
            isClosable
            onClose={() => setToast((prev) => ({ ...prev, show: false }))}
            classNames={{ base: "shadow-lg" }}
          />
        </div>
      )}
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
        <h2 className="text-lg font-semibold text-foreground">Your entries</h2>
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
        {!gameStarted && (
          <Skeleton className="rounded-lg" isLoaded={isLoaded}>
            <Button
              fullWidth
              color="secondary"
              onPress={onStartQuiz}
            >
              Add Entry
            </Button>
          </Skeleton>
        )}

        <AnswerBreakdownDrawer
          isOpen={isBreakdownOpen}
          onClose={() => setIsBreakdownOpen(false)}
          year={year}
        />
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
          onAnswerBreakdownClick={() => setIsBreakdownOpen(true)}
        />
      </div>
    </div>

  );
}

export default Dashboard;
