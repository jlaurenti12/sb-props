import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { getDocs, collection, doc, query, updateDoc } from "firebase/firestore";
import "../../assets/styles/Leaderboard.css";
import { IoCheckmark, IoClose } from "react-icons/io5";
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Chip,
    Tooltip,
    Button,
    Divider,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    useDisclosure,
  } from "@heroui/react";

function CustomDrawer({isOpen, isClosed, userName, userEntries, userScore, maxScore}) {

    const statusColorMap = {
        Correct: "success",
        Incorrect: "danger",
      };

    return ( 

        <Drawer isOpen={isOpen} size="2xl" onClose={isClosed} backdrop="blur">
            <DrawerContent>
            {(onClose) => (
                <>
                <DrawerHeader className="flex flex-col gap-1">{userName}</DrawerHeader>
                <DrawerBody>
                    <div className="margin-bottom: 16px">  
                        <span className="text-default-300 text-small">Current score: {userScore}</span>
                        &nbsp;
                        &nbsp;
                        <span className="text-default-300 text-small">Max score: {maxScore}</span>
                    </div>
                    <Divider className="my-4" />
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
                                    <TableCell>
                                        {responses[3] === "Correct" ? (
                                            <Chip className="capitalize" color={statusColorMap[responses[3]]} size="sm" variant="flat">
                                               <IoCheckmark font-size="20px" />
                                            </Chip>
                                        ) : (
                                            <Chip className="capitalize" color={statusColorMap[responses[3]]} size="sm" variant="flat">
                                                <IoClose font-size="20px" />
                                            </Chip>
                                          
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                </DrawerBody>
                {/* <DrawerFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                    Close
                    </Button>
                    <Button color="primary" onPress={onClose}>
                    Action
                    </Button>
                </DrawerFooter> */}
                </>
            )}
            </DrawerContent>
        </Drawer>
  )
}

export default CustomDrawer;

