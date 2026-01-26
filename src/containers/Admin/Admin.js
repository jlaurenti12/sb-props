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
} from "firebase/firestore";
import {
  Form,
  Input,
  Button,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/react";
import QuestionDrawer from "./QuestionDrawer.js";
import { IoPencil } from "react-icons/io5";

function Admin() {
  const navigate = useNavigate();

  // For years
  const [currentYear, setCurrentYear] = useState("2026");
  const [years, setYears] = useState([]);

  const handleSelectionChange = (e) => {
    setCurrentYear(e.target.value);
  } 

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

  // For game status
  const [gameStarted, setGameStarted] = useState();
  const [gameOver, setGameOver] = useState();
  const statusDoc = doc(db, "games", currentYear);

  const getGameStatus = async () => {
    const docSnap = await getDoc(statusDoc);
    const data = docSnap.data();
    setGameStarted(data.gameStatus);
    setGameOver(data.gameOver);
    const d = [];
    const a = collection(db, "games");
    const b = await getDocs(a);
    const c = b.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id
    }));
    c.forEach((year) => {
      d.push({key: year.id, label: year.id})
    });
    setYears(d);
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

  const addFinalScore = async (final) => {
    await updateDoc(statusDoc, { finalScore: final });
    getGameStatus();
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

  return (
    <div>
      {isAdmin ? (
        <>
        <Select 
          label="Select a year"
          selectedKeys={[currentYear]}
          onChange={handleSelectionChange}
          >
            {years.map((year) => (
              <SelectItem key={year.key}>{year.label}</SelectItem>
            ))}
        </Select>
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

          <Form
            id="finalScoreForm"
            className="inline-grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              let data = Object.fromEntries(new FormData(e.currentTarget));
              addFinalScore(data.final);
              document.getElementById("finalScoreForm").reset();
            }}
          >
            <Input
              label="Final Score"
              labelPlacement="inside"
              name="final"
              type="number"
            />
            <Button type="submit">Add Final Score</Button>
          </Form>

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

          <Table>
            <TableHeader>
              <TableColumn>NO.</TableColumn>
              <TableColumn>PROMPT</TableColumn>
              <TableColumn>CHOICES</TableColumn>
              <TableColumn>CORRECT CHOICE</TableColumn>
              <TableColumn></TableColumn>
            </TableHeader>
            <TableBody>
              {questionList.map((question, index) => (
                <TableRow key={index}>
                  <TableCell>{question.order}</TableCell>
                  <TableCell>{question.prompt}</TableCell>
                  <TableCell>{question.choices}</TableCell>
                  {question.correctChoice == null ? (
                    <TableCell>--</TableCell>
                  ) : (
                    <TableCell>{question.correctChoice}</TableCell>
                  )}
                  <TableCell>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => openDrawer(question)}
                    >
                      <IoPencil fontSize="20px" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
