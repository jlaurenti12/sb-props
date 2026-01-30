import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../../services/firebase";
import { IoArrowForwardCircleSharp, IoChevronForward } from "react-icons/io5";
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
  Skeleton,
} from "@heroui/react";

function Leaderboard({ remaining, status, end, year, onStatsReady, onAnswerBreakdownClick }) {
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
    onSnapshot(
      query(collection(db, "games", year, "propQuestions"), orderBy("order")),
      (snapshot) => {
        getScores();
        getQuestionList();
      }
    );
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

        snapshot.forEach((quiz) => {
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

    filteredAnswerData.forEach((question) => {
      answers.push(question.correctChoice);
    });

    filteredUserData.forEach((user) => {
      user.quizzes?.forEach((quiz) => {
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
        if (quiz.isCompleted) quizzes.push(quiz);
      });
    });

    quizzes.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

    setQuizList(quizzes);
    setIsLoaded(true);

    if (end) getFinal(quizzes, final);
  };

  const getFinal = (quizzes, finalScore) => {
    const max = Math.max(...quizzes.map((o) => o.score));
    const highScores = [];
    quizzes.forEach((quiz) => {
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

    highScores.forEach((quiz) => {
      if (quiz.tiebreaker === finalScore) {
        closest = quiz;
      } else if (quiz.tiebreaker < finalScore) {
        if (closest === null) {
          closest = quiz;
        } else {
          if (quiz.tiebreaker > closest.tiebreaker) closest = quiz;
        }
      }
    });

    setWinner(closest != null ? closest.user : null);
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  // Refetch when game doc changes (e.g. admin sets game over / final score) so winner updates without refresh
  useEffect(() => {
    if (!year) return;
    const unsub = onSnapshot(doc(db, "games", year), () => {
      getScores();
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  useEffect(() => {
    if (onStatsReady) {
      onStatsReady({ entryCount: quizList.length, winner: winner ?? null });
    }
  }, [quizList.length, winner, onStatsReady]);

  return (
    <div className="flex flex-col gap-4 mt-4">
      <Skeleton className="rounded-lg" isLoaded={isLoaded}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Leaderboard</h2>
          {onAnswerBreakdownClick && status && (
            <Button
              size="md"
              variant="light"
              color="secondary"
              onPress={onAnswerBreakdownClick}
              endContent={<IoChevronForward />}
            >
              View answer breakdown
            </Button>
          )}
        </div>
      </Skeleton>

      <Skeleton className="rounded-lg" isLoaded={isLoaded}>
        <div className="grid gap-3 grid-cols-4">
          <div className="rounded-lg bg-default-100 p-4 text-center">
            <div className="text-small text-default-500 mb-1">Entries</div>
            <div className="text-lg font-semibold">{quizList.length}</div>
          </div>
          <div className="rounded-lg bg-default-100 p-4 text-center">
            <div className="text-small text-default-500 mb-1">Prize</div>
            <div className="text-lg font-semibold">${quizList.length * 10}</div>
          </div>
          <div className="relative overflow-visible col-span-2">
            {/* {end && winner && (
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
            )} */}
            <div className="rounded-lg bg-default-100 p-4 text-center relative z-10 h-full flex flex-col justify-center">
              <div className="text-small text-default-500 mb-1">
                {end ? "Winner" : "Current leader"}
              </div>
              <div className="text-lg font-semibold truncate" title={end ? (winner ?? "TBD") : (quizList[0]?.score > 0 ? quizList[0]?.user : "—")}>
                {end ? (winner ?? "TBD") : (quizList[0]?.score > 0 ? quizList[0]?.user : "—")}
              </div>
            </div>
          </div>
        </div>
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
