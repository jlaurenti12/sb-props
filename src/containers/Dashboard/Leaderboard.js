import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { IoArrowForwardCircleSharp } from "react-icons/io5";
import {
  getDocs,
  collection,
  doc,
  getDoc,
  query,
  onSnapshot,
  orderBy,
  where,
} from "firebase/firestore";
import "../../assets/styles/Leaderboard.css";
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
  ButtonGroup,
  Skeleton,
} from "@heroui/react";

function Leaderboard({ remaining, status, end, year }) {
  const [questionList, setQuestionList] = useState([]);
  const [quizList, setQuizList] = useState([]);
  const userCollectionRef = collection(db, "users");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMax, setSelectedMax] = useState(null);
  const [selectedResponses, setSelectedResponses] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [winner, setWinner] = useState();

  const fetchAnswers = async () => {
    onSnapshot(collection(db, "questions"), (snapshot) => {
      getScores();
      getQuestionList();
    });
  };

  const fetchStatus = async () => {
    onSnapshot(collection(db, "status"), (snapshot) => {
      getScores();
    });
  };

  const getScores = async () => {
    const userData = await getDocs(collection(db, "users"));
    const filteredUserData = userData.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      quizzes: [],
    }));

    const docRef = doc(db, "games", year);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    const end = data.gameOver;
    const final = data.finalScore;

    await Promise.all(
      filteredUserData.map(async (user) => {
        const docRef = doc(userCollectionRef, user.id);
        const c = query(collection(db, "games", year, "propEntries"), where("user", "==", docRef));
        const a = await getDocs(c);

        const snapshot = a.docs.map((quiz) => ({
          ...quiz.data(),
          id: quiz.id,
        }));

        snapshot.map((quiz) => {
          user.quizzes.push(quiz);
        });
      })
    );

    const answerData = await getDocs(
      query(collection(db, "games", year, "propQuestions"), orderBy("order"))
    );

    const filteredAnswerData = answerData.docs.map((doc) => ({
      ...doc.data(),
    }));
    const answers = [];
    const quizzes = [];

    filteredAnswerData.map((question) => {
      answers.push(question.correctChoice);
    });

    filteredUserData.map((user) => {
      user.quizzes?.map((quiz) => {
        let score = 0;
        for (let index = 0; index < quiz.responses.length; index++) {
          if (quiz.responses[index] === answers[index]) {
            score++;
          }
        }
        quiz.score = score;

        const bothNames = user.name.trim().split(" ");
        if (bothNames.length > 1) {
          const initial = bothNames[1].substring(0, 1);
          quiz.user = bothNames[0] + " " + initial
        } else {
          quiz.user = bothNames[0];
        }

        quiz.userId = user.id;
        quiz.isCompleted ? quizzes.push(quiz) : <></>;
      });
    });

    quizzes.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

    setQuizList(quizzes);
    setIsLoaded(true);

    end ? getFinal(quizzes, final) : <></>;
  };

  const getFinal = (quizzes, finalScore) => {
    const max = Math.max(...quizzes.map((o) => o.score));
    const highScores = [];
    quizzes.map((quiz) => {
      if (quiz.score === max) {
        highScores.push(quiz);
      }
    });

    if (highScores.length === 1) {
      setWinner(highScores[0].user);
    } else {
      tiebreakerCheck(highScores, finalScore);
    }
  };

  const tiebreakerCheck = (highScores, finalScore) => {
    let closest = null;

    highScores.map((quiz) => {
      if (quiz.tiebreaker === finalScore) {
        closest = quiz;
      } else if (quiz.tiebreaker < finalScore) {
        if (closest === null) {
          closest = quiz;
        } else {
          quiz.tiebreaker > closest.tiebreaker ? (closest = quiz) : <></>;
        }
      } else {
        <></>;
      }
    });

    setWinner(closest.user);
  };

  const getQuestionList = async () => {
    try {
      const data = await getDocs(
        query(collection(db, "games",  year, "propQuestions"), orderBy("order"))
      );
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setQuestionList(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  const openDrawer = (quiz, remaining) => {
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

    setSelectedMax(quiz.score + remaining);
    setSelectedUser(quiz);
    setSelectedResponses(arr2);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    if (year) {
      fetchAnswers();
      fetchStatus();
      getQuestionList();
    }

  }, [year]);

  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="rounded-lg" isLoaded={isLoaded}>
        <div className="text-default-300 text-medium">Leaderboard</div>
      </Skeleton>

      <Skeleton className="rounded-lg" isLoaded={isLoaded}>
        <ButtonGroup fullWidth isDisabled color="primary" variant="flat">
          <Button className="overview">
            Entries: {quizList.length}{" "}
            <div className="aVerticalSeparator"></div> Prize: $
            {quizList.length * 10}
          </Button>
          {end ? (
            <Button className="overview">Winner: {winner}</Button>
          ) : (
            <Button className="overview">Winner: TBD</Button>
          )}
        </ButtonGroup>
      </Skeleton>

      <Skeleton className="rounded-lg" isLoaded={isLoaded}>
        <Table>
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>SCORE</TableColumn>
            <TableColumn>MAX</TableColumn>
            <TableColumn></TableColumn>
          </TableHeader>
          <TableBody>
            {quizList.map((quiz, index) => (
              <TableRow key={index}>
                <TableCell>{quiz.user}</TableCell>
                <TableCell>{quiz.score}</TableCell>
                <TableCell>{remaining + quiz.score}</TableCell>
                <TableCell>
                  {status ? (
                    <>
                      <Tooltip
                        delay={0}
                        closeDelay={0}
                        content="See responses"
                        className="dark"
                      >
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() =>
                            openDrawer(
                              quiz,
                              remaining
                            )
                          }
                          aria-label=""
                        >
                          <IoArrowForwardCircleSharp fontSize="24px" />
                        </Button>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip
                        content="Other responses hidden until game time"
                        className="dark"
                      >
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="content4"
                          aria-label=""
                          onPress={() => {
                            alert("Others' responses hidden until game time.");
                          }}
                        >
                          <IoArrowForwardCircleSharp fontSize="24px" />
                        </Button>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Skeleton>
      { isDrawerOpen ? (
          <NewDrawer
          isOpen={isDrawerOpen}
          quizData={selectedUser}
          userEntries={selectedResponses}
          maxScore={selectedMax}
          isClosed={closeDrawer}
        />
        ) : ( 
          <></>
        )}
    </div>
  );
}

export default Leaderboard;
