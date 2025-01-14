"use client";

export const revalidate = 0;
export const dynamic = "force-dynamic";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { CreateRequestDialog } from "./create-request-dialog";

export function CreateTeamButton() {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  const handleClick = () => {
    setDialogIsOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-9 rounded-full px-3 md:rounded-full md:font-bold"
              onClick={handleClick}
            >
              Solicite verba
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Crie uma nova solicitação</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CreateRequestDialog isOpen={dialogIsOpen} setIsOpen={setDialogIsOpen} />
    </>
  );
}
