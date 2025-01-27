import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../../services/firebase"; 
import { getDocs, collection, doc, updateDoc, addDoc } from "firebase/firestore";
import { 
    RadioGroup, 
    Button,
    Form, 
} from "@heroui/react";
import CustomRadio from "../../components/Radio/CustomRadio";
import "../../assets/styles/Quiz.css";


function Quiz() {


    const location = useLocation();
    const navigate = useNavigate();
    const [questionList, setQuestionList] = useState ([]);
    const userCollectionRef = collection(db, "users");
    const userID = location.state.id;
    
    
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

    const mapResponses = (data) => {
        const arr = [];
        questionList.map((question) => {
            for (let [key, value] of Object.entries(data)) {
                if(key === question.prompt) arr.push(value);
            }
        });
        return arr;
    };

    const onSubmitQuiz = async (data) => {

        try {

            const size = Object.keys(data).length;

            if (size < questionList.length) {
                alert("Answer all questions to submit entry.");
                return
            }
           
            const arr = mapResponses(data);

            console.log(userID);

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
    <div className="quiz">
        <Form
            className="grid"
            onSubmit={(e) => {
                e.preventDefault();
                let data = Object.fromEntries(new FormData(e.currentTarget));

                onSubmitQuiz(data);
            }}>
            {questionList.map((question) => (
                <div className="group-choices border-solid border-2 rounded-md p-4">
                    <RadioGroup 
                        label={question.prompt}
                        name={question.prompt}
                        >
                        {question.choices.map((choice) => (
                            <CustomRadio
                                id={question.id} 
                                value={`${choice}`}
                                // checked={selectedChoices[question.prompt] === `${choice}`}
                                // onChange={() => handleSelect(question.prompt, choice)} 
                                >
                            {choice}
                            </CustomRadio>
                        ))}
                    </RadioGroup>
                </div>
            ))}

            <div className="flex gap-4">
                <Button fullWidth onPress={onDeleteQuiz}>Cancel</Button>
                <Button fullWidth type="submit" color="primary">Submit</Button>         
            </div>
        </Form>
    </div>
  );

}

export default Quiz;