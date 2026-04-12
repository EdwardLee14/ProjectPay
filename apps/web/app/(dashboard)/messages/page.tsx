import { redirect } from "next/navigation";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MessagesClient,
  type ConversationSummary,
  type ThreadMessage,
} from "@/components/messages/messages-client";
import shared from "@/styles/shared.module.css";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ contractorId: user.id }, { clientId: user.id }],
    },
    select: {
      id: true,
      name: true,
      clientEmail: true,
      contractorId: true,
      clientId: true,
      contractor: { select: { name: true } },
      client: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const projectIds = projects.map((p) => p.id);
  const recentMsgs =
    projectIds.length > 0
      ? await prisma.projectMessage.findMany({
          where: { projectId: { in: projectIds } },
          orderBy: { createdAt: "desc" },
          select: { projectId: true, body: true, createdAt: true },
          take: 300,
        })
      : [];

  const latestByProject = new Map<
    string,
    { body: string; createdAt: Date }
  >();
  for (const m of recentMsgs) {
    if (!latestByProject.has(m.projectId)) {
      latestByProject.set(m.projectId, {
        body: m.body,
        createdAt: m.createdAt,
      });
    }
  }

  const conversations: ConversationSummary[] = projects.map((p) => {
    const otherPartyLabel =
      user.id === p.contractorId
        ? p.client?.name ??
          (p.clientEmail ? `${p.clientEmail} (pending)` : "No client yet")
        : p.contractor.name;
    const latest = latestByProject.get(p.id);
    const preview = latest
      ? latest.body.length > 100
        ? `${latest.body.slice(0, 100)}…`
        : latest.body
      : null;
    return {
      projectId: p.id,
      projectName: p.name,
      otherPartyLabel,
      lastPreview: preview,
      lastAt: latest ? latest.createdAt.toISOString() : null,
    };
  });

  conversations.sort((a, b) => {
    if (!a.lastAt && !b.lastAt) return 0;
    if (!a.lastAt) return 1;
    if (!b.lastAt) return -1;
    return b.lastAt.localeCompare(a.lastAt);
  });

  let selectedProjectId: string | null = searchParams.project ?? null;
  let selectedProjectName: string | null = null;
  let selectedOtherParty: string | null = null;
  let threadMessages: ThreadMessage[] = [];

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : undefined;

  if (!selectedProject) {
    selectedProjectId = null;
  } else {
    selectedProjectName = selectedProject.name;
    selectedOtherParty =
      user.id === selectedProject.contractorId
        ? selectedProject.client?.name ??
          (selectedProject.clientEmail
            ? `${selectedProject.clientEmail} (pending)`
            : "No client yet")
        : selectedProject.contractor.name;

    const rows = await prisma.projectMessage.findMany({
      where: { projectId: selectedProjectId! },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { name: true } } },
    });
    threadMessages = rows.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      senderId: m.senderId,
      senderName: m.sender.name,
    }));
  }

  return (
    <main className={shared.dashboardPage}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
        <div>
          <h1 className={shared.pageTitle}>Messages</h1>
          <p className="text-sm text-off-black/40 mt-1">
            Communicate with your{" "}
            {user.role === "CONTRACTOR" ? "clients" : "contractors"} per project
          </p>
        </div>
      </div>

      <MessagesClient
        conversations={conversations}
        selectedProjectId={selectedProjectId}
        selectedProjectName={selectedProjectName}
        selectedOtherParty={selectedOtherParty}
        threadMessages={threadMessages}
        currentUserId={user.id}
      />
    </main>
  );
}
