import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../../services/firebase"; 
import { getDocs, collection, doc, updateDoc, addDoc, query, where } from "firebase/firestore";
import {RadioGroup, Button} from "@nextui-org/react";
import CustomRadio from "../../components/Radio/CustomRadio";
import "../../assets/styles/Quiz.css";


function Quiz() {

    const location = useLocation();
    const navigate = useNavigate();
    const [questionList, setQuestionList] = useState ([]);
    const [selectedChoices, setSelectedChoices] = useState ({});
    const userCollectionRef = collection(db, "users");
    const userID = location.state.id;
    

    const handleSelect = (questionPrompt, choice) => {
        setSelectedChoices(prev => ({
            ...prev,
            [questionPrompt]: choice
        }));
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

    const mapResponses = () => {
        const arr = [];
        questionList.map((question) => {
            for (let [key, value] of Object.entries(selectedChoices)) {
                if(key === question.prompt) arr.push(value);
            }
        });
        return arr;
    };

    // const onSaveQuiz = async() => {
    //     try {

    //         const arr = mapResponses();

    //         await updateDoc(a, {
    //             responses: arr,
    //           });

    //         return navigate("/");

    //     } catch(err) {
    //         console.error(err);
    //     }
    // };

    // const onSubmitQuiz = async (event) => {
    //     event.preventDefault();
    //     try {

    //         const arr = mapResponses();

    //         await updateDoc(a, {
    //           responses: arr,
    //           score: 0,
    //           isCompleted: true,
    //         });

    //         await updateDoc(b, {
    //          takenQuiz: true,
    //         });

    //         return navigate("/");

    //     } catch(err) {
    //         console.error(err);
    //     }
    // };

    const onSubmitQuiz = async (event) => {
       
        event.preventDefault();

        try {
           
            const arr = mapResponses();

            await addDoc(collection(userCollectionRef, userID, "quizzes"),{
                responses: arr,
                score: 0,
                isCompleted: true,
              });


            const b = doc(db, `users/${userID}`);

            await updateDoc(b, {
             takenQuiz: true,
            });

            return navigate("/");

        } catch(err) {
            console.error(err);
        }
    };


    const onDeleteQuiz = async () => {
        return navigate("/");
      };

    useEffect(() => {
        getQuestionList();
    }, [])


return (
    <div>
        {questionList.map((question) => (
            <div className="group-choices border-solid border-2 rounded-md p-4">
                <RadioGroup label={question.prompt}>
                    {question.choices.map((choice) => (
                        <CustomRadio
                            id={question.id} 
                            value={`${choice}`}
                            // checked={selectedChoices[question.prompt] === `${choice}`}
                            onChange={() => handleSelect(question.prompt, choice)} >
                        {choice}
                        </CustomRadio>
                    ))}
                </RadioGroup>
            </div>
        ))}

        <div className="flex flex-row justify-between">
            <Button onPress={onDeleteQuiz}>Cancel</Button>
            <Button color="primary" onClick={onSubmitQuiz}>Submit</Button>         
        </div>
    </div>
  );

}

export default Quiz;