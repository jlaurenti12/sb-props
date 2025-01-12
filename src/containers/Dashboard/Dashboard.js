import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../services/firebase";
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
import "../../assets/styles/Leaderboard.css";
import { IoEllipsisHorizontalCircleSharp } from "react-icons/io5";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Button,
  Divider
} from "@nextui-org/react";


function Dashboard() {

  const colors = ["default", "primary", "secondary", "success", "warning", "danger"];


  const [user, loading] = useAuthState(auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [responseView, setResponseView] = useState([]);
  const [questionList, setQuestionList] = useState([]);
  const navigate = useNavigate();
  const userCollectionRef = collection(db, "users");
  const [quizList, setQuizList] = useState([]);
  const [quizID, setQuizID] = useState("");
  const [userID, setUserID] = useState("");
  const [name, setName] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState("");
  const [selectedColor, setSelectedColor] = React.useState("default");


  const closeMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleMenu = (userQuizzes, quizID, questionList) => {
    setIsMenuOpen(!isMenuOpen);

    const arr = [];
    let arr2 = [];
    const arr3 = [];

    userQuizzes.map((quiz) => {
      quiz.id === quizID ? (
        quiz.responses.map((response) => {
          arr.push(response);
        })
      ) : (
        <></>
      );
    });

    for (let index = 0; index < questionList.length; index++) {
      arr2.push(questionList[index].prompt, arr[index]);
      arr3.push(arr2);
      arr2 = [];
    }
    setResponseView(arr3);
  };

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

  // const onStartQuiz = async () => {
  //   // const id = await fetchUser();

  //   // console.log(id);

  //   // const newQuizAdded = await addDoc(
  //   //   collection(userCollectionRef, id, "quizzes"),
  //   //   {
  //   //     responses: [],
  //   //     score: 0,
  //   //     isCompleted: false,
  //   //   }
  //   // );

  //   // const a = newQuizAdded.id;
  //   // setQuizID(a);
  // };


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

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/");

    fetchUserStatus();
    getQuestionList();
    fetchUserName();
    getScores();
  }, [user, loading]);

  return (
    <div>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
              <span className="text-default-300 text-medium">Your entries</span>
            <Button color="primary" onPress={onStartQuiz}>
              Add Entry
            </Button>
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
                        <TableCell>                       
                            <div className="relative flex justify-end cursor-pointer items-center gap-2">
                            <Dropdown className="dark">
                              <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                  <IoEllipsisHorizontalCircleSharp font-size="24px"/>
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu className="dark">
                                <DropdownItem onPress={() => onContinueQuiz(quiz.id)}>Edit</DropdownItem>
                                <DropdownItem onPress={() => onDeleteQuiz(quiz.id)}>Delete</DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                                      
                              {/* { isMenuOpen ? (
                              <div
                              className={"answer__menu show-menu"}
                              id="nav-menu"
                              >
                                  {responseView.map((responses) => 
                                      <li className="nav__link">{responses}</li>
                                  )}
                                  <div 
                                      className="answer__close" 
                                      id="answer-close" 
                                      onClick={closeMenu}
                                      >
                                      <IoClose />
                                  </div>
                              </div>  
                              ) : (
                                  <></>
                              )} */}
                          </div>   
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
 
          <Leaderboard remaining={remainingQuestions} />
        </div>
      {/* )} */}
    </div>
  );
}

export default Dashboard;
