import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase.js";
import { getDocs, collection, addDoc, query, where, updateDoc, doc } from "firebase/firestore";
import {
  Form, 
  Input, 
  Button,   
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

  const [questionList, setQuestionList] = useState ([]);
  const questionsCollectionRef = collection(db, "questions");

  // For drawer
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // For game started
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

  const changeStatus = async() => {
    const statusDoc = doc(db, "status", "1KnxfOXfSOJFb5OdezcY");
    gameStarted === true ? ( await updateDoc(statusDoc, {gameStatus: false}) ) : ( await updateDoc(statusDoc, {gameStatus: true}) )
    getGameStatus();
  }

  const getQuestionList = async() => {
    try {
    const data = await getDocs(questionsCollectionRef);
    console.log(data);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(), 
      id: doc.id,
    }))
    console.log(filteredData);
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
        correctChoice: null
      });
      
      getQuestionList();

    } catch(err) {
      console.error(err);
    }
  };

  const openDrawer = (question) => {
    setSelectedQuestion(question);
    setIsDrawerOpen(true);
    getQuestionList();
  }

  const closeDrawer = () => {
    setSelectedQuestion(null);
    setIsDrawerOpen(false);
    getQuestionList();
  }

  useEffect(() => {
    getQuestionList();
    getGameStatus();
    setSelectedQuestion(null);
  }, [])

return (
    <div>

      <>
      {gameStarted ? (
        <Button onPress={()=> changeStatus()}>Unstart Game</Button>

      ) : (
        <Button onPress={()=> changeStatus()}color="primary">Start Game</Button>
      )}

      <Form
        id="questionForm"
        className="grid gap-4 questionDrawerForm"
        onSubmit={(e) => {
          e.preventDefault();
          let data = Object.fromEntries(new FormData(e.currentTarget));
          onSubmitQuestion(data.prompt, data.choices);
          document.getElementById('questionForm').reset();
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
          <Button fullWidth type="submit" variant="solid" color="secondary" className="h-14">
            Submit Question
          </Button>
        </div>

      </Form>
      </>


        <Table>

            <TableHeader>
                <TableColumn>PROMPT</TableColumn>
                <TableColumn>CHOICES</TableColumn>
                <TableColumn>CORRECT CHOICE</TableColumn>
                <TableColumn></TableColumn>
            </TableHeader>

            <TableBody>
            {questionList.map((question) => (
              <TableRow>
                <TableCell>{question.prompt}</TableCell>
                <TableCell>{question.choices}</TableCell>
                {question.correctChoice == null ? (
                  <TableCell>--</TableCell>
                ) : (
                  <TableCell>{question.correctChoice}</TableCell>
                )}  
                <TableCell>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openDrawer(question)}>
                    <IoPencil font-size="20px" />
                  </Button>
                  <QuestionDrawer isOpen={isDrawerOpen} questionObject={selectedQuestion} isClosed={closeDrawer}/>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>

        </Table>


  </div>
  );
}


export default Admin;