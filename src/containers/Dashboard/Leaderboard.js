import React, { useEffect, useMemo, useState } from "react";
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

  // During the game: all entries tied for top score; when game over we show single winner
  const currentLeaders = useMemo(() => {
    if (end) return [];
    const topScore = quizList[0]?.score ?? 0;
    if (topScore === 0) return [];
    return quizList.filter((q) => q.score === topScore);
  }, [quizList, end]);

  // When game is over, put tiebreaker winner in first row; otherwise use score order
  const displayQuizList = useMemo(() => {
    if (!end || !winner) return quizList;
    const idx = quizList.findIndex((q) => q.user === winner);
    if (idx <= 0) return quizList;
    const copy = [...quizList];
    const [winnerEntry] = copy.splice(idx, 1);
    return [winnerEntry, ...copy];
  }, [quizList, end, winner]);

  return (
    <div className="flex flex-col gap-4 mt-4">
      <style>{`
        @keyframes leaderboard-confetti-fall {
          0% { transform: translateY(-50px) rotate(var(--confetti-rotation, 0deg)); opacity: 0.9; }
          100% { transform: translateY(100px) rotate(calc(360deg + var(--confetti-rotation, 0deg))); opacity: 0.3; }
        }
        .leaderboard-confetti-piece {
          animation: leaderboard-confetti-fall 4s linear infinite;
        }
      `}</style>
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
        <div className={`grid gap-3 ${end && winner ? "grid-cols-1" : "grid-cols-2"}`}>
          {!(end && winner) && (
            <div className="rounded-lg bg-default-100 p-4 flex items-stretch">
              <div className="flex-1 flex flex-col justify-center text-center">
                <div className="text-small text-default-500 mb-1">Entries</div>
                <div className="text-lg font-semibold">{quizList.length}</div>
              </div>
              <div className="w-px m-4 bg-default-200 shrink-0" aria-hidden />
              <div className="flex-1 flex flex-col justify-center text-center">
                <div className="text-small text-default-500 mb-1">Prize</div>
                { year === "2026" ? (
                  <div className="text-lg font-semibold">${quizList.length * 20}</div>
                ) : (
                  <div className="text-lg font-semibold">${quizList.length * 10}</div>
                )}
              </div>
            </div>
          )}
          <div className={`relative overflow-visible ${end && winner ? "col-span-1" : ""}`}>
            <div
              className={`rounded-lg p-4 text-center relative min-h-[4.5rem] flex flex-col justify-center overflow-hidden ${
                end && winner ? "bg-primary/10 border-2 border-primary/30" : "bg-default-100"
              }`}
            >
              {end && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg" aria-hidden>
                  <span className="leaderboard-confetti-piece absolute top-2 left-[10%] w-2 h-1 bg-primary/50" style={{ animationDelay: "0s", "--confetti-rotation": "-18deg" }} />
                  <span className="leaderboard-confetti-piece absolute top-5 right-[15%] w-4 h-2 bg-primary/50" style={{ animationDelay: "0.7s", "--confetti-rotation": "42deg" }} />
                  <span className="leaderboard-confetti-piece absolute bottom-6 left-[20%] w-1.5 h-1 bg-primary/50" style={{ animationDelay: "1.4s", "--confetti-rotation": "8deg" }} />
                  <span className="leaderboard-confetti-piece absolute bottom-3 right-[25%] w-3 h-1.5 bg-primary/50" style={{ animationDelay: "2.1s", "--confetti-rotation": "-55deg" }} />
                  <span className="leaderboard-confetti-piece absolute top-1/2 left-[8%] w-2.5 h-1 bg-primary/50" style={{ animationDelay: "0.35s", "--confetti-rotation": "65deg" }} />
                  <span className="leaderboard-confetti-piece absolute top-1/3 right-[12%] w-3.5 h-1.5 bg-primary/50" style={{ animationDelay: "1.05s", "--confetti-rotation": "-28deg" }} />
                  <span className="leaderboard-confetti-piece absolute bottom-1/3 left-[15%] w-2 h-1.5 bg-primary/50" style={{ animationDelay: "1.75s", "--confetti-rotation": "75deg" }} />
                  <span className="leaderboard-confetti-piece absolute top-2 right-[35%] w-1.5 h-1 bg-primary/50" style={{ animationDelay: "2.45s", "--confetti-rotation": "-40deg" }} />
                  <span className="leaderboard-confetti-piece absolute top-1/4 left-[40%] w-4 h-2 bg-primary/50" style={{ animationDelay: "0.2s", "--confetti-rotation": "22deg" }} />
                  <span className="leaderboard-confetti-piece absolute bottom-2 right-[10%] w-2 h-1 bg-primary/50" style={{ animationDelay: "0.9s", "--confetti-rotation": "-72deg" }} />
                  <span className="leaderboard-confetti-piece absolute bottom-1/4 right-[38%] w-3 h-1 bg-primary/50" style={{ animationDelay: "1.6s", "--confetti-rotation": "35deg" }} />
                  <span className="leaderboard-confetti-piece absolute top-1/2 right-[20%] w-2.5 h-1.5 bg-primary/50" style={{ animationDelay: "2.3s", "--confetti-rotation": "-12deg" }} />
                  <span className="leaderboard-confetti-piece absolute bottom-1/2 left-[12%] w-3 h-2 bg-primary/50" style={{ animationDelay: "0.55s", "--confetti-rotation": "58deg" }} />
                  <span className="leaderboard-confetti-piece absolute top-4 left-[45%] w-2 h-1 bg-primary/50" style={{ animationDelay: "1.25s", "--confetti-rotation": "-35deg" }} />
                  <span className="leaderboard-confetti-piece absolute bottom-5 right-[18%] w-3.5 h-1 bg-primary/50" style={{ animationDelay: "1.95s", "--confetti-rotation": "82deg" }} />
                  <span className="leaderboard-confetti-piece absolute top-6 left-[30%] w-1.5 h-1.5 bg-primary/50" style={{ animationDelay: "2.65s", "--confetti-rotation": "-5deg" }} />
                  <span className="leaderboard-confetti-piece absolute bottom-1/3 right-[32%] w-4 h-1.5 bg-primary/50" style={{ animationDelay: "0.4s", "--confetti-rotation": "48deg" }} />
                  <span className="leaderboard-confetti-piece absolute top-1/3 left-[22%] w-2 h-1 bg-primary/50" style={{ animationDelay: "1.15s", "--confetti-rotation": "-62deg" }} />
                </div>
              )}
              <div className="relative z-10">
              {!(end && winner) && (
                <div className="flex items-center justify-center gap-1.5 text-small text-default-500 mb-1">
                  <span>
                    {end ? "Winner" : currentLeaders.length === 1 ? "Current leader" : "Current leaders"}
                  </span>
                </div>
              )}
              {end && winner ? (
                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="text-small text-default-500">Winner</div>
                  <div className="text-lg font-semibold truncate max-w-full" title={winner}>
                    {winner}
                  </div>
                  <div className="text-base font-semibold">
                    <span className="text-small text-default-500 font-normal">Prize: {year === "2026" ? `$${quizList.length * 20}` : `$${quizList.length * 10}`}</span>
                    
                  </div>
                </div>
              ) : end ? (
                <div className="text-lg font-semibold truncate" title="TBD">
                  TBD
                </div>
              ) : currentLeaders.length === 0 ? (
                <div className="text-lg font-semibold">—</div>
              ) : currentLeaders.length === 1 ? (
                <div className="text-lg font-semibold truncate" title={currentLeaders[0].user}>
                  {currentLeaders[0].user}
                </div>
              ) : (
                <Tooltip
                  content={currentLeaders.map((e) => e.user).join(", ")}
                  className="dark"
                  delay={0}
                  closeDelay={0}
                >
                  <div className="text-lg font-semibold cursor-default">
                    Tied ({currentLeaders.length})
                  </div>
                </Tooltip>
              )}
              </div>
            </div>
          </div>
        </div>
      </Skeleton>

      <Skeleton className="rounded-lg" isLoaded={isLoaded}>
        <Table>
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn className="text-center">SCORE</TableColumn>
            <TableColumn className="text-center">MAX</TableColumn>
            <TableColumn></TableColumn>
          </TableHeader>
          <TableBody>
            {displayQuizList.map((quiz, index) => (
              <TableRow key={`${quiz.userId}-${quiz.id}`}>
                <TableCell>{quiz.user}</TableCell>
                <TableCell className="text-center">{quiz.score}</TableCell>
                <TableCell className="text-center">{remaining + quiz.score}</TableCell>
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
