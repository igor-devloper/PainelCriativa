/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  type AwaitedReactNode,
  type JSXElementConstructor,
  type Key,
  type ReactElement,
  type ReactNode,
  type ReactPortal,
  useState,
} from "react";
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
import { Textarea } from "@/app/_components/ui/textarea";
import { registerExpense } from "@/app/_lib/actions/balance";
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
import { DatePicker } from "./ui/date-picker";
import { ImageUpload } from "./image-upload";
import { Loader2 } from "lucide-react";
import type { AccountingBlock } from "@/app/types";
import {
  ExpenseCategory,
  PaymentMethod,
  transactiontype,
} from "@prisma/client";
import {
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "../_constants/transactions";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  description: z.string().min(1, "A descrição é obrigatória"),
  amount: z.number().min(0.01, "O valor deve ser maior que zero"),
  category: z.nativeEnum(ExpenseCategory, {
    errorMap: () => ({ message: "A categoria é obrigatória" }),
  }),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "O método de pagamento é obrigatório" }),
  }),
  date: z.date({
    required_error: "A data é obrigatória",
  }),
  type: z.nativeEnum(transactiontype, {
    required_error: "O tipo é obrigatório",
  }),
});

type FormSchema = z.infer<typeof formSchema>;

interface UpsertExpenseDialogProps {
  isOpen: boolean;
  blockId: string;
  block: AccountingBlock;
  setIsOpen: (isOpen: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export function UpsertExpenseDialog({
  isOpen,
  blockId,
  block,
  setIsOpen,
  onLoadingChange,
}: UpsertExpenseDialogProps) {
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      category: ExpenseCategory.OTHER,
      description: "",
      paymentMethod: PaymentMethod.CASH,
      date: new Date(),
      type: "DESPESA",
    },
  });

  const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const onSubmit = async (data: FormSchema) => {
    try {
      setIsSubmitting(true);
      onLoadingChange?.(true);

      const imagesBase64 = await Promise.all(
        images.map((file) => fileToBase64(file)),
      );

      await registerExpense(blockId, {
        ...data,
        imageUrls: imagesBase64,
        type: data.type as transactiontype,
      });

      toast({
        variant: "success",
        title: "Sucesso",
        description: "Despesa registrada com sucesso!",
      });

      setIsOpen(false);
      form.reset();
      setImages([]);
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao registrar despesa",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Registrar despesa</DialogTitle>
          <DialogDescription>
            Preencha as informações da despesa abaixo
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome do respon. pelo registro..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DESPESA">Despesa</SelectItem>
                          <SelectItem value="CAIXA">Caixa</SelectItem>
                          <SelectItem value="REEMBOLSO">Reembolso</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXPENSE_CATEGORY_OPTIONS.map(
                            (option: {
                              value: Key | undefined;
                              label:
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactElement<
                                    any,
                                    string | JSXElementConstructor<any>
                                  >
                                | Iterable<ReactNode>
                                | ReactPortal
                                | Promise<AwaitedReactNode>
                                | null
                                | undefined;
                            }) => (
                              <SelectItem
                                key={option.value}
                                value={option.value?.toString() ?? ""}
                              >
                                {option.label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de pagamento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHOD_OPTIONS.map(
                            (option: {
                              value: Key | null | undefined;
                              label:
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactElement<
                                    any,
                                    string | JSXElementConstructor<any>
                                  >
                                | Iterable<ReactNode>
                                | ReactPortal
                                | Promise<AwaitedReactNode>
                                | null
                                | undefined;
                            }) => (
                              <SelectItem
                                key={option.value}
                                value={option.value?.toString() ?? ""}
                              >
                                {option.label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
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
                        placeholder="Digite a descrição..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Comprovantes</FormLabel>
                <FormControl>
                  <ImageUpload
                    onChange={setImages}
                    value={images}
                    maxFiles={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
