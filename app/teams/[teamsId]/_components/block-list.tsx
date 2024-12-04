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
import { BlockDetails } from "@/app/_components/block-details";
import { ArrowRight, Wallet } from "lucide-react";

interface BlockListProps {
  teamId: string;
  isAdmin: boolean;
}

export function BlockList({ teamId, isAdmin }: BlockListProps) {
  const [blocks, setBlocks] = useState<
    Awaited<ReturnType<typeof getTeamBlocks>>
  >([]);

  useEffect(() => {
    getTeamBlocks(teamId).then(setBlocks);
  }, [teamId]);

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {blocks.map((block) => (
        <Sheet key={block.id}>
          <SheetTrigger asChild>
            <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex w-full flex-row items-center justify-center space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">
                  {block.name}
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatCurrency(block.amount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor Disponível
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Ver detalhes</span>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </SheetTrigger>
          <SheetContent>
            <BlockDetails block={block} isAdmin={isAdmin} teamId={teamId} />
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}
