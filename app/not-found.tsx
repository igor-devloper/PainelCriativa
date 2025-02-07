import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="mb-4 text-4xl font-bold">404 - Página não encontrada</h2>
      <p className="mb-4 text-gray-600">
        A página que você está procurando não existe.
      </p>
      <Link href="/" className="text-primary underline hover:text-primary/90">
        Voltar para a página inicial
      </Link>
    </div>
  );
}
