import { getTeamBlocks } from "@/app/_actions/get-team-blocks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { formatCurrency } from "@/app/_utils/currency";
import { AddTransactionButton } from "@/app/_components/add-transaction-button";

interface BlockListProps {
  teamId: string;
  isAdmin: boolean;
}

export async function BlockList({ teamId, isAdmin }: BlockListProps) {
  const blocks = await getTeamBlocks(teamId);

  return (
    <div className="mt-4 space-y-4">
      {blocks.map((block) => (
        <Card key={block.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{block.name}</CardTitle>
            <AddTransactionButton
              isAdmin={isAdmin}
              balance={block.amount}
              blockId={block.id}
              teamId={teamId}
            />
          </CardHeader>
          <CardContent>
            <p>Valor Disponível: {formatCurrency(block.amount)}</p>
            <p>Status: {block.status}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
