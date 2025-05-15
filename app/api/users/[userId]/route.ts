import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const user = await (await clerkClient()).users.getUser(params.userId);
    return NextResponse.json({
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user information" },
      { status: 500 },
    );
  }
}
