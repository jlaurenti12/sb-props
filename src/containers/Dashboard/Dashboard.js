import React, { useEffect, useState } from "react";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Tooltip,
  Button,
  Divider,
  Skeleton,
} from "@heroui/react";

function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const [questionList, setQuestionList] = useState([]);
  const navigate = useNavigate();
  const userCollectionRef = collection(db, "users");
  const [quizList, setQuizList] = useState([]);
  const [name, setName] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState("");
  const [selectedMax, setSelectedMax] = useState(null);
  const [selectedResponses, setSelectedResponses] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState();
  const [gameOver, setGameOver] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUser = () => {
    try {
      const q = query(userCollectionRef, where("uid", "==", user?.uid));

      onSnapshot(q, (querySnapshot) => {
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
          getQuestionList();
          getGameStatus();
        }
      });

      onSnapshot(doc(db, "games", "2025"), (snapshot) => {
        getGameStatus();
      });
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };

  const getGameStatus = async () => {
    const docRef = doc(db, "games", "2025");
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    setGameStarted(data.gameStatus);
    setGameOver(data.gameOver);
  };

  const getRemainingQuestions = (questions) => {
    let total = 0;
    questions.map((question) => {
      question.correctChoice ? total++ : <></>;
    });
    setRemainingQuestions(26 - total);
  };

  const getQuestionList = async () => {
    try {
      onSnapshot(
        query(collection(db, "games", "2025", "propQuestions"), orderBy("order")),
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
    const c = query(collection(db, "games", "2025", "propEntries"), where("user", "==", docRef));
    const a = await getDocs(c);

    const data = a.docs.map((quiz) => ({
      ...quiz.data(),
      id: quiz.id,
    }));

    const answerData = await getDocs(
      query(collection(db, "games", "2025", "propQuestions"), orderBy("order"))
    );

    const filteredAnswerData = answerData.docs.map((doc) => ({
      ...doc.data(),
    }));
    const answers = [];
    const quizzes = [];

    filteredAnswerData.map((question) => {
      answers.push(question.correctChoice);
    });

    data.map((quiz) => {
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
      const c = query(collection(db, "games", "2025", "propEntries"), where("user", "==", docRef));
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
    const test = person.docs[0].id;
    return navigate("/quiz", { state: { id: test } });
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
      } else if (questionList[index].correctChoice == quiz.responses[index]) {
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

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) return navigate("/");

    fetchUser();
    getGameStatus();
  }, [user, loading]);

  return (
    <div className="table">
      <div className="tableContent flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-default-300 text-medium table-header">
            Your entries
          </span>
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

        <div className="section-divider">
          <Divider className="my-4" />
        </div>

        <Leaderboard
          remaining={remainingQuestions}
          status={gameStarted}
          end={gameOver}
        />
      </div>
    </div>
  );
}

export default Dashboard;
