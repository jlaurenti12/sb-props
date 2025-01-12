import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { IoClose, IoArrowForwardCircleSharp } from "react-icons/io5";
import { getDocs, collection, doc, query, updateDoc } from "firebase/firestore";
import "../../assets/styles/Leaderboard.css";
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Tooltip,
    Button,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    useDisclosure,
  } from "@nextui-org/react";

function Leaderboard({remaining}) {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [questionList, setQuestionList] = useState([]);
    const [responseView, setResponseView] = useState([]);
    const [quizList, setQuizList] = useState([]);
    const userCollectionRef = collection(db, "users");

    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    const closeMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    }    
    
    const toggleMenu = (userQuizzes,quizID, questionList) => {

        console.log("clicked");

        setIsMenuOpen(!isMenuOpen);

        const arr = [];
        let arr2 = [];
        const arr3 = [];

        userQuizzes.map((quiz) => {
            quiz.id === quizID ? 

            quiz.responses.map((response) => {
                arr.push(response)
            })
            :
            <></>
        })

        for (let index = 0; index < questionList.length; index++) {
                arr2.push(questionList[index].prompt, arr[index]);
                arr3.push(arr2);
                arr2 = [];
            }

        console.log(arr3)
        setResponseView(arr3);

    };

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
                                <Button isIconOnly size="sm" variant="light" onPress={onOpen}>

                                    {/* onClick={() => toggleMenu(quizList, quiz.id, questionList)} */}
                                    <IoArrowForwardCircleSharp font-size="24px"/>
                                    
                                </Button>
                            </Tooltip>

                            <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
                                <DrawerContent>
                                {(onClose) => (
                                    <>
                                    <DrawerHeader className="flex flex-col gap-1">Drawer Title</DrawerHeader>
                                    <DrawerBody>
                                        <p>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non
                                        risus hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor
                                        quam.
                                        </p>
                                        <p>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non
                                        risus hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor
                                        quam.
                                        </p>
                                        <p>
                                        Magna exercitation reprehenderit magna aute tempor cupidatat consequat elit dolor
                                        adipisicing. Mollit dolor eiusmod sunt ex incididunt cillum quis. Velit duis sit
                                        officia eiusmod Lorem aliqua enim laboris do dolor eiusmod. Et mollit incididunt
                                        nisi consectetur esse laborum eiusmod pariatur proident Lorem eiusmod et. Culpa
                                        deserunt nostrud ad veniam.
                                        </p>
                                    </DrawerBody>
                                    {/* <DrawerFooter>
                                        <Button color="danger" variant="light" onPress={onClose}>
                                        Close
                                        </Button>
                                        <Button color="primary" onPress={onClose}>
                                        Action
                                        </Button>
                                    </DrawerFooter> */}
                                    </>
                                )}
                                </DrawerContent>
                            </Drawer>


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
                            )}   */}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>

        </div>
    );
}

export default Leaderboard;

