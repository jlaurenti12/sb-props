import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { getDocs, collection, query, orderBy } from "firebase/firestore";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Skeleton,
  Chip,
} from "@heroui/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
];

function AnswerBreakdownDrawer({ isOpen, onClose, year }) {
  const [questions, setQuestions] = useState([]);
  const [entries, setEntries] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen || !year) return;
    let cancelled = false;
    const load = async () => {
      setIsLoaded(false);
      try {
        const [questionsSnap, entriesSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "games", year, "propQuestions"),
              orderBy("order")
            )
          ),
          getDocs(collection(db, "games", year, "propEntries")),
        ]);
        if (cancelled) return;
        const questionsData = questionsSnap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        }));
        const entriesData = entriesSnap.docs
          .map((d) => d.data())
          .filter((e) => e.responses && Array.isArray(e.responses));
        setQuestions(questionsData);
        setEntries(entriesData);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, year]);

  const breakdown = React.useMemo(() => {
    if (!questions.length || !entries.length) return [];
    return questions.map((q, qIndex) => {
      const counts = {};
      (q.choices || []).forEach((c) => {
        counts[c] = 0;
      });
      entries.forEach((entry) => {
        const choice = entry.responses[qIndex];
        if (choice != null) {
          counts[choice] = (counts[choice] ?? 0) + 1;
        }
      });
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const data = (q.choices || []).map((choice, i) => ({
        name: choice,
        value: counts[choice] ?? 0,
        percent: total > 0 ? Math.round(((counts[choice] ?? 0) / total) * 100) : 0,
      }));
      return { question: q, data, total };
    });
  }, [questions, entries]);

  return (
    <Drawer isOpen={isOpen} size="xl" onClose={onClose} backdrop="blur">
      <DrawerContent>
        {() => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              Answer breakdown
            </DrawerHeader>
            <DrawerBody className="px-4 pb-8">
              <Skeleton className="rounded-lg" isLoaded={isLoaded}>
                {!isLoaded ? (
                  <div className="h-64 rounded-lg bg-default-100" />
                ) : breakdown.length === 0 ? (
                  <p className="text-default-500 text-center py-8">
                    No entries or questions yet for this game.
                  </p>
                ) : (
                  <div className="grid gap-8">
                    {breakdown.map((item, idx) => {
                      const correctIndex =
                        item.question.correctChoice != null && item.question.correctChoice !== ""
                          ? (item.question.choices || []).indexOf(item.question.correctChoice)
                          : -1;
                      const isNA =
                        item.question.correctChoice === "N/A" ||
                        (item.question.correctChoice != null &&
                          item.question.correctChoice !== "" &&
                          correctIndex < 0);
                      const chartColorForCorrect =
                        isNA ? "#6b7280" : CHART_COLORS[correctIndex % CHART_COLORS.length];
                      const showCorrectChip =
                        item.question.correctChoice != null && item.question.correctChoice !== "";
                      return (
                      <div
                        key={item.question.id ?? idx}
                        className="rounded-xl bg-default-300 dark:bg-default-100/75 p-5"
                      >
                        <div className="text-small text-default-500 mb-1">
                          Question {idx + 1}
                        </div>
                        <div className="text-medium font-semibold mb-1">
                          {item.question.prompt}
                        </div>
                        {showCorrectChip && (
                            <div className="mb-4 flex items-center gap-2">
                              <span className="text-small text-default-500">Correct:</span>
                              <Chip
                                size="sm"
                                variant="flat"
                                style={{ backgroundColor: chartColorForCorrect, color: "#fff" }}
                              >
                                {item.question.correctChoice}
                              </Chip>
                            </div>
                        )}
                        <div className="flex justify-center items-center w-full">
                          <div className="w-full max-w-sm h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={item.data}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius="55%"
                                  outerRadius="85%"
                                  paddingAngle={2}
                                  dataKey="value"
                                >
                                  {item.data.map((_, i) => (
                                    <Cell
                                      key={i}
                                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                                      stroke={i === correctIndex ? "#fff" : "transparent"}
                                      strokeWidth={i === correctIndex ? 2 : 0}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value, name) => [
                                    `${value} (${item.total > 0 ? Math.round((value / item.total) * 100) : 0}%)`,
                                    name,
                                  ]}
                                  contentStyle={{
                                    borderRadius: "12px",
                                    border: "1px solid var(--default-200)",
                                  }}
                                />
                                <Legend
                                  layout="vertical"
                                  align="right"
                                  verticalAlign="middle"
                                  formatter={(value) => {
                                    const d = item.data.find((x) => x.name === value);
                                    return `${value} ${d ? d.percent : 0}%`;
                                  }}
                                  iconType="circle"
                                  iconSize={8}
                                  wrapperStyle={{ fontSize: "13px" }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </Skeleton>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default AnswerBreakdownDrawer;
