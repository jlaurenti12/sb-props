import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../../services/firebase";
import {
  getDocs,
  collection,
  doc,
  updateDoc,
  addDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { RadioGroup, Button, Form, Skeleton, Input } from "@heroui/react";
import CustomRadio from "../../components/Radio/CustomRadio";

function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const [questionList, setQuestionList] = useState([]);
  const userCollectionRef = collection(db, "users");
  const userID = location.state.id;
  const [isLoaded, setIsLoaded] = useState(false);

  const getQuestionList = async () => {
    try {
      const questionsCollectionRef = collection(db, "questions");
      const data = await getDocs(
        query(questionsCollectionRef, orderBy("order"))
      );
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setQuestionList(filteredData);
      setIsLoaded(true);
    } catch (err) {
      console.error(err);
    }
  };

  const mapResponses = (data) => {
    const arr = [];
    questionList.map((question) => {
      for (let [key, value] of Object.entries(data)) {
        if (key === question.prompt) arr.push(value);
      }
    });
    return arr;
  };

  const onSubmitQuiz = async (data) => {
    try {
      const size = Object.keys(data).length;

      if (size < questionList.length + 1 || data.tiebreaker === "") {
        alert("Answer all questions to submit entry.");
        return;
      }

      const arr = mapResponses(data);

      await addDoc(collection(userCollectionRef, userID, "quizzes"), {
        responses: arr,
        score: 0,
        isCompleted: true,
        tiebreaker: Number(data.tiebreaker),
      });

      const b = doc(db, `users/${userID}`);

      await updateDoc(b, {
        takenQuiz: true,
      });

      return navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const onDeleteQuiz = async () => {
    return navigate("/");
  };

  useEffect(() => {
    getQuestionList();
  }, []);

  return (
    <div className="quiz">
      <Skeleton className="rounded-lg" isLoaded={isLoaded}>
        <Form
          className="grid"
          onSubmit={(e) => {
            e.preventDefault();
            let data = Object.fromEntries(new FormData(e.currentTarget));
            onSubmitQuiz(data);
          }}
        >
          <>
            {questionList.map((question) => (
              <div className="group-choices rounded-md p-4">
                <RadioGroup label={question.prompt} name={question.prompt}>
                  {question.choices.map((choice) => (
                    <CustomRadio
                      id={question.id}
                      value={`${choice}`}
                      className="radio"
                    >
                      {choice}
                    </CustomRadio>
                  ))}
                </RadioGroup>
              </div>
            ))}

            <Input
              type="number"
              isRequired
              errorMessage="Please enter a total score"
              label="Tiebreaker"
              labelPlacement="outside"
              placeholder="Total score - Price is right rules"
              name="tiebreaker"
            ></Input>
          </>

          <div className="quizSubmit flex gap-4">
            <Button fullWidth onPress={onDeleteQuiz}>
              Cancel
            </Button>
            <Button fullWidth type="submit" color="primary">
              Submit
            </Button>
          </div>
        </Form>
      </Skeleton>
    </div>
  );
}

export default Quiz;
