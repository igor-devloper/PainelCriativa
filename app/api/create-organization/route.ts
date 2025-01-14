import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { name } = await request.json();

    const organization = await fetch("https://api.clerk.com/v1/organizations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    }).then((res) => res.json());

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error creating organization:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
