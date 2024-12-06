"use client";
export const revalidate = 0;

import { useState, useEffect } from "react";

interface UserInfoProps {
  userId: string;
}

interface UserData {
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}

export default function UserInfo({ userId }: UserInfoProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error("Erro ao buscar informações do usuário:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserInfo();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
        <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
      </div>
    );
  }

  if (!userData) {
    return <div>Usuário não encontrado</div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <span>
        {userData.firstName} {userData.lastName}
      </span>
    </div>
  );
}
