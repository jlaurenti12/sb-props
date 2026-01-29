import React, { useEffect, useState } from "react";
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
  const [prompt, setPrompt] = useState("");
  const [choicesText, setChoicesText] = useState("");
  const [correctChoice, setCorrectChoice] = useState("");

  const questionDoc = questionObject
    ? doc(db, "games", year, "propQuestions", questionObject.id)
    : null;

  useEffect(() => {
    if (questionObject) {
      setPrompt(questionObject.prompt ?? "");
      setChoicesText(
        Array.isArray(questionObject.choices)
          ? questionObject.choices.join(", ")
          : questionObject.choices ?? ""
      );
      setCorrectChoice(questionObject.correctChoice ?? "");
    }
  }, [questionObject, isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!questionDoc) return;
    try {
      await updateDoc(questionDoc, {
        prompt: prompt.trim(),
        choices: choicesText.split(",").map((c) => c.trim()).filter(Boolean),
        correctChoice: correctChoice.trim() || null,
      });
      isClosed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    isClosed();
  };

  const handleDelete = async () => {
    if (!questionDoc || !window.confirm("Delete this question? This cannot be undone.")) return;
    try {
      await deleteDoc(questionDoc);
      isClosed();
    } catch (err) {
      console.error(err);
    }
  };

  if (!questionObject) return null;

  return (
    <Drawer isOpen={isOpen} size="md" onClose={isClosed} backdrop="blur">
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              Edit question
            </DrawerHeader>

            <DrawerBody>
              <Form
                id="edit-question-form"
                className="flex flex-col gap-4"
                onSubmit={handleSave}
              >
                <Input
                  label="Prompt"
                  labelPlacement="outside"
                  placeholder="Question prompt"
                  value={prompt}
                  onValueChange={setPrompt}
                  variant="bordered"
                  description="The question text shown to users."
                />
                <Input
                  label="Choices"
                  labelPlacement="outside"
                  placeholder="Choice 1, Choice 2, Choice 3"
                  value={choicesText}
                  onValueChange={setChoicesText}
                  variant="bordered"
                  description="Separate choices with commas."
                />
                <Input
                  label="Correct choice"
                  labelPlacement="outside"
                  placeholder="Exact text of the correct choice"
                  value={correctChoice}
                  onValueChange={setCorrectChoice}
                  variant="bordered"
                  description="Must match one of the choices exactly, or leave blank."
                />
              </Form>

              <div className="mt-6 pt-4 border-t border-default-200">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-sm text-danger hover:underline focus:outline-none focus:underline"
                >
                  Delete question
                </button>
              </div>
            </DrawerBody>

            <DrawerFooter className="flex gap-2 justify-end">
              <Button variant="flat" onPress={handleCancel}>
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                form="edit-question-form"
              >
                Save
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default QuestionDrawer;
