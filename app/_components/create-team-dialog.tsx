/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { useToast } from "@/app/_hooks/use-toast";
import { createTeam } from "@/app/_actions/create-team";

interface CreateTeamDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const teamFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome da equipe deve ter pelo menos 3 caracteres",
  }),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

export function CreateTeamDialog({ isOpen, setIsOpen }: CreateTeamDialogProps) {
  const { toast } = useToast();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(data: TeamFormValues) {
    try {
      const formData = new FormData();
      formData.append("name", data.name);

      const result = await createTeam(formData);

      if (result.success) {
        toast({
          title: "Equipe criada com sucesso!",
          description: "Você já pode começar a adicionar membros.",
        });
        setIsOpen(false);
        form.reset();
      } else {
        throw new Error("Falha ao criar equipe");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Ocorreu um erro ao criar a equipe. Tente novamente.",
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Equipe</DialogTitle>
          <DialogDescription>
            Crie uma nova equipe para gerenciar prestações de contas em
            conjunto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Equipe</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome da equipe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Criando..." : "Criar Equipe"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
