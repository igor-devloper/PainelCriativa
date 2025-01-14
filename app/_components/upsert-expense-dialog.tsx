/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { MoneyInput } from "./money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "@/app/_constants/transactions";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { z } from "zod";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerExpense } from "@/app/_lib/actions/balance";
import { toast } from "@/app/_hooks/use-toast";
import { useState, useCallback } from "react";
import { ImageUpload } from "./image-upload";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { AccountingBlock } from "@/app/types";

interface UpsertExpenseDialogProps {
  isOpen: boolean;
  defaultValues?: FormSchema;
  expenseId?: string;
  blockId: string;
  block: AccountingBlock | null; // Make block nullable
  setIsOpen: (isOpen: boolean) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: "O nome é obrigatório.",
  }),
  description: z.string().trim().min(1, {
    message: "A descrição é obrigatória.",
  }),
  amount: z
    .number({
      required_error: "O valor é obrigatório.",
    })
    .positive({
      message: "O valor deve ser positivo.",
    }),
  category: z.nativeEnum(ExpenseCategory, {
    required_error: "A categoria é obrigatória.",
  }),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    required_error: "O método de pagamento é obrigatório.",
  }),
  date: z
    .date({
      required_error: "A data é obrigatória.",
    })
    .max(new Date(), {
      message: "A data não pode ser maior que a data de hoje.",
    }),
});

type FormSchema = z.infer<typeof formSchema>;

export function UpsertExpenseDialog({
  isOpen,
  defaultValues,
  expenseId,
  blockId,
  block,
  setIsOpen,
  onLoadingChange,
}: UpsertExpenseDialogProps) {
  const [images, setImages] = useState<File[]>([]);
  const router = useRouter();
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<{
    data: FormSchema;
    imagesBase64: string[];
  } | null>(null);

  // Early return if block is not available
  if (!block) {
    return null;
  }

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      amount: 0,
      category: ExpenseCategory.OTHER,
      name: "",
      description: "",
      paymentMethod: PaymentMethod.CASH,
      date: new Date(),
    },
  });

  const submitExpense = useCallback(
    async (data: FormSchema, imagesBase64: string[]) => {
      try {
        onLoadingChange(true);
        await registerExpense(blockId, {
          ...data,
          imageUrls: imagesBase64,
        });

        router.refresh();
        setIsOpen(false);
        form.reset();
        setImages([]);
        toast({
          title: "Despesa registrada com sucesso!",
          description: "A despesa foi salva no bloco contábil.",
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Erro ao registrar despesa",
          description:
            error instanceof Error
              ? error.message
              : "Ocorreu um erro ao salvar a despesa. Tente novamente.",
        });
      } finally {
        onLoadingChange(false);
      }
    },
    [blockId, router, setIsOpen, form, onLoadingChange],
  );

  const onSubmit = useCallback(
    async (data: FormSchema) => {
      try {
        const imagesBase64 = await Promise.all(
          images.map((file) => fileToBase64(file)),
        );

        // Safe to access block.request since we checked for null above
        const currentBalance = Number(block.request.currentBalance);
        if (data.amount > currentBalance) {
          setPendingSubmission({ data, imagesBase64 });
          setAlertDialogOpen(true);
          return;
        }

        await submitExpense(data, imagesBase64);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Erro ao registrar despesa",
          description:
            error instanceof Error
              ? error.message
              : "Ocorreu um erro ao salvar a despesa. Tente novamente.",
        });
      }
    },
    [block.request.currentBalance, images, submitExpense],
  );

  const handleConfirmSubmit = async () => {
    if (pendingSubmission) {
      await submitExpense(
        pendingSubmission.data,
        pendingSubmission.imagesBase64,
      );
      setAlertDialogOpen(false);
      setPendingSubmission(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const isUpdate = Boolean(expenseId);

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            form.reset();
            setImages([]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isUpdate ? "Atualizar" : "Registrar"} despesa
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da despesa abaixo
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[80vh]">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 md:space-y-8"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome..." {...field} />
                        </FormControl>
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
                          <Input
                            placeholder="Digite a descrição..."
                            {...field}
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <MoneyInput
                            placeholder="Digite o valor..."
                            value={field.value.toString()}
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
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                              <SelectValue placeholder="Selecione a categoria..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
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
                              <SelectValue placeholder="Selecione um método de pagamento..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_METHOD_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isUpdate ? (
                      "Atualizar"
                    ) : (
                      "Registrar"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção: Saldo Excedido</AlertDialogTitle>
            <AlertDialogDescription>
              O valor da despesa excede o saldo disponível para este bloco
              contábil. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSubmission(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
