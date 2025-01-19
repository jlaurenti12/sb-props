import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { IoArrowForwardCircleSharp } from "react-icons/io5";
import { getDocs, collection, doc, query, updateDoc } from "firebase/firestore";
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
  } from "@heroui/react";

function Leaderboard({remaining}) {

    const [questionList, setQuestionList] = useState([]);
    const [quizList, setQuizList] = useState([]);
    const userCollectionRef = collection(db, "users");
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedScore, setSelectedScore] = useState(null);
    const [selectedMax, setSelectedMax] = useState(null);
    const [selectedResponses, setSelectedResponses] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    

    const fetchUsers = async () => {
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
        getScores(filteredUserData);
    };

    const getScores = async(users) => {

        const answerData = await getDocs(collection(db, "questions"));
        const filteredAnswerData = answerData.docs.map((doc) => ({
            ...doc.data(), 
        }));
        const answers = [];
        const quizzes = [];

        filteredAnswerData.map((question) => {
            answers.push(question.correctChoice);
        });


       users.map((user) => {
            user.quizzes.map((quiz) => {
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
                const quizDoc = doc(userCollectionRef, user.id, "quizzes", quiz.id);
                updateDoc(quizDoc, {score: score}) 
                quiz.isCompleted ? quizzes.push(quiz) :  <></>
            })
          })

          quizzes.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
          
        setQuizList(quizzes);
    };

    const getQuestionList = async() => {
        try {
            const data = await getDocs(collection(db, "questions"));
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
        fetchUsers();
        getQuestionList();
      }, []);


    return (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
              <span className="text-default-300 text-medium">Leaderboard</span>
          </div>
        <Table>
            <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>SCORE</TableColumn>
                <TableColumn>MAX SCORE</TableColumn>
                <TableColumn></TableColumn>
            </TableHeader>
            <TableBody>
                {quizList.map((quiz) => (
                    <TableRow>
                        <TableCell>{quiz.user}</TableCell>
                        <TableCell>{quiz.score}</TableCell>
                        <TableCell>{remaining + quiz.score}</TableCell>
                        <TableCell>
                            <Tooltip content="See Responses" className="dark">
                                <Button isIconOnly size="sm" variant="light" onPress={() => openDrawer(quiz.user, quiz.responses, quiz.score, remaining)} aria-label="">
                                    <IoArrowForwardCircleSharp font-size="24px"/>      
                                </Button>
                            </Tooltip>
                            <CustomDrawer isOpen={isDrawerOpen} userEntries={selectedResponses} userName={selectedUser} userScore={selectedScore} maxScore={selectedMax} isClosed={closeDrawer}/>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>

        </div>
    );
}

export default Leaderboard;

