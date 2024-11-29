import Image from "next/image";
import { Button } from "@/app/_components/ui/button";
import { LogInIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const LoginPage = async () => {
  const { userId } = await auth();
  if (userId) {
    redirect("/");
  }

  return (
    <div className="flex h-full flex-col md:grid md:grid-cols-2">
      {/* Left Side */}
      <div className="relative flex h-full flex-col justify-center px-8 lg:px-16">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background to-background md:hidden" />
        <div className="relative z-10 mx-auto w-full max-w-[500px] space-y-6">
          <div className="space-y-1.5">
            <div className="inline-block rounded-xl bg-white p-4 backdrop-blur-sm">
              <Image
                src="/logo.png"
                width={100}
                height={55}
                alt="Criativa Energia"
                className="h-auto w-auto"
                priority
              />
            </div>
            <h1 className="text-2xl font-medium tracking-tight md:text-3xl">
              Bem-vindo ao{" "}
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text font-semibold text-transparent">
                Painel Criativa
              </span>
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              O Painel Criativa é a plataforma de prestação de contas
              operacionais da manutenção das usinas. Acompanhe serviços,
              relatórios e o desempenho com transparência.
            </p>
          </div>
          <SignInButton>
            <Button
              variant="default"
              className="h-10 gap-2 bg-green-600 text-sm hover:bg-green-700"
            >
              <LogInIcon className="h-4 w-4" />
              Fazer login ou criar conta
            </Button>
          </SignInButton>
        </div>
      </div>

      {/* Right Side */}
      <div className="relative hidden h-full md:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-background to-transparent" />
        <Image
          src="/fotoBack.jpg"
          alt="Usina solar da Criativa Energia"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>
    </div>
  );
};

export default LoginPage;
