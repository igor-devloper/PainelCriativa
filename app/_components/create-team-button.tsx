"use client";

export const revalidate = 0;
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { CreateTeamDialog } from "./create-team-dialog";

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
              Criar Equipe
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Crie sua equipe para começar a prestar contas
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CreateTeamDialog isOpen={dialogIsOpen} setIsOpen={setDialogIsOpen} />
    </>
  );
}
