import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { IoClose, IoArrowForwardCircleSharp } from "react-icons/io5";
import { getDocs, collection, doc, query, updateDoc } from "firebase/firestore";
import "../../assets/styles/Leaderboard.css";
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Tooltip,
    Button,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    useDisclosure,
  } from "@nextui-org/react";

function CustomDrawer({isOpen, isClosed, userName, userEntries}) {

    return ( 

        <Drawer isOpen={isOpen} onClose={isClosed}>
            <DrawerContent>
            {(onClose) => (
                <>
                <DrawerHeader className="flex flex-col gap-1">{userName}'s Responses</DrawerHeader>
                <DrawerBody>
                    {userEntries.map((responses) => 
                      <li>{responses}</li>
                    )}
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

