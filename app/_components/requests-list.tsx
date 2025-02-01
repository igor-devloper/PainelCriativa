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
import type { UserRole, Request, RequestStatus } from "@/app/types";
import { formatCurrency, formatDate } from "@/app/_lib/utils";
import { updateRequestStatus } from "@/app/_actions/update-request-status";
import { toast } from "@/app/_hooks/use-toast";
import { ValidationUserDialog } from "./validation-user-dialog";
import { RequestStatusDialog } from "./request-status-dialog";
import { DenialReasonDialog } from "./denial-reason-dialog";
import { REQUEST_STATUS_LABELS } from "../_constants/transactions";
import UserInfo from "./user-info";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}

interface RequestsListProps {
  requests: Request[];
  userRole: UserRole;
  userId: string;
  users: User[];
}

export function RequestsList({
  requests,
  userRole,
  userId,
  users,
}: RequestsListProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [denialDialogOpen, setDenialDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const router = useRouter();

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
        variant: "success",
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

      if (newStatus === "COMPLETED") {
        setSelectedRequest(requests.find((r) => r.id === requestId) || null);
        setDialogOpen(true);
        return;
      }

      const result = await updateRequestStatus(
        requestId,
        newStatus,
        denialReason,
        proofBase64,
      );

      if (result.success) {
        toast({
          variant: "success",
          title: "Status atualizado",
          description: "O status da solicitação foi atualizado com sucesso.",
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Ocorreu um erro ao atualizar o status da solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    const badgeVariants = {
      WAITING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      VALIDATES: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      AUTHORIZES: "bg-green-100 text-green-800 hover:bg-green-200",
      ACCEPTS: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      COMPLETED: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };

    return (
      <Badge className={`${badgeVariants[status]} font-medium`}>
        {REQUEST_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const canChangeStatus = (request: Request) => {
    if (isUpdating === request.id) return false;

    // Gestor can only validate their assigned requests
    if (request.gestor === userId && request.status === "WAITING") return true;

    // Responsible user can only authorize their assigned requests
    if (
      request.responsibleValidationUserID === userId &&
      request.status === "VALIDATES"
    )
      return true;

    // Finance can handle authorized and accepted requests
    if (
      userRole === "FINANCE" &&
      ["AUTHORIZES", "ACCEPTS"].includes(request.status)
    )
      return true;

    // Admin can do everything
    if (userRole === "ADMIN") return true;

    return false;
  };

  const getAvailableStatuses = (request: Request): RequestStatus[] => {
    if (userRole === "ADMIN")
      return ["WAITING", "VALIDATES", "AUTHORIZES", "ACCEPTS", "COMPLETED"];

    if (userRole === "FINANCE" && request.status === "AUTHORIZES")
      return ["ACCEPTS"];
    if (userRole === "FINANCE" && request.status === "ACCEPTS")
      return ["COMPLETED"];

    if (request.gestor === userId && request.status === "WAITING")
      return ["VALIDATES"];
    if (
      request.responsibleValidationUserID === userId &&
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
            <TableHead>Observação</TableHead>
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
              <TableCell>{request.responsibleCompany}</TableCell>
              <TableCell>{request.description.split(" - ")[0]}</TableCell>
              <TableCell>
                {request.description.split("Saldo").pop()?.trim()}
              </TableCell>
              <TableCell>{formatDate(request.createdAt)}</TableCell>
              <TableCell>{formatCurrency(request.amount)}</TableCell>
              <TableCell>
                <UserInfo userId={request.userId} />
              </TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell>
                {canChangeStatus(request) && (
                  <Select
                    value={request.status}
                    onValueChange={(value: RequestStatus) =>
                      handleStatusChange(request.id, value)
                    }
                    disabled={isUpdating === request.id}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Alterar status" />
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

      <RequestStatusDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        request={selectedRequest}
        onConfirm={(proofBase64) => {
          if (selectedRequest) {
            handleStatusChange(
              selectedRequest.id,
              "COMPLETED",
              undefined,
              proofBase64,
            );
          }
          setDialogOpen(false);
          setSelectedRequest(null);
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
