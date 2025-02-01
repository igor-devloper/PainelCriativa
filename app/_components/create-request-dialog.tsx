"use client";

import { useState } from "react";
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
import { PhoneInput } from "./phone-input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  gestor: z.string().min(1, "O gestor é obrigatório"),
  phoneNumber: z
    .string()
    .min(10, "Número de telefone inválido")
    .regex(/^\+?[1-9]\d{1,14}$/, "Formato de telefone inválido"),
  amount: z
    .number()
    .min(0.01, "O valor deve ser maior que zero")
    .max(1000000, "O valor máximo permitido é R$ 1.000.000,00"),
  responsibleCompany: z.enum(
    ["GSM SOLARION 02", "CRIATIVA ENERGIA", "OESTE BIOGÁS", "EXATA I"],
    {
      errorMap: () => ({ message: "Selecione a empresa responsável" }),
    },
  ),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres")
    .max(1000, "A descrição deve ter no máximo 1000 caracteres"),
  bankName: z.string().min(1, "O nome do banco é obrigatório"),
  accountType: z.enum(["CORRENTE", "POUPANÇA"], {
    errorMap: () => ({ message: "Selecione o tipo de conta" }),
  }),
  accountNumber: z.string().min(1, "O número da conta é obrigatório"),
  accountHolderName: z.string().min(1, "O nome do titular é obrigatório"),
  pixKey: z.string().min(1, "A chave PIX é obrigatória"),
});

type RequestFormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}

interface CreateRequestDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  users: User[];
}

export function CreateRequestDialog({
  isOpen,
  setIsOpen,
  users,
}: CreateRequestDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      responsibleCompany: "CRIATIVA ENERGIA",
      description: "",
      name: "",
      phoneNumber: "",
      gestor: "",
      bankName: "",
      accountType: "CORRENTE",
      accountNumber: "",
      accountHolderName: "",
      pixKey: "",
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    try {
      setIsPending(true);
      const result = await createRequest(data);
      if (result.success) {
        toast({
          variant: "success",
          title: "Sucesso",
          description: "Solicitação criada com sucesso!",
        });
        setIsOpen(false);
        form.reset();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao criar solicitação",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Solicitação</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da sua solicitação
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="bank">Dados Bancários</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do projeto</FormLabel>
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
                            <SelectItem value="EXATA I">EXATA I</SelectItem>
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gestor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gestor Responsável</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o gestor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.imageUrl} />
                                    <AvatarFallback>
                                      {user.firstName?.[0]}
                                      {user.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {user.firstName} {user.lastName}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular (WhatsApp)</FormLabel>
                        <FormControl>
                          <PhoneInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="(00) 00000-0000"
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
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="bank" className="space-y-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Banco</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Conta</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de conta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CORRENTE">
                            Conta Corrente
                          </SelectItem>
                          <SelectItem value="POUPANÇA">
                            Conta Poupança
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Conta</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Titular</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pixKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave PIX</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            <DialogFooter>
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
    </Dialog>
  );
}
