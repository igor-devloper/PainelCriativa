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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Textarea } from "@/app/_components/ui/textarea";
import { createRequest } from "@/app/_actions/create-request";
import { getUserBalance } from "@/app/_lib/actions/balance";
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
import { Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  phoneNumber: z
    .string()
    .min(10, "Número de telefone inválido")
    .regex(/^\+?[1-9]\d{1,14}$/, "Formato de telefone inválido"),
  amount: z
    .number()
    .min(0.01, "O valor deve ser maior que zero")
    .max(1000000, "O valor máximo permitido é R$ 1.000.000,00"),
  responsibleCompany: z.enum(
    ["GSM SOLARION 02", "CRIATIVA ENERGIA", "OESTE BIOGÁS"],
    {
      errorMap: () => ({ message: "Selecione a empresa responsável" }),
    },
  ),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres")
    .max(1000, "A descrição deve ter no máximo 1000 caracteres"),
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

      if (userBalance < 0) {
        const negativeBalance = Math.abs(userBalance);
        const confirm = window.confirm(
          `Você possui um saldo negativo de ${new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(
            negativeBalance,
          )}. Este valor será deduzido da sua solicitação quando for aprovada. Deseja continuar?`,
        );

        if (!confirm) {
          setIsPending(false);
          return;
        }
      }

      const result = await createRequest({
        name: data.name,
        description: data.description,
        amount: data.amount,
        responsibleCompany: data.responsibleCompany,
        phoneNumber: data.phoneNumber,
      });

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Solicitação criada com sucesso!",
        });
        router.refresh();
        setIsOpen(false);
        form.reset();
      }
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao criar solicitação. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        setIsOpen(open);
      }}
    >
      <ScrollArea className="max-h-[50px]">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Solicitação</DialogTitle>
            <DialogDescription>
              Crie uma nova solicitação para gerenciar prestações
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-2 md:space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome da solicitação"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="OESTE BIOGÁS">
                            OESTE BIOGÁS
                          </SelectItem>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Solicitação"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </ScrollArea>
    </Dialog>
  );
}
