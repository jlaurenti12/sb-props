import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { getDocs, collection, addDoc, deleteDoc, updateDoc, doc, query, where } from "firebase/firestore";


function EditQuestions() {

  const [questionList, setQuestionList] = useState ([]);

  //   New question state
  const [newQuestionPrompt, setNewQuestionPrompt] = useState("");
  const [newQuestionChoices, setNewQuestionChoices] = useState([]);
  const [correctChoice, setCorrectChoice] = useState("");


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


  const onSubmitQuestion = async (event) => {

    event.preventDefault();

    document.getElementById("questionForm").reset();
    
    try {
      await addDoc(questionsCollectionRef, {
        prompt: newQuestionPrompt,
        choices: newQuestionChoices.split(","),
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

      <h1>Admin</h1>  

      <form id="questionForm" onSubmit={onSubmitQuestion}>
        <h3>Add question</h3>
        <input
          placeholder="Prompt"
          onChange={(e) => setNewQuestionPrompt(e.target.value)} 
        />
        <input 
          placeholder="Choices" 
          onChange={(e) => setNewQuestionChoices(e.target.value)} 
        />
        <input type="submit" value="Submit Question" />
      </form>

      {questionList.map((question) => (

        <div>

          {/* <form> */}

            <h3>{question.prompt}</h3>

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
     

          {/* </form> */}

            <button 
                type="delete" 
                onClick={() => deleteQuestion(question.id)}> 
                Delete Question
            </button> 



        </div>


      ))}

  </div>
  );
}


export default EditQuestions;