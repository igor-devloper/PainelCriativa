import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { formatCurrency } from "@/app/_lib/utils";
import { AccountingBlock } from "@/app/types";
import { STATUS_BLOCK_LABEL } from "@/app/types/block";

interface RecentAccountingBlocksProps {
  blocks: AccountingBlock[];
}

export const RecentAccountingBlocks = ({
  blocks,
}: RecentAccountingBlocksProps) => {
  return (
    <Card className="h-[400px] overflow-hidden">
      <CardHeader>
        <CardTitle>Blocos Contábeis Recentes</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-5rem)] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocks.map((block) => (
              <TableRow key={block.id}>
                <TableCell>{block.code}</TableCell>
                <TableCell>{block.company}</TableCell>
                <TableCell>
                  {formatCurrency(Number(block.currentBalance))}
                </TableCell>
                <TableCell>{STATUS_BLOCK_LABEL[block.status]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
