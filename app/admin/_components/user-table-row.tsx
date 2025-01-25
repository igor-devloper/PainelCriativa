"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/app/_components/ui/button";
import { TableCell, TableRow } from "@/app/_components/ui/table";
import { deleteUser } from "@/app/_actions/user-actions";
import { useToast } from "@/app/_hooks/use-toast";
import type { DashboardUser } from "@/app/types/dashboard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { EditUserDialog } from "@/app/_components/edit-user-dialog";

interface UserTableRowProps {
  user: DashboardUser;
}

export function UserTableRow({ user }: UserTableRowProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteUser(user.id);
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao excluir usuário",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          {user.role === "ADMIN" && "Administrador"}
          {user.role === "USER" && "Usuário"}
          {user.role === "FINANCE" && "Financeiro"}
        </TableCell>
        <TableCell>{format(user.joinedAt, "PP", { locale: ptBR })}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              aria-label={`Editar usuário ${user.name}`}
            >
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  aria-label={`Excluir usuário ${user.name}`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Excluir"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este usuário? Esta ação não
                    pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>

      <EditUserDialog
        user={{
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}
