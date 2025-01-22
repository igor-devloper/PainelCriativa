"use client";

export const revalidate = 0;
export const dynamic = "force-dynamic";
import { PlusCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { CreateRequestDialog } from "./create-request-dialog";

export function CreateRequestButton() {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  const handleClick = () => {
    setDialogIsOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </TooltipTrigger>
          <TooltipContent>Crie uma nova solicitação</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CreateRequestDialog isOpen={dialogIsOpen} setIsOpen={setDialogIsOpen} />
    </>
  );
}
