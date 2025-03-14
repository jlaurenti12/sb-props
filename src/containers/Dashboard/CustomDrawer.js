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
  Divider,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/react";

function CustomDrawer({
  isOpen,
  isClosed,
  userName,
  userEntries,
  userScore,
  tiebreaker,
  maxScore,
}) {
  const statusColorMap = {
    Correct: "success",
    Incorrect: "danger",
  };

  console.log(userName);

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
    <Drawer isOpen={isOpen} size="2xl" onClose={isClosed} backdrop="blur">
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              {userName}
            </DrawerHeader>
            <DrawerBody>
              <div className="margin-bottom: 16px">
                <span className="text-default-300 text-small">
                  Current score: {userScore}
                </span>
                &nbsp; &nbsp;
                <span className="text-default-300 text-small">
                  Max score: {maxScore}
                </span>
                &nbsp; &nbsp;
                <span className="text-default-300 text-small">
                  Tiebreaker: {tiebreaker}
                </span>
              </div>
              <div className="section-divider">
                <Divider className="my-4" />
              </div>

              <Table removeWrapper>
                <TableHeader>
                  <TableColumn>QUESTION</TableColumn>
                  <TableColumn>RESPONSE</TableColumn>
                  <TableColumn>CORRECT</TableColumn>
                  <TableColumn></TableColumn>
                </TableHeader>
                <TableBody>
                  {userEntries.map((responses) => (
                    <TableRow>
                      <TableCell>{responses[0]}</TableCell>
                      <TableCell>{responses[1]}</TableCell>
                      <TableCell>{responses[2]}</TableCell>
                      <TableCell>{answerAccuracy(responses[3])}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default CustomDrawer;
