"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/app/_components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Textarea } from "@/app/_components/ui/textarea";
import { createNewRequest, getUserBalance } from "@/app/_lib/actions/balance";
import { toast } from "@/app/_hooks/use-toast";
import { MoneyInput } from "./money-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Prisma } from "@prisma/client";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  phoneNumber: z.string().min(10, "Número de telefone inválido"),
  amount: z.number().min(0.01, "O valor deve ser maior que zero"),
  responsibleCompany: z.enum(
    ["GSM SOLARION 02", "CRIATIVA ENERGIA", "OESTE BIOGÁS"],
    {
      errorMap: () => ({ message: "Selecione a empresa responsável" }),
    },
  ),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

type RequestFormData = z.infer<typeof formSchema>;

interface CreateRequestDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function CreateRequestDialog({
  isOpen,
  setIsOpen,
}: CreateRequestDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const form = useForm<RequestFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      responsibleCompany: "CRIATIVA ENERGIA",
      description: "",
      name: "",
      phoneNumber: "",
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    try {
      setIsPending(true);
      const userBalance = await getUserBalance();
      const requestAmount = data.amount;

      if (userBalance < 0) {
        const confirm = window.confirm(
          `Você tem um saldo negativo de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(userBalance))}. 
          Este valor será adicionado à sua solicitação. Deseja continuar?`,
        );
        if (!confirm) return;
      } else if (userBalance > 0) {
        const deductedAmount = Math.max(0, requestAmount - userBalance);
        toast({
          title: "Saldo Positivo",
          description: `Seu saldo positivo de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(userBalance)} 
          será deduzido do valor solicitado. Novo valor: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(deductedAmount)}`,
        });
      }

      await createNewRequest({
        name: data.name,
        amount: new Prisma.Decimal(data.amount),
        responsibleCompany: data.responsibleCompany,
        description: data.description,
        phoneNumber: data.phoneNumber,
      });
      toast({
        title: "Sucesso",
        description: "Solicitação criada com sucesso!",
      });
      router.push("/requests");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar solicitação",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Solicitação</DialogTitle>
          <DialogDescription>
            Crie uma nova solicitação para gerenciar prestações
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Digite o nome da solicitação"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsibleCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa responsável</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa responsável" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GSM SOLARION 02">
                        GSM SOLARION 02
                      </SelectItem>
                      <SelectItem value="CRIATIVA ENERGIA">
                        CRIATIVA ENERGIA
                      </SelectItem>
                      <SelectItem value="OESTE BIOGÁS">OESTE BIOGÁS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue || 0);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Informe o valor da solicitação em reais.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo da solicitação"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Forneça uma descrição detalhada para sua solicitação.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Telefone (WhatsApp)</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Digite o número de telefone"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Informe o número de telefone para receber notificações via
                    WhatsApp.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
