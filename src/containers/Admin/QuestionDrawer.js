import React from "react";
import "../../assets/styles/Leaderboard.css";
import { db } from "../../services/firebase";
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import {
  Form,
  Input,
  Button,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/react";

function QuestionDrawer({ isOpen, isClosed, year, questionObject }) {
  let questionDoc;

  if (questionObject) {
    questionDoc = doc(db, "games", year, "propQuestions", questionObject.id);
  } else {
    questionDoc = "";
  }

  const updateQuestionPrompt = async (updatedQuestionPrompt) => {
    await updateDoc(questionDoc, { prompt: updatedQuestionPrompt });
  };

  const updateCorrectChoice = async (updatedCorrectChoice) => {
    await updateDoc(questionDoc, { correctChoice: updatedCorrectChoice });
  };

  const updateChoices = async (updatedChoices) => {
    await updateDoc(questionDoc, { choices: updatedChoices });
  };

  const deleteQuestion = async (id) => {
    await deleteDoc(questionDoc);
  };

  return (
    <Drawer isOpen={isOpen} size="md" onClose={isClosed} backdrop="blur">
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              {questionObject.prompt}
            </DrawerHeader>

            <DrawerBody>
              <div>
                <span className="text-default-300 text-small">
                  Prompt: {questionObject.prompt}
                </span>
                &nbsp;
              </div>
              <Form
                className="questionDrawerForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  let data = Object.fromEntries(new FormData(e.currentTarget));
                  updateQuestionPrompt(data.prompt);
                }}
              >
                <Input
                  label="New Prompt"
                  labelPlacement="inside"
                  name="prompt"
                  variant="bordered"
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="solid"
                  color="secondary"
                  onPress={onClose}
                >
                  Update Prompt
                </Button>
              </Form>
              <div>
                <span className="text-default-300 text-small">
                  Choices: {questionObject.choices}
                </span>
                &nbsp;
              </div>
              <Form
                className="questionDrawerForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  let data = Object.fromEntries(new FormData(e.currentTarget));
                  updateChoices(data.choices.split(","));
                }}
              >
                <Input
                  label="Choices"
                  labelPlacement="inside"
                  name="choices"
                  variant="bordered"
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="solid"
                  color="secondary"
                  onPress={onClose}
                >
                  Update Choices
                </Button>
              </Form>
              <div>
                <span className="text-default-300 text-small">
                  Correct Choice: {questionObject.correctChoice}
                </span>
                &nbsp;
              </div>
              <Form
                className="questionDrawerForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  let data = Object.fromEntries(new FormData(e.currentTarget));
                  updateCorrectChoice(data.correctChoice);
                }}
              >
                <Input
                  label="Correct Choice"
                  labelPlacement="inside"
                  name="correctChoice"
                  variant="bordered"
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="solid"
                  color="secondary"
                  onPress={onClose}
                >
                  Add Correct Choice
                </Button>
              </Form>
            </DrawerBody>
            <DrawerFooter className="flex flex-col gap-1">
              <Button
                className="w-full"
                type="submit"
                color="danger"
                variant="flat"
                onPress={
                  () => {deleteQuestion(questionObject.id); onClose()}
                }
              >
                Delete Question
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default QuestionDrawer;
