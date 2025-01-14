/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { UserRole, Request, RequestStatus } from "@/app/types";
import { formatCurrency, formatDate } from "@/app/_lib/utils";
import { updateRequestStatus } from "@/app/_actions/update-request-status";
import { toast } from "@/app/_hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { RequestStatusDialog } from "./request-status-dialog";
import { DenialReasonDialog } from "./denial-reason-dialog";
import { REQUEST_STATUS_LABELS } from "../_constants/transactions";
import UserInfo from "./user-info";

interface RequestsListProps {
  requests: Request[];
  userRole: UserRole;
  user: string;
}

export function RequestsList({ requests, userRole, user }: RequestsListProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [denialDialogOpen, setDenialDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const router = useRouter();

  async function handleStatusChange(
    requestId: string,
    newStatus: RequestStatus,
    denialReason?: string,
  ) {
    setIsUpdating(requestId);
    try {
      const result = await updateRequestStatus(
        requestId,
        newStatus,
        denialReason,
      );

      if (result.success) {
        toast({
          title: "Status atualizado",
          description: "O status da solicitação foi atualizado com sucesso.",
        });
        router.refresh();

        if (newStatus === "COMPLETED") {
          const request = requests.find((r) => r.id === requestId);
          if (request) {
            setSelectedRequest(request);
            setDialogOpen(true);
          }
        }
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description:
          "Ocorreu um erro ao atualizar o status da solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  }

  const handleStatusSelect = (requestId: string, newStatus: RequestStatus) => {
    if (newStatus === "DENIED") {
      setSelectedRequest(requests.find((r) => r.id === requestId) || null);
      setDenialDialogOpen(true);
    } else {
      handleStatusChange(requestId, newStatus);
    }
  };

  const canChangeStatus = (request: Request) => {
    return (
      (userRole === "FINANCE" || userRole === "ADMIN") &&
      request.status !== "COMPLETED" &&
      !isUpdating
    );
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Autor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.id}</TableCell>
              <TableCell>{formatDate(request.createdAt)}</TableCell>
              <TableCell>{formatCurrency(request.amount)}</TableCell>
              <TableCell>
                <UserInfo userId={request.userId} />
              </TableCell>
              <TableCell>{REQUEST_STATUS_LABELS[request.status]}</TableCell>
              <TableCell>
                {canChangeStatus(request) && (
                  <Select
                    value={request.status}
                    onValueChange={(value: RequestStatus) =>
                      handleStatusSelect(request.id, value)
                    }
                    disabled={isUpdating === request.id}
                  >
                    <SelectTrigger className="ml-2 w-[180px]">
                      <SelectValue placeholder="Alterar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAITING">
                        Aguardando análise
                      </SelectItem>
                      <SelectItem value="RECEIVED">
                        Recebida pelo financeiro
                      </SelectItem>
                      <SelectItem value="ACCEPTED">Aceita</SelectItem>
                      <SelectItem value="DENIED">Não aceita</SelectItem>
                      <SelectItem value="COMPLETED">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <RequestStatusDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        request={selectedRequest}
        onComplete={() => {
          setDialogOpen(false);
          setSelectedRequest(null);
          router.refresh();
        }}
      />
      <DenialReasonDialog
        isOpen={denialDialogOpen}
        setIsOpen={setDenialDialogOpen}
        onConfirm={(reason) => {
          if (selectedRequest) {
            handleStatusChange(selectedRequest.id, "DENIED", reason);
          }
          setDenialDialogOpen(false);
          setSelectedRequest(null);
        }}
      />
    </>
  );
}
