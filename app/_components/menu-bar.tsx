"use client";

import type * as React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
  badgeCount?: number;
}

interface MenuBarProps {
  menuItems: MenuItem[];
}

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
};

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

export function MenuBar({ menuItems }: MenuBarProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  return (
    <motion.nav
      className="relative overflow-hidden px-2"
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        className={`bg-gradient-radial absolute -inset-2 from-transparent ${
          isDarkTheme
            ? "via-blue-400/10 via-purple-400/10 via-red-400/10 via-30% via-60% via-90%"
            : "via-blue-400/5 via-purple-400/5 via-red-400/5 via-30% via-60% via-90%"
        } pointer-events-none z-0 rounded-3xl to-transparent`}
        variants={navGlowVariants}
      />
      <ul className="relative z-10 flex flex-col items-start gap-1">
        {menuItems.map((item) => (
          <motion.li key={item.label} className="relative w-full">
            <Link href={item.href} className="block w-full">
              <motion.div
                className="group relative block overflow-visible rounded-lg"
                style={{ perspective: "600px" }}
                whileHover="hover"
                initial="initial"
              >
                <motion.div
                  className="pointer-events-none absolute inset-0 z-0"
                  variants={glowVariants}
                  style={{
                    background: item.gradient,
                    opacity: 0,
                    borderRadius: "8px",
                  }}
                />
                <motion.div
                  className="relative z-10 flex items-center gap-3 rounded-lg bg-transparent px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
                  variants={itemVariants}
                  transition={sharedTransition}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center bottom",
                  }}
                >
                  <span
                    className={`transition-colors duration-300 ${item.iconColor}`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                      {item.badgeCount}
                    </span>
                  )}
                </motion.div>
                <motion.div
                  className="absolute inset-0 z-10 flex items-center gap-3 rounded-lg bg-transparent px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
                  variants={backVariants}
                  transition={sharedTransition}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center top",
                  }}
                >
                  <span
                    className={`transition-colors duration-300 ${item.iconColor}`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                      {item.badgeCount}
                    </span>
                  )}
                </motion.div>
              </motion.div>
            </Link>
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  );
}
