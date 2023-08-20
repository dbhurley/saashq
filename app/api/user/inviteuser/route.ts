import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateRandomPassword } from "@/lib/utils";
import sendEmail from "@/lib/sendmail";
import { hash } from "bcryptjs";

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, language } = body;

    if (!name || !email || !language) {
      return new NextResponse("Name, Email, and Language is required!", {
        status: 401,
      });
    }

    const password = generateRandomPassword();

    let message = "";

    switch (language) {
      case "en":
        message = `You have been invited to ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Your username is: ${email} \n\n Your password is: ${password} \n\n Please login to ${process.env.NEXT_PUBLIC_APP_URL} \n\n Thank you \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
        break;
      case "de":
        message = `Sie wurden dazu eingeladen ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Dein Benutzername ist: ${email} \n\n Ihr Passwort lautet: ${password} \n\n Bitte melden Sie sich an ${process.env.NEXT_PUBLIC_APP_URL} \n\n Danke \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
        break;
      default:
        message = `You have been invited to ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Your username is: ${email} \n\n Your password is: ${password} \n\n Please login to ${process.env.NEXT_PUBLIC_APP_URL} \n\n Thank you \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
        break;
    }

    //Check if user already exists in local database
    const checkexisting = await prismadb.users.findFirst({
      where: {
        email: email,
      },
    });
    //console.log(checkexisting, "checkexisting");

    //If user already exists, return error else create user and send email
    if (checkexisting) {
      return new NextResponse("User already exist, reset password instead!", {
        status: 401,
      });
    } else {
      //console.log(message, "message");
      await sendEmail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Invitation to ${process.env.NEXT_PUBLIC_APP_NAME}`,
        text: message,
      });
      //return res.status(201).json({ status: true, password });
      try {
        const user = await prismadb.users.create({
          data: {
            name,
            username: "",
            avatar: "",
            account_name: "",
            is_account_admin: false,
            is_admin: false,
            email,
            userStatus: "ACTIVE",
            userLanguage: language,
            password: await hash(password, 12),
          },
        });
        return NextResponse.json(user);
      } catch (err) {
        console.log(err);
      }
    }
  } catch (error) {
    console.log("[USERACTIVATE_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}