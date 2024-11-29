"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

export function StyleBread() {
  const pathname = usePathname();

  // Divide a rota atual em segmentos e ignora itens vazios
  const pathSegments = pathname.split("/").filter((segment) => segment);
  return (
    <Breadcrumb>
      {pathSegments.map((segment, index) => {
        const href = "/" + pathSegments.slice(0, index + 1).join("/");
        const isLast = index === pathSegments.length - 1;

        return (
          <BreadcrumbItem key={href}>
            {!isLast ? (
              <>
                <BreadcrumbLink href={href}>
                  {decodeURIComponent(segment).replace(/-/g, " ")}
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            ) : (
              <span>{decodeURIComponent(segment).replace(/-/g, " ")}</span>
            )}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}
