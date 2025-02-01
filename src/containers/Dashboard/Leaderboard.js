import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { IoArrowForwardCircleSharp } from "react-icons/io5";
import { getDocs, collection, doc, query, updateDoc, onSnapshot, orderBy } from "firebase/firestore";
import "../../assets/styles/Leaderboard.css";
import CustomDrawer from "./CustomDrawer.js";
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

function Leaderboard({remaining, status}) {

    console.log(status);

    const [questionList, setQuestionList] = useState([]);
    const [quizList, setQuizList] = useState([]);
    const userCollectionRef = collection(db, "users");
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedScore, setSelectedScore] = useState(null);
    const [selectedMax, setSelectedMax] = useState(null);
    const [selectedResponses, setSelectedResponses] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    

    const fetchAnswers = async() => {
        onSnapshot(collection(db, "questions"), (snapshot) => {
            getScores();
            getQuestionList();
        });
    };

    const getScores = async() => {

        const userData = await getDocs(collection(db, "users"));
        const filteredUserData = userData.docs.map((doc) => ({
            ...doc.data(), 
            id: doc.id,
            quizzes: [],
        }));

        await Promise.all (filteredUserData.map(async(user) => {
            const q = query(collection(userCollectionRef, user.id, "quizzes"));
            const a = await getDocs(q);
            const b = [];

            const snapshot = a.docs.map((quiz) => ({
                ...quiz.data(), 
                id: quiz.id,
            }));

            snapshot.map((quiz) => {
                user.quizzes.push(quiz);
              })  
            }) 
        )
        
        const answerData = await getDocs(query(collection(db, "questions"), orderBy("order")));
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
                        score ++;
                    }
                } 
                quiz.score = score;
                const bothNames = user.name.trim().split(' ');
                const initial = bothNames[1].substring(0,1);
                quiz.user = bothNames[0]+" "+initial;
                quiz.userId = user.id;
                const quizDoc = doc(userCollectionRef, user.id, "quizzes", quiz.id);
                updateDoc(quizDoc, {score: score}) 
                quiz.isCompleted ? quizzes.push(quiz) :  <></>
            })
          })

          quizzes.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
          
        setQuizList(quizzes);
        setIsLoaded(true);
    };

    const getQuestionList = async() => {
        try {
            const data = await getDocs(query(collection(db, "questions"), orderBy("order")));
            const filteredData = data.docs.map((doc) => ({
            ...doc.data(), 
            id: doc.id,
        }))
        setQuestionList(filteredData);
        } catch (err) {
            console.error(err);
        }
    };

    const openDrawer = (user, responses, score, remaining) => {
      setSelectedScore(score);
      setSelectedMax(score + remaining);
      setSelectedUser(user);
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
      setSelectedUser(null);
      setSelectedScore(null);
      setSelectedMax(null);
      setSelectedResponses([]);
      setIsDrawerOpen(false);
    }

    useEffect(() => {
        fetchAnswers();
        getQuestionList();
      }, []);


    return (
        <div className="flex flex-col gap-4">
          <div className="justify-between items-center table-header">
              <div className="text-default-300 text-medium ">Leaderboard</div>
              {status === false ? (
              <Skeleton className="rounded-lg" isLoaded={isLoaded}>
                 <div className="sub text-small">Other responses hidden until game time</div>
              </Skeleton>
              ): (
                <></>
              )}
          </div>
        <Skeleton className="rounded-lg" isLoaded={isLoaded}>
        <Table>
            <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>SCORE</TableColumn>
                <TableColumn>MAX</TableColumn>
                <TableColumn></TableColumn>
            </TableHeader>
            <TableBody>
                {quizList.map((quiz) => (
                    <TableRow>
                        <TableCell>{quiz.user}</TableCell>
                        <TableCell>{quiz.score}</TableCell>
                        <TableCell>{remaining + quiz.score}</TableCell>
                        <TableCell>
                        {status ? (
                            <>
                            <Tooltip delay={0} closeDelay={0} content="See responses" className="dark">
                                <Button isIconOnly size="sm" variant="light" onPress={() => openDrawer(quiz.user, quiz.responses, quiz.score, remaining)} aria-label="">
                                    <IoArrowForwardCircleSharp font-size="24px"/>      
                                </Button>
                            </Tooltip>
                            <CustomDrawer isOpen={isDrawerOpen} userEntries={selectedResponses} userName={selectedUser} userScore={selectedScore} maxScore={selectedMax} isClosed={closeDrawer}/>
                            </>
                        ) : (
                            <>
                            <Tooltip content="Other responses hidden until game time" className="dark">
                                <Button isIconOnly size="sm" variant="light" color="content4" aria-label="">
                                    <IoArrowForwardCircleSharp font-size="24px"/>      
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

        </div>
    );
}

export default Leaderboard;

