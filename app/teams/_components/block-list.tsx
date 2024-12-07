"use client";

import { useState, useEffect } from "react";
import { getTeamBlocks } from "@/app/_actions/get-team-blocks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { formatCurrency } from "@/app/_utils/currency";
import { Sheet, SheetContent, SheetTrigger } from "@/app/_components/ui/sheet";
import { BlockDetails } from "@/app/teams/_components/block-details";
import { ArrowRight, Loader2, MoreVertical, Trash, Wallet } from "lucide-react";
import { deleteBlock } from "@/app/_actions/delete-block";
import { toast } from "@/app/_hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Button } from "@/app/_components/ui/button";
import { useRouter } from "next/navigation";
import { STATUS_BLOCK_LABEL } from "@/app/types/block";
import { Badge } from "@/app/_components/ui/badge";

interface BlockListProps {
  teamId: string;
  isAdmin?: boolean;
}

export function BlockList({ teamId, isAdmin }: BlockListProps) {
  const [blocks, setBlocks] = useState<
    Awaited<ReturnType<typeof getTeamBlocks>>
  >([]);
  const [deletingBlocks, setDeletingBlock] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    getTeamBlocks(teamId).then(setBlocks);
  }, [teamId]);

  const handleDeleteBlock = async (blockId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDeletingBlock((prev) => new Set(prev).add(blockId)); // Fixed: using blockId instead of teamId

    try {
      await deleteBlock({
        blockId: blockId,
        teamId: teamId,
      });

      // Update local state
      setBlocks((prevBlocks) =>
        prevBlocks.filter((block) => block.id !== blockId),
      );

      // Use router.refresh() instead of revalidatePath
      router.refresh();

      toast({
        title: "Block Deletado",
        description: "O block de prestação de conta foi excluído com sucesso.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting block:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setDeletingBlock((prev) => {
        const newSet = new Set(prev);
        newSet.delete(blockId); // Fixed: using blockId instead of teamId
        return newSet;
      });
    }
  };

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {blocks.map((block) => (
        <Sheet key={block.id}>
          <SheetTrigger asChild>
            <Card className="flex cursor-pointer flex-col items-center transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex w-full flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-bold">
                  {block.name}
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="w-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-sm font-bold">
                    {formatCurrency(block.amount)}
                    <p className="text-xs font-normal text-muted-foreground">
                      Valor Disponível
                    </p>
                  </div>
                  <div>
                    <Badge
                      variant={
                        block.status === "OPEN" || block.status === "APPROVED"
                          ? "default"
                          : "destructive"
                      }
                      className="animate-pulse"
                    >
                      {STATUS_BLOCK_LABEL[block.status]}
                    </Badge>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Ver detalhes</span>
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteBlock(block.id, e)}
                        disabled={deletingBlocks.has(block.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        {deletingBlocks.has(block.id) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="mr-2 h-4 w-4" />
                        )}
                        <span>Deletar Bloco</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          </SheetTrigger>
          <SheetContent>
            <BlockDetails
              block={block}
              isAdmin={isAdmin ?? false}
              teamId={teamId}
            />
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}
