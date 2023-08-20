import { prismadb } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const headers = req.headers;

  const { firstName, lastName, account, job, email, phone, lead_source } = body;

  //Validate auth with token from .env.local
  const token = headers.get("authorization");

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SAASHQ_TOKEN) {
    return NextResponse.json(
      { message: "SAASHQ_TOKEN not defined in .env.local file" },
      { status: 401 }
    );
  }

  if (token.trim() !== process.env.SAASHQ_TOKEN.trim()) {
    console.log("Unauthorized");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  } else {
    try {
      await prismadb.crm_Leads.create({
        data: {
          firstName,
          lastName,
          company: account,
          jobTitle: job,
          email,
          phone,
          lead_source,
          status: "NEW",
          type: "DEMO",
        },
      });

      return NextResponse.json({ message: "New lead created successfully" });
      //return res.status(200).json({ json: "newContact" });
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        { message: "Error creating new lead" },
        { status: 500 }
      );
    }
  }
}