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
import { formatCurrency, formatDate } from "@/app/_lib/utils";

interface PendingRequestsProps {
  requests: {
    id: string;
    name: string;
    amount: number;
    date: string;
  }[];
}

export const PendingRequests = ({ requests }: PendingRequestsProps) => {
  return (
    <Card className="h-[400px] overflow-hidden">
      <CardHeader>
        <CardTitle>Solicitações Pendentes</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-5rem)] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.name}</TableCell>
                <TableCell>{formatCurrency(request.amount)}</TableCell>
                <TableCell>{formatDate(request.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
