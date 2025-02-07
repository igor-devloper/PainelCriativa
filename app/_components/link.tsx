/* eslint-disable @typescript-eslint/no-explicit-any */
import NextLink from "next/link";
import type { ReactNode } from "react";

interface LinkProps {
  href: string;
  children: ReactNode;
  [key: string]: any;
}

export default function Link({ href, children, ...props }: LinkProps) {
  return (
    <NextLink href={href} prefetch={false} {...props}>
      {children}
    </NextLink>
  );
}
