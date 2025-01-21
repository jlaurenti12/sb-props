import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { getDocs, collection, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  useDisclosure,
} from "@heroui/react";
import { IoTrash, IoPencil } from "react-icons/io5";


function EditQuestions() {

  const [questionList, setQuestionList] = useState ([]);

  //   New question state
  const [correctChoice, setCorrectChoice] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const {isOpen, onOpen, onOpenChange} = useDisclosure();



  // Update prompt state
  const [updatedQuestionPrompt, setUpdatedQuestionPrompt] = useState("");

  const questionsCollectionRef = collection(db, "questions");

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

  useEffect(() => {
    getQuestionList();
  }, [])


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

  const deleteQuestion = async (id) => {
    const questionDoc = doc(db, "questions", id);
    await deleteDoc(questionDoc);
    getQuestionList();
  };

  const updateQuestionPrompt = async (event, id) => {
    event.preventDefault();
    document.getElementById(id + 1).reset();

    const questionDoc = doc(db, "questions", id);
    await updateDoc(questionDoc, {prompt: updatedQuestionPrompt})
      
    getQuestionList();
  };

  const setAnswer = async (event, id) => {
    event.preventDefault();
    document.getElementById(id + 2).reset();

    const questionDoc = doc(db, "questions", id);
    await updateDoc(questionDoc, {correctChoice: correctChoice})

    getQuestionList();
  };

return (
    <div>

      <>
      <Form
        id="questionForm"
        className="grid gap-4"
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
        </div>
        <Button fullWidth type="submit" variant="solid" color="secondary">
          Submit Question
        </Button>
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
                  <Button isIconOnly size="sm" variant="light" onPress={onOpen}>
                    <IoPencil font-size="20px" />
                  </Button>
                  <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
                    <DrawerContent>
                      {(onClose) => (
                        <>
                          <DrawerHeader className="flex flex-col gap-1">{selectedQuestion.prompt}</DrawerHeader>
                          <DrawerBody>
                          <Form
                              className="grid gap-4"
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
                              </div>
                              <Button fullWidth type="submit" variant="solid" color="secondary">
                                Update Prompt
                              </Button>
                          </Form>

                            <Input
                              label="Email"
                              placeholder="Enter your email"
                              variant="bordered"
                            />
                            <Input
                              label="Password"
                              placeholder="Enter your password"
                              type="password"
                              variant="bordered"
                            />
                          </DrawerBody>
                          <DrawerFooter>
                            <Button color="danger" variant="flat" onPress={onClose}>
                              Close
                            </Button>
                            <Button color="primary" onPress={onClose}>
                              Sign in
                            </Button>
                          </DrawerFooter>
                        </>
                      )}
                    </DrawerContent>
                  </Drawer>
                  <Button isIconOnly size="sm" variant="light" onPress={() => deleteQuestion(question.id)}>
                    <IoTrash font-size="20px" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>

        </Table>

            {/* <h3>{question.prompt}</h3>

            <h4>Choices:</h4>
            {question.choices.map((choice) => (
                <p>{choice}</p>
            ))}

            <form id={question.id + 1} onSubmit={(e) => updateQuestionPrompt(e, question.id)}>
              <input 
                id="updatePrompt"
                placeholder='New Prompt' 
                onChange={(e) => setUpdatedQuestionPrompt(e.target.value)} 
              />
              <input type="submit" value="Update Question" /> 
            </form>

            <form id={question.id + 2} onSubmit={(e) => setAnswer(e, question.id)}> 
              <input 
                placeholder='Correct choice' 
                onChange={(e) => setCorrectChoice(e.target.value)} 
              />
              <input type="submit" value="Set Correct Choice" id="updatePrompt" />  
            </form>     
     
            <button 
                type="delete" 
                onClick={() => deleteQuestion(question.id)}> 
                Delete Question
            </button>  */}


  </div>
  );
}


export default EditQuestions;