import React, { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase.js";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate, NavLink } from "react-router-dom";
import {
  getDocs,
  collection,
  addDoc,
  query,
  where,
  updateDoc,
  getDoc,
  doc,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import {
  Form,
  Input,
  Button,
  Chip,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/react";
import QuestionDrawer from "./QuestionDrawer.js";
import { IoPencil, IoReorderThree } from "react-icons/io5";
import { IoCheckmark, IoClose } from "react-icons/io5";

function arrayMove(arr, fromIndex, toIndex) {
  const copy = [...arr];
  const [removed] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, removed);
  return copy;
}

function Admin({ year }) {
  const navigate = useNavigate();
  const currentYear = year ?? "2026";

  // For questions
  const [questionList, setQuestionList] = useState([]);
  const questionsCollectionRef = collection(db, "games", currentYear, "propQuestions");

  const getQuestionList = async () => {
    try {
      const data = await getDocs(
        query(questionsCollectionRef, orderBy("order"))
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

  const onSubmitQuestion = async (prompt, choices) => {
    try {
      await addDoc(questionsCollectionRef, {
        prompt: prompt,
        choices: choices.split(","),
        correctChoice: null,
        order: questionList.length + 1,
      });

      getQuestionList();
    } catch (err) {
      console.error(err);
    }
  };

  // For drawer
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = (question) => {
    setSelectedQuestion(question);
    setIsDrawerOpen(true);
    getQuestionList();
  };

  const closeDrawer = () => {
    setSelectedQuestion(null);
    setIsDrawerOpen(false);
    getQuestionList();
  };

  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const handleDragStart = (id) => setDraggedId(id);
  const handleDragOver = (id) => setDropTargetId(id);
  const handleDragLeave = () => setDropTargetId(null);
  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
  };

  const handleDrop = async (draggedId, dropTargetId) => {
    setDraggedId(null);
    setDropTargetId(null);
    if (draggedId === dropTargetId) return;

    const oldIndex = questionList.findIndex((q) => q.id === draggedId);
    const newIndex = questionList.findIndex((q) => q.id === dropTargetId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(questionList, oldIndex, newIndex);
    const withNewOrder = reordered.map((q, i) => ({ ...q, order: i + 1 }));
    setQuestionList(withNewOrder);

    try {
      const questionsRef = collection(db, "games", currentYear, "propQuestions");
      await Promise.all(
        withNewOrder.map((q) =>
          updateDoc(doc(questionsRef, q.id), { order: q.order })
        )
      );
    } catch (err) {
      console.error(err);
      getQuestionList();
    }
  };

  // For game status
  const [gameStarted, setGameStarted] = useState();
  const [gameOver, setGameOver] = useState();
  const [finalScore, setFinalScore] = useState(null);
  const [isEditingFinalScore, setIsEditingFinalScore] = useState(false);
  const [editFinalScoreValue, setEditFinalScoreValue] = useState("");
  const statusDoc = doc(db, "games", currentYear);

  const getGameStatus = async () => {
    const docSnap = await getDoc(statusDoc);
    const data = docSnap.data();
    setGameStarted(data.gameStatus);
    setGameOver(data.gameOver);
    setFinalScore(data.finalScore != null ? data.finalScore : null);
  };

  const changeStatus = async () => {
    gameStarted === true
      ? await updateDoc(statusDoc, { gameStatus: false })
      : await updateDoc(statusDoc, { gameStatus: true });
    getGameStatus();
  };

  const changeEnd = async () => {
    gameOver === true
      ? await updateDoc(statusDoc, { gameOver: false })
      : await updateDoc(statusDoc, { gameOver: true });
    getGameStatus();
  };

  const saveFinalScore = async (value) => {
    await updateDoc(statusDoc, { finalScore: value });
    setFinalScore(value);
    setIsEditingFinalScore(false);
    setEditFinalScoreValue("");
    getGameStatus();
  };

  const startEditFinalScore = () => {
    setEditFinalScoreValue(finalScore ?? "");
    setIsEditingFinalScore(true);
  };

  const cancelEditFinalScore = () => {
    setIsEditingFinalScore(false);
    setEditFinalScoreValue("");
  };

  const replaceChoice = (value) => {
    const s = typeof value === "string" ? value.trim() : String(value ?? "");
    if (s === "KC") return "NE";
    if (s === "PHI") return "SEA";
    return s;
  };

  const migrate2025To2026 = async () => {
    if (
      !window.confirm(
        "Copy all 2025 questions to 2026 (KC→NE, PHI→SEA) and replace existing 2026 questions?"
      )
    )
      return;
    try {
      const sourceRef = collection(db, "games", "2025", "propQuestions");
      const targetRef = collection(db, "games", "2026", "propQuestions");
      const snapshot = await getDocs(
        query(sourceRef, orderBy("order"))
      );
      const questions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      const existing2026 = await getDocs(
        query(targetRef, orderBy("order"))
      );
      for (const d of existing2026.docs) {
        await deleteDoc(doc(targetRef, d.id));
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const choices = Array.isArray(q.choices)
          ? q.choices.map(replaceChoice)
          : [replaceChoice(q.choices)];
        const correctChoice =
          q.correctChoice != null ? replaceChoice(q.correctChoice) : null;
        await addDoc(targetRef, {
          prompt: q.prompt,
          choices,
          correctChoice,
          order: i + 1,
        });
      }

      alert(`Migrated ${questions.length} questions from 2025 to 2026.`);
      if (currentYear === "2026") getQuestionList();
    } catch (err) {
      console.error(err);
      alert("Migration failed: " + err.message);
    }
  };

  const clear2026CorrectChoices = async () => {
    if (
      !window.confirm(
        "Set correctChoice to null for every 2026 question only. 2025 data will not be touched. Continue?"
      )
    )
      return;
    try {
      const targetRef = collection(db, "games", "2026", "propQuestions");
      const snapshot = await getDocs(query(targetRef, orderBy("order")));
      for (const d of snapshot.docs) {
        await updateDoc(doc(targetRef, d.id), { correctChoice: null });
      }
      alert(`Cleared correct choice from ${snapshot.docs.length} 2026 questions.`);
      if (currentYear === "2026") getQuestionList();
    } catch (err) {
      console.error(err);
      alert("Failed: " + err.message);
    }
  };

  // for checking admin status
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState("false");

  const fetchUserStatus = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const doc = await getDocs(q);
      const snapshot = doc.docs[0];
      const data = snapshot.data();
      setIsAdmin(data.isAdmin);
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/");

    fetchUserStatus();
    getQuestionList();
    getGameStatus();
    setSelectedQuestion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, currentYear]);

  // const choicesArray = (q) =>
  //   Array.isArray(q.choices) ? q.choices : (q.choices ? [q.choices] : []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {isAdmin ? (
        <>
          {/* Game controls section */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Game controls
            </h2>
            <div className="rounded-xl overflow-hidden bg-default-50 p-6">
            <div className="flex flex-wrap gap-4 items-center">
              {gameStarted ? (
                <Button onPress={() => changeStatus()}>Unstart Game</Button>
              ) : (
                <Button onPress={() => changeStatus()} color="primary">
                  Start Game
                </Button>
              )}

              {gameOver ? (
                <Button onPress={() => changeEnd()}>Unfinish Game</Button>
              ) : (
                <Button onPress={() => changeEnd()} color="warning">
                  End Game
                </Button>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-default-200 flex flex-col items-start">
              <h3 className="text-sm font-medium text-default-600 mb-3">
                Final score (tiebreaker)
              </h3>
              {finalScore != null && finalScore !== "" && !isEditingFinalScore ? (
                <div className="flex flex-row flex-nowrap items-center gap-3 justify-start">
                  <span className="text-2xl font-semibold text-foreground">
                    {finalScore}
                  </span>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={startEditFinalScore}
                  >
                    Edit
                  </Button>
                </div>
              ) : isEditingFinalScore ? (
                <div className="flex flex-row flex-nowrap items-center gap-2 justify-start">
                  <Input
                    type="number"
                    placeholder="Final score"
                    value={editFinalScoreValue}
                    onValueChange={setEditFinalScoreValue}
                    className="max-w-[120px] w-[120px]"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    color="primary"
                    onPress={() => saveFinalScore(editFinalScoreValue)}
                    isIconOnly
                    aria-label="Save"
                  >
                    <IoCheckmark />
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={cancelEditFinalScore}
                    isIconOnly
                    aria-label="Cancel"
                  >
                    <IoClose />
                  </Button>
                </div>
              ) : (
                <Form
                  id="finalScoreForm"
                  className="flex flex-row flex-nowrap items-center gap-2 justify-start w-full max-w-max"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = Object.fromEntries(
                      new FormData(e.currentTarget)
                    );
                    if (data.final != null && data.final !== "") {
                      saveFinalScore(data.final);
                      document.getElementById("finalScoreForm").reset();
                    }
                  }}
                >
                  <Input
                    label="Final score"
                    labelPlacement="inside"
                    name="final"
                    type="number"
                    placeholder="Final score"
                    className="max-w-[120px] w-[120px] shrink-0"
                  />
                  <Button type="submit" className="h-14">
                    Add final score
                  </Button>
                  {/* <Button
                fullWidth
                type="submit"
                variant="solid"
                color="secondary"
                className="h-14"
              > */}
                </Form>
              )}
            </div>
            {/* Data migration - commented out
            <div className="mt-6 pt-6 border-t border-default-200">
              <h3 className="text-sm font-medium text-default-600 mb-2">
                Data migration
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  color="default"
                  onPress={migrate2025To2026}
                >
                  Copy 2025 questions → 2026 (KC→NE, PHI→SEA)
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="default"
                  onPress={clear2026CorrectChoices}
                >
                  Clear correct choice (2026 only)
                </Button>
              </div>
            </div>
            */}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Add question
            </h2>
            <div className="rounded-xl overflow-hidden bg-default-50 p-6">
          <Form
            id="questionForm"
            className="grid gap-4 questionDrawerForm"
            onSubmit={(e) => {
              e.preventDefault();
              let data = Object.fromEntries(new FormData(e.currentTarget));
              onSubmitQuestion(data.prompt, data.choices);
              document.getElementById("questionForm").reset();
            }}
          >
            <div className="flex w-full md:flex-nowrap gap-4">
              <Input
                label="Prompt"
                labelPlacement="inside"
                name="prompt"
                type="text"
              />
              <Input
                label="Choices"
                labelPlacement="inside"
                name="choices"
                type="text"
              />
              <Button
                fullWidth
                type="submit"
                variant="solid"
                color="secondary"
                className="h-14"
              >
                Submit Question
              </Button>
            </div>
          </Form>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Questions
            </h2>
            <div className="max-w-5xl overflow-x-auto rounded-xl overflow-hidden border border-default-200 bg-default-100 dark:bg-default-100/20">
              <Table aria-label="Questions table">
                <TableHeader>
                  <TableColumn key="reorder" width={44} aria-label="Reorder" />
                  <TableColumn key="no">NO.</TableColumn>
                  <TableColumn key="prompt">PROMPT</TableColumn>
                  <TableColumn key="choices">CHOICES</TableColumn>
                  <TableColumn key="correct">CORRECT</TableColumn>
                  <TableColumn key="actions" align="end" width={60} />
                </TableHeader>
                <TableBody items={questionList}>
                  {(item) => (
                    <TableRow
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", item.id);
                        e.dataTransfer.effectAllowed = "move";
                        handleDragStart(item.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        handleDragOver(item.id);
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = e.dataTransfer.getData("text/plain");
                        handleDrop(draggedId, item.id);
                      }}
                      onDragEnd={handleDragEnd}
                      className={
                        draggedId === item.id
                          ? "opacity-50 bg-default-100 dark:bg-default-100/20"
                          : dropTargetId === item.id
                            ? "bg-primary-100/30 dark:bg-primary-900/20"
                            : undefined
                      }
                    >
                      <TableCell className="w-10 whitespace-nowrap">
                        <span
                          className="inline-flex cursor-grab active:cursor-grabbing text-default-500 hover:text-foreground select-none"
                          aria-label="Drag to reorder"
                        >
                          <IoReorderThree className="text-xl" />
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.order}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {item.prompt}
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(item.choices)
                            ? item.choices
                            : item.choices
                              ? [item.choices]
                              : []
                          ).map((choice, i) => (
                            <Chip
                              key={i}
                              size="sm"
                              variant="flat"
                              className="text-xs"
                            >
                              {String(choice).trim()}
                            </Chip>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.correctChoice == null ? (
                          <span className="text-default-400">—</span>
                        ) : (
                          <Chip size="sm" color="success" variant="flat">
                            {item.correctChoice}
                          </Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openDrawer(item)}
                          aria-label="Edit question"
                        >
                          <IoPencil fontSize="20px" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          { isDrawerOpen ? (
            <QuestionDrawer
            isOpen={isDrawerOpen}
            questionObject={selectedQuestion}
            year={currentYear}
            isClosed={closeDrawer}
          />
          ) : ( 
            <></>
          )}
        </>
      ) : (
        <>
          <h1>You don't have permissions to view this page.</h1>
          <h2>
            Return to{" "}
            <NavLink to="/dashboard" className="text-decoration: underline">
              Dashboard
            </NavLink>{" "}
          </h2>
        </>
      )}
    </div>
  );
}

export default Admin;
