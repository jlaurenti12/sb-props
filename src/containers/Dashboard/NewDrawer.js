import React from "react";
import "../../assets/styles/Leaderboard.css";
import { IoCheckmark, IoClose, IoRemoveOutline } from "react-icons/io5";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/react";

function NewDrawer({
  isOpen,
  isClosed,
  quizData,
  maxScore,
  name,
  userEntries
}) {
  const statusColorMap = {
    Correct: "success",
    Incorrect: "danger",
  };

  console.log(quizData);

  const answerAccuracy = (response) => {
    if (response === "Correct") {
      return (
        <Chip color={statusColorMap[response]} size="sm" variant="flat">
          <IoCheckmark fontSize="20px" />
        </Chip>
      );
    } else if (response === "Incorrect") {
      return (
        <Chip color={statusColorMap[response]} size="sm" variant="flat">
          <IoClose fontSize="20px" />
        </Chip>
      );
    } else {
      return (
        <Chip color="default" size="sm" variant="flat">
          <IoRemoveOutline fontSize="20px" />
        </Chip>
      );
    }
  };

  return (
    
    <Drawer isOpen={isOpen} size="xl" onClose={isClosed} backdrop="blur">
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              {quizData.user === undefined ? name : quizData.user}
            </DrawerHeader>
            <DrawerBody className="px-4">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-lg bg-default-100 p-4 text-center">
                  <div className="text-small text-default-500 mb-1">Correct</div>
                  <div className="text-xl font-semibold">{quizData.score}</div>
                </div>
                <div className="rounded-lg bg-default-100 p-4 text-center">
                  <div className="text-small text-default-500 mb-1">Max</div>
                  <div className="text-xl font-semibold">{maxScore}</div>
                </div>
                <div className="rounded-lg bg-default-100 p-4 text-center">
                  <div className="text-small text-default-500 mb-1">Tiebreaker</div>
                  <div className="text-xl font-semibold">{quizData.tiebreaker}</div>
                </div>
              </div>

              <div className="min-w-0 w-full [&_table]:table-fixed [&_table]:w-full [&_th]:break-words [&_td]:break-words">
                <Table removeWrapper>
                  <TableHeader>
                    <TableColumn>QUESTION</TableColumn>
                    <TableColumn>ENTRY</TableColumn>
                    <TableColumn>CORRECT</TableColumn>
                    <TableColumn></TableColumn>
                  </TableHeader>
                  <TableBody>
                    {userEntries.map((responses, index) => (
                      <TableRow key={index}>
                        <TableCell>{responses[0]}</TableCell>
                        <TableCell>{responses[1]}</TableCell>
                        <TableCell>{responses[2]}</TableCell>
                        <TableCell className="max-w-[50px]">{answerAccuracy(responses[3])}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default NewDrawer;
