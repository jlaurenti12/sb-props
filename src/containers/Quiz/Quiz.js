import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../../services/firebase";
import { AnimatePresence, motion } from "framer-motion";
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
  const userID = location.state?.id;
  const year = location.state?.year;
  const [isLoaded, setIsLoaded] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0); // 0..questionList.length (last index is tiebreaker)
  const [direction, setDirection] = useState(1); // -1 back, +1 forward (for animations)
  const [answersById, setAnswersById] = useState({});
  const [tiebreaker, setTiebreaker] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const autoAdvanceTimerRef = useRef(null);

  const isTiebreakerStep = currentIndex === questionList.length;
  const totalQuestions = questionList.length;
  const totalSteps = totalQuestions + 1; // + tiebreaker
  const completedQuestions = useMemo(() => {
    return questionList.reduce((count, q) => (answersById[q.id] != null ? count + 1 : count), 0);
  }, [answersById, questionList]);

  const progressPct = useMemo(() => {
    if (isReviewing) return 100;
    if (totalSteps === 0) return 0;
    // currentIndex ranges [0..totalQuestions], so step number is currentIndex+1
    return Math.round(((currentIndex + 1) / totalSteps) * 100);
  }, [currentIndex, isReviewing, totalSteps]);

  const goToIndex = (nextIndex) => {
    const clamped = Math.max(0, Math.min(nextIndex, questionList.length));
    setDirection(clamped >= currentIndex ? 1 : -1);
    setCurrentIndex(clamped);
  };

  const goBack = () => {
    if (isReviewing) {
      setIsReviewing(false);
      setDirection(-1);
      setCurrentIndex(questionList.length);
      return;
    }
    if (currentIndex === 0) return;
    setDirection(-1);
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    if (isReviewing) return;

    // Tiebreaker step -> Review
    if (isTiebreakerStep) {
      if (tiebreaker.trim() === "") return;
      setIsReviewing(true);
      setHasReviewed(true);
      return;
    }

    // Question step -> next question or tiebreaker
    const q = questionList[currentIndex];
    if (!q) return;
    if (answersById[q.id] == null) return;

    setDirection(1);
    setCurrentIndex((i) => Math.min(questionList.length, i + 1));
  };

  const onSubmitQuiz = async () => {
    try {
      const responses = questionList.map((q) => answersById[q.id]);
      const missing = responses.some((v) => v == null);
      const tiebreakerNumber = Number(tiebreaker);

      if (missing || tiebreaker.trim() === "" || Number.isNaN(tiebreakerNumber)) {
        alert("Answer all questions to submit entry.");
        return;
      }

      await addDoc(collection(db, "games", year, "propEntries"), {
        responses,
        score: 0,
        isCompleted: true,
        tiebreaker: tiebreakerNumber,
        user: doc(db, `users/${userID}`),
      });

      const b = doc(db, `users/${userID}`);

      await updateDoc(b, {
        takenQuiz: true,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  const onDeleteQuiz = async () => {
    return navigate("/");
  };

  useEffect(() => {
    if (!userID || !year) {
      navigate("/dashboard");
      return;
    }

    let isCancelled = false;
    const run = async () => {
      try {
        const questionsCollectionRef = collection(db, "games", year, "propQuestions");
        const data = await getDocs(query(questionsCollectionRef, orderBy("order")));
        if (isCancelled) return;
        const filteredData = data.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        }));
        setQuestionList(filteredData);
        setIsLoaded(true);
      } catch (err) {
        console.error(err);
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, [navigate, userID, year]);

  useEffect(() => {
    // Clear any pending auto-advance when changing steps
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, [currentIndex, isReviewing]);

  const currentQuestion = !isReviewing && !isTiebreakerStep ? questionList[currentIndex] : null;
  const canGoBack = isReviewing || currentIndex > 0;
  const canGoNext = useMemo(() => {
    if (isReviewing) return false;
    if (!isLoaded) return false;
    if (isTiebreakerStep) return tiebreaker.trim() !== "";
    if (!currentQuestion) return false;
    return answersById[currentQuestion.id] != null;
  }, [answersById, currentQuestion, isLoaded, isReviewing, isTiebreakerStep, tiebreaker]);

  const handleChoiceChange = (value) => {
    if (!currentQuestion) return;
    const nextValue = typeof value === "string" ? value : value?.target?.value;

    setAnswersById((prev) => ({
      ...prev,
      [currentQuestion.id]: nextValue,
    }));

    // Auto-advance (Typeform feel)
    // if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    // autoAdvanceTimerRef.current = setTimeout(() => {
    //   setDirection(1);
    //   setCurrentIndex((i) => Math.min(questionList.length, i + 1));
    // }, 220);
  };

  const handleQuizKeyDown = (e) => {
    if (e.key !== "Enter") return;
    if (isReviewing || !canGoNext) return;
    // On tiebreaker step, let the form's onSubmit handle Enter from the input
    if (isTiebreakerStep && e.target.tagName === "INPUT") return;
    e.preventDefault();
    goNext();
  };

  const stepKey = isReviewing ? "review" : isTiebreakerStep ? "tiebreaker" : `q-${currentQuestion?.id ?? currentIndex}`;
  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
  };

  const renderFooterButtons = () => {
    if (isSubmitted) return null;
    if (isReviewing) {
      return null;
    }
    if (isTiebreakerStep) {
      if (hasReviewed) {
        return (
          <Button
            fullWidth
            color="primary"
            onPress={() => setIsReviewing(true)}
          >
            Save and Go to Review
          </Button>
        );
      }
      return (
        <>
          <Button fullWidth variant="flat" onPress={goBack} isDisabled={!canGoBack}>
            Back
          </Button>
          <Button fullWidth color="primary" onPress={goNext} isDisabled={!canGoNext}>
            Review
          </Button>
        </>
      );
    }
    if (hasReviewed) {
      return (
        <Button fullWidth color="primary" onPress={() => setIsReviewing(true)}>
          Save and Go to Review
        </Button>
      );
    }
    return (
      <>
        <Button fullWidth variant="flat" onPress={goBack} isDisabled={!canGoBack}>
          Back
        </Button>
        <Button fullWidth color="primary" onPress={goNext} isDisabled={!canGoNext}>
          Next
        </Button>
      </>
    );
  };

  return (
    <div
      className="quiz max-w-2xl mx-auto w-full p-4"
      onKeyDown={handleQuizKeyDown}
    >
      <Skeleton className="rounded-lg" isLoaded={isLoaded}>
        <div className="grid gap-4">
          {!isSubmitted && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="text-small text-default-500 whitespace-nowrap">
                  {isReviewing
                    ? "Review answers"
                    : isTiebreakerStep
                      ? `Tiebreaker`
                      : `Question ${Math.min(currentIndex + 1, totalQuestions)}/${totalQuestions}`}
                </div>
                <div className="h-2 w-full bg-content2 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <Button size="sm" variant="light" onPress={onDeleteQuiz}>
                Exit
              </Button>
            </div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepKey}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="grid gap-4"
            >
                {isSubmitted ? (
                  <div className="rounded-lg bg-content1 p-6 text-center grid gap-4">
                    <div className="text-xl font-semibold">Entry submitted!</div>
                    <div className="text-default-600">
                      Please Venmo $20 to <span className="font-semibold text-foreground whitespace-nowrap">@Jacob-Laurenti</span> to complete your entry. Don't mention anything about betting in the description.
                    </div>
                    <Button fullWidth color="primary" onPress={() => navigate("/")}>
                      Back to Dashboard
                    </Button>
                  </div>
                ) : isReviewing ? (
                  <div className="grid gap-3 pb-24">
                    {questionList.map((q, idx) => {
                      const answer = answersById[q.id];
                      const isMissing = answer == null;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            setIsReviewing(false);
                            goToIndex(idx);
                          }}
                          className={[
                            "text-left rounded-lg p-4 border transition-colors",
                            isMissing ? "border-danger/50 bg-danger/5" : "border-default-200 bg-content1",
                          ].join(" ")}
                        >
                          <div className="text-small text-default-500">Question {idx + 1}</div>
                          <div className="text-medium font-semibold mt-1">{q.prompt}</div>
                          <div className="text-small mt-2">
                            <span className="text-default-500">Your answer: </span>
                            <span className={isMissing ? "text-danger" : ""}>
                              {isMissing ? "Not answered" : answer}
                            </span>
                          </div>
                          <div className="text-small text-primary mt-2">Edit</div>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setIsReviewing(false);
                        goToIndex(questionList.length);
                      }}
                      className="text-left rounded-lg p-4 border border-default-200 bg-content1 transition-colors hover:bg-content2"
                    >
                      <div className="text-small text-default-500">Tiebreaker</div>
                      <div className="text-medium font-semibold mt-1">
                        {tiebreaker.trim() === "" ? "Not set" : tiebreaker}
                      </div>
                      <div className="text-small text-primary mt-2">Edit</div>
                    </button>
                  </div>
                ) : null}
                {!isSubmitted && !isReviewing && isTiebreakerStep ? (
                  <Form
                    id="quiz-tiebreaker-form"
                    className="grid gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      goNext();
                    }}
                  >
                    <div>
                      <div className="text-large font-semibold mt-2">Tiebreaker</div>
                      <div className="text-small text-default-500">
                        Enter the total score (Price is Right rules).
                      </div>
                    </div>
                   
                    <Input
                      type="number"
                      isRequired
                      errorMessage="Please enter a total score"
                      label="TOTAL SCORE"
                      labelPlacement="outside"
                      placeholder="e.g. 54"
                      value={tiebreaker}
                      onChange={(e) => setTiebreaker(e.target.value)}
                    />
                  </Form>
                ) : !isSubmitted && !isReviewing ? (
                  <div className="grid gap-4">
                    <div className="text-large font-semibold mt-2">{currentQuestion?.prompt}</div>
                    <RadioGroup
                      aria-label={currentQuestion?.prompt ?? "Question"}
                      value={currentQuestion ? answersById[currentQuestion.id] ?? "" : ""}
                      onValueChange={handleChoiceChange}
                    >
                      {currentQuestion?.choices?.map((choice) => (
                        <CustomRadio
                          key={`${currentQuestion.id}-${choice}`}
                          id={currentQuestion.id}
                          value={`${choice}`}
                          className="radio"
                        >
                          {choice}
                        </CustomRadio>
                      ))}
                    </RadioGroup>
                  </div>
                ) : null}
            </motion.div>
          </AnimatePresence>

          {isReviewing && !isSubmitted && (
            <div className="fixed bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur border-t border-default-200 p-4">
              <div className="max-w-2xl mx-auto flex">
                <Button
                  className="w-full max-w-sm mx-auto"
                  color="primary"
                  onPress={onSubmitQuiz}
                  isDisabled={completedQuestions !== totalQuestions || tiebreaker.trim() === ""}
                >
                  Submit Entry
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {renderFooterButtons()}
          </div>
        </div>
      </Skeleton>
    </div>
  );
}

export default Quiz;
