"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/app/_components/ui/select"; // Importe os componentes de select

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center justify-between border-b border-solid px-4 py-3 md:px-8 md:py-4">
      {/* ESQUERDA */}
      <div className="flex items-center gap-4 md:gap-10">
        <Image
          src="/logo.svg"
          width={120}
          height={27}
          alt="Finance AI"
          className="md:h-[39px] md:w-[173px]"
        />
        <div className="hidden gap-6 md:flex">
          <Link
            href="/"
            className={
              pathname === "/"
                ? "font-bold text-primary"
                : "text-muted-foreground"
            }
          >
            Dashboard
          </Link>
          <Link
            href="/transactions"
            className={
              pathname === "/transactions"
                ? "font-bold text-primary"
                : "text-muted-foreground"
            }
          >
            Transações
          </Link>
          <Link
            href="/subscription"
            className={
              pathname === "/subscription"
                ? "font-bold text-primary"
                : "text-muted-foreground"
            }
          >
            Assinatura
          </Link>
        </div>
      </div>

      {/* DIREITA */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden">
          <UserButton showName />
        </div>
        <div className="flex justify-center md:hidden">
          <UserButton />
        </div>
        <div className="md:hidden">
          {/* Menu Dropdown para navegação em telas pequenas */}
          <Select
            defaultValue=""
            onValueChange={(value) => (window.location.href = value)}
          >
            <SelectTrigger className="rounded border bg-transparent p-2 text-sm text-muted-foreground">
              <span>Menu</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/">Dashboard</SelectItem>
              <SelectItem value="/transactions">Transações</SelectItem>
              <SelectItem value="/subscription">Assinatura</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
