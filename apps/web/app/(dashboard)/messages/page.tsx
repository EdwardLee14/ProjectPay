import { redirect } from "next/navigation";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import s from "./messages.module.css";
import shared from "@/styles/shared.module.css";

export default async function MessagesPage() {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  return (
    <main className={shared.dashboardPage}>
      <div className={s.header}>
        <div>
          <h1 className={shared.pageTitle}>Messages</h1>
          <p className={s.headerMeta}>
            Communicate with your {user.role === "CONTRACTOR" ? "clients" : "contractors"}
          </p>
        </div>
      </div>

      <div className={s.messagesLayout}>
        <div className={s.conversationList}>
          <div className={s.conversationListHeader}>
            <h3 className={s.conversationListTitle}>Conversations</h3>
          </div>
          <div className={s.emptyConversations}>
            <Icon name="chat_bubble_outline" className="text-off-black/15" size={40} />
            <p className={s.emptyTitle}>No messages yet</p>
            <p className={s.emptyDesc}>
              Messages will appear here when you start collaborating on projects
            </p>
          </div>
        </div>

        <div className={s.messageContent}>
          <div className={s.messageEmptyState}>
            <Icon name="forum" className="text-off-black/10" size={56} />
            <p className={s.messageEmptyTitle}>Select a conversation</p>
            <p className={s.messageEmptyDesc}>
              Choose a conversation from the left to view messages, or start a new one from a project page
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
