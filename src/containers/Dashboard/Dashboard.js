import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../services/firebase";
import { IoArrowForwardCircleSharp } from "react-icons/io5";
import {
  getDocs,
  collection,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import Leaderboard from "./Leaderboard";
import CustomDrawer from "./CustomDrawer.js";
import "../../assets/styles/Leaderboard.css";
import { IoEllipsisHorizontalCircleSharp } from "react-icons/io5";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Tooltip,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Button,
  Divider
} from "@heroui/react";


function Dashboard() {

  const [user, loading] = useAuthState(auth);
  const [questionList, setQuestionList] = useState([]);
  const navigate = useNavigate();
  const userCollectionRef = collection(db, "users");
  const [quizList, setQuizList] = useState([]);
  const [quizID, setQuizID] = useState("");
  const [userID, setUserID] = useState("");
  const [name, setName] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState("");
  const [selectedScore, setSelectedScore] = useState(null);
  const [selectedMax, setSelectedMax] = useState(null);
  const [selectedResponses, setSelectedResponses] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState();


  const getGameStatus = async() => {
    const gameCollectionRef = collection(db, "status");
    const q = query(gameCollectionRef, where("uid", "==", "1KnxfOXfSOJFb5OdezcY"));
    const doc = await getDocs(q);
    const snapshot = doc.docs[0];
    const data = snapshot.data();
    console.log(data);
    setGameStarted(data.gameStatus);
  }


  const getRemainingQuestions = (questions) => {
    let total = 0;
    questions.map((question) => {
      question.correctChoice ? total++ : <></>;
    });
    setRemainingQuestions(20 - total);
  };

  const getQuestionList = async () => {
    try {
      const data = await getDocs(collection(db, "questions"));
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setQuestionList(filteredData);
      getRemainingQuestions(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  const getScores = async() => {
    const q = query(userCollectionRef, where("uid", "==", user?.uid));
    const person = await getDocs(q);
    const snapshot = person.docs[0].id;

    const a = await getDocs(collection(userCollectionRef, snapshot, "quizzes"));

    const data = a.docs.map((quiz) => ({
      ...quiz.data(), 
      id: quiz.id,
    }));
    
    console.log(data);

    const answerData = await getDocs(collection(db, "questions"));
      
    const filteredAnswerData = answerData.docs.map((doc) => ({
          ...doc.data(), 
      }));
      const answers = [];
      const quizzes = [];

      filteredAnswerData.map((question) => {
          answers.push(question.correctChoice);
      });

      console.log(filteredAnswerData);


        data.map((quiz) => {
            let score = 0;
            quiz.responses?.map((response => {
                for (let index = 0; index < quiz.responses.length; index++) {
                    if (response === answers[index]) {
                        score ++;
                    }
                } 
            }))
            quiz.score = score;
            quiz.user = user.name;
            quiz.userId = user.id;
            const quizDoc = doc(userCollectionRef, snapshot, "quizzes", quiz.id);
            updateDoc(quizDoc, {score: score}) 
            quiz.isCompleted ? quizzes.push(quiz) :  <></>
        })

        quizzes.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
        
      setQuizList(quizzes);
  };

  const fetchUser = async () => {
    const q = query(userCollectionRef, where("uid", "==", user?.uid));
    const doc = await getDocs(q);
    const snapshot = doc.docs[0].id;
    setUserID(snapshot);
    return snapshot;
  };

  const fetchUserName = async () => {
    try {
      const q = query(userCollectionRef, where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const snapshot = doc.docs[0];
      const data = snapshot.data();
      setName(data.name);
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };

  const fetchUserStatus = async () => {
    try {
      const id = await fetchUser();
      const q = query(collection(userCollectionRef, id, "quizzes"));
      const doc = await getDocs(q);

      const filteredData = doc.docs.map((doc) => ({
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


  const onStartQuiz = async() => {
    return navigate("/quiz", { state: {id: userID}});
  };
  
  const onContinueQuiz = async (id) => {
    setQuizID(id)
    return navigate(`quiz/${id}`);
  };

  const onDeleteQuiz = async (id) => {
    const userId = await fetchUser();
    const quizDoc = doc(db, `users/${userId}/quizzes`, id);
    await deleteDoc(quizDoc);
    fetchUserStatus();
  };


  const openDrawer = (responses, score, remaining) => {
    setSelectedScore(score);
    setSelectedMax(score + remaining);
    let arr = [];
    let arr2 = [];

    for (let index = 0; index < questionList.length; index++) {

        if (questionList[index].correctChoice == null) {
            arr.push(questionList[index].prompt, responses[index], "--", "--")
        } else if (questionList[index].correctChoice == responses[index]) {
            arr.push(questionList[index].prompt, responses[index], questionList[index].correctChoice, "Correct")
        } else {
            arr.push(questionList[index].prompt, responses[index], questionList[index].correctChoice, "Incorrect")
        }

        arr2.push(arr);
        arr = [];
    }

    setSelectedResponses(arr2);
    setIsDrawerOpen(true);
  }

  const closeDrawer = () => {
    setSelectedScore(null);
    setSelectedMax(null);
    setSelectedResponses([]);
    setIsDrawerOpen(false);
  }


  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/");

    fetchUserStatus();
    getQuestionList();
    fetchUserName();
    getScores();
    getGameStatus();
  }, [user, loading]);

  return (
    <div>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
              <span className="text-default-300 text-medium">Your entries</span>
            {gameStarted ? (
              <></>
            ) : (
              <Button color="secondary" onPress={onStartQuiz}>Add Entry</Button>
            )}

          </div>
            <Table>
              <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>SCORE</TableColumn>
                  <TableColumn>MAX SCORE</TableColumn>
                  <TableColumn></TableColumn>
              </TableHeader>

            {quizList.length === 0 ? (

              <TableBody emptyContent={"You haven't submitted an entry yet."}>{[]}</TableBody>

            ) : (

            <TableBody>
                {quizList.map((quiz) =>
                    quiz.isCompleted ? (
                    <TableRow>
                        <TableCell>{name}</TableCell>
                        <TableCell>{quiz.score}</TableCell>
                        <TableCell>{remainingQuestions + quiz.score}</TableCell>
                        {/* <TableCell>                       
                            <div className="relative flex justify-end cursor-pointer items-center gap-2">
                            <Dropdown className="dark">
                              <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                  <IoEllipsisHorizontalCircleSharp font-size="24px"/>
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu className="dark">
                                <DropdownItem onPress={() => openDrawer(quiz.responses, quiz.score, remainingQuestions)}>See Responses
                                </DropdownItem>
                                <DropdownItem onPress={() => onContinueQuiz(quiz.id)}>Edit</DropdownItem>
                                <DropdownItem onPress={() => onDeleteQuiz(quiz.id)}>Delete</DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>   
                          <CustomDrawer isOpen={isDrawerOpen} userEntries={selectedResponses} userName={name} userScore={selectedScore} maxScore={selectedMax} isClosed={closeDrawer}/>
                        </TableCell> */}
                        <TableCell>
                            <Tooltip content="See your responses" className="dark">
                                <Button isIconOnly size="sm" variant="light" onPress={() => openDrawer(quiz.responses, quiz.score, remainingQuestions)} aria-label="">
                                    <IoArrowForwardCircleSharp font-size="24px"/>      
                                </Button>
                            </Tooltip>
                            <CustomDrawer isOpen={isDrawerOpen} userEntries={selectedResponses} userName={name} userScore={selectedScore} maxScore={selectedMax} isClosed={closeDrawer}/>
                        </TableCell>
                    </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell>{name}</TableCell>
                        <TableCell>--</TableCell>
                        <TableCell>--</TableCell>
                        <TableCell>
                            <div className="relative flex justify-end cursor-pointer items-center gap-2">
                              <Dropdown className="dark">
                                <DropdownTrigger>
                                  <Button isIconOnly size="sm" variant="light">
                                    <IoEllipsisHorizontalCircleSharp font-size="24px" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu>
                                  <DropdownItem onPress={() => onContinueQuiz(quiz.id)}>Continue</DropdownItem>
                                  <DropdownItem onPress={() => onDeleteQuiz(quiz.id)}>Delete</DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                        </TableCell>
                      </TableRow>
                ))}
              </TableBody>
            )}
            </Table>

            <div className="section-divider">
              <Divider className="my-4" />
            </div>
 
          <Leaderboard remaining={remainingQuestions} status={gameStarted} />
        </div>
      {/* )} */}
    </div>
  );
}

export default Dashboard;
