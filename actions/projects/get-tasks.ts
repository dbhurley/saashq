import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export const getTasks = async () => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const boards = await prismadb.boards.findMany({
    where: {
      OR: [
        {
          user: userId,
        },
        {
          visibility: "public",
        },
      ],
    },
    include: {
      assigned_user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date_created: "desc",
    },
  });

  if (!boards) return null;
  if (!userId) return null;

  //Filtering tasks by section and board
  const sections = await prismadb.sections.findMany({
    where: {
      OR: boards.map((board) => {
        return {
          board: board.id,
        };
      }),
    },
  });

  const data = await prismadb.tasks.findMany({
    where: {
      OR: sections.map((section) => {
        return {
          section: section.id,
        };
      }),
    },
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return data;
};