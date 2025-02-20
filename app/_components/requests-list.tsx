/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Badge } from "@/app/_components/ui/badge";
import type { Request, RequestStatus, RequestType } from "@prisma/client";
import { formatCurrency, formatDate } from "@/app/_lib/utils";
import { updateRequestStatus } from "@/app/_actions/update-request-status";
import { useToast } from "@/app/_hooks/use-toast";
import { ValidationUserDialog } from "./validation-user-dialog";
import { ReimbursementDialog } from "./reimbursement-dialog";
import { DenialReasonDialog } from "./denial-reason-dialog";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
} from "../_constants/transactions";
import { useUser } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/server";

interface RequestsListProps {
  requests: Request[];
  userRole: string;
  users: User[];
}

export function RequestsList({ requests, userRole, users }: RequestsListProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [reimbursementDialogOpen, setReimbursementDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [denialDialogOpen, setDenialDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  const handleValidationUserSelect = async (selectedUserId: string) => {
    if (!selectedRequest) return;

    try {
      await updateRequestStatus(
        selectedRequest.id,
        "VALIDATES",
        undefined,
        undefined,
        selectedUserId,
      );
      toast({
        title: "Sucesso",
        description: "Solicitação validada e enviada para autorização",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da solicitação",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    requestId: string,
    newStatus: RequestStatus,
    denialReason?: string,
    proofBase64?: string,
  ) => {
    setIsUpdating(requestId);
    try {
      if (newStatus === "VALIDATES") {
        setSelectedRequest(requests.find((r) => r.id === requestId) || null);
        setValidationDialogOpen(true);
        return;
      }

      if (
        newStatus === "COMPLETED" &&
        selectedRequest?.type === "REIMBURSEMENT"
      ) {
        setReimbursementDialogOpen(true);
        return;
      }

      await updateRequestStatus(
        requestId,
        newStatus,
        denialReason,
        proofBase64,
      );
      toast({
        title: "Status atualizado",
        description: "O status da solicitação foi atualizado com sucesso.",
      });
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Ocorreu um erro ao atualizar o status da solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const canChangeStatus = (request: Request) => {
    if (isUpdating === request.id) return false;
    if (userRole === "ADMIN") return true;
    if (
      userRole === "FINANCE" &&
      ["AUTHORIZES", "ACCEPTS"].includes(request.status)
    )
      return true;
    if (request.gestor === user?.id && request.status === "WAITING")
      return true;
    if (
      request.responsibleValidationUserID === user?.id &&
      request.status === "VALIDATES"
    )
      return true;
    return false;
  };

  const getAvailableStatuses = (request: Request): RequestStatus[] => {
    if (userRole === "ADMIN")
      return ["WAITING", "VALIDATES", "AUTHORIZES", "ACCEPTS", "COMPLETED"];
    if (userRole === "FINANCE" && request.status === "AUTHORIZES")
      return ["ACCEPTS"];
    if (userRole === "FINANCE" && request.status === "ACCEPTS")
      return ["COMPLETED"];
    if (request.gestor === user?.id && request.status === "WAITING")
      return ["VALIDATES"];
    if (
      request.responsibleValidationUserID === user?.id &&
      request.status === "VALIDATES"
    )
      return ["AUTHORIZES"];
    return [];
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa Responsável</TableHead>
            <TableHead>Motivo da solicitação</TableHead>
            <TableHead>Tipo da Solicitação</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.responsibleCompany}</TableCell>
              <TableCell>{request.description}</TableCell>
              <TableCell>
                {REQUEST_TYPE_LABELS[request.type as RequestType]}
              </TableCell>
              <TableCell>{formatDate(request.createdAt)}</TableCell>
              <TableCell>{formatCurrency(Number(request.amount))}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {REQUEST_STATUS_LABELS[request.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {canChangeStatus(request) && (
                  <Select
                    disabled={isUpdating === request.id}
                    onValueChange={(value) =>
                      handleStatusChange(request.id, value as RequestStatus)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Alterar Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStatuses(request).map((status) => (
                        <SelectItem key={status} value={status}>
                          {REQUEST_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ValidationUserDialog
        isOpen={validationDialogOpen}
        setIsOpen={setValidationDialogOpen}
        onConfirm={handleValidationUserSelect}
        users={users}
      />

      <ReimbursementDialog
        isOpen={reimbursementDialogOpen}
        setIsOpen={setReimbursementDialogOpen}
        requestId={selectedRequest?.id || ""}
        onSuccess={() => {
          setReimbursementDialogOpen(false);
          setSelectedRequest(null);
          router.refresh();
        }}
      />

      <DenialReasonDialog
        isOpen={denialDialogOpen}
        setIsOpen={setDenialDialogOpen}
        onConfirm={(reason) => {
          if (selectedRequest) {
            handleStatusChange(selectedRequest.id, "ACCEPTS", reason);
          }
          setDenialDialogOpen(false);
          setSelectedRequest(null);
        }}
      />
    </>
  );
}
