"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import s from "@/app/(dashboard)/messages/messages.module.css";
import { cn } from "@/lib/utils";

export type ConversationSummary = {
  projectId: string;
  projectName: string;
  otherPartyLabel: string;
  lastPreview: string | null;
  lastAt: string | null;
};

export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  senderName: string;
};

type Props = {
  conversations: ConversationSummary[];
  selectedProjectId: string | null;
  selectedProjectName: string | null;
  selectedOtherParty: string | null;
  threadMessages: ThreadMessage[];
  currentUserId: string;
};

export function MessagesClient({
  conversations,
  selectedProjectId,
  selectedProjectName,
  selectedOtherParty,
  threadMessages,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function sendMessage() {
    if (!selectedProjectId || !text.trim()) return;
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: Record<string, string[]>;
      };
      if (!res.ok) {
        const first =
          data.details?.body?.[0] ?? data.error ?? "Could not send message";
        setError(first);
        return;
      }
      setText("");
      startTransition(() => router.refresh());
    } catch {
      setError("Network error. Try again.");
    }
  }

  return (
    <div className={s.messagesLayout}>
      <div className={s.conversationList}>
        <div className={s.conversationListHeader}>
          <h3 className={s.conversationListTitle}>Conversations</h3>
        </div>
        {conversations.length === 0 ? (
          <div className={s.emptyConversations}>
            <Icon name="chat_bubble_outline" className="text-off-black/15" size={40} />
            <p className={s.emptyTitle}>No projects yet</p>
            <p className={s.emptyDesc}>
              Create or join a project to start messaging your contractor or client
            </p>
          </div>
        ) : (
          <ul className={s.conversationItems}>
            {conversations.map((c) => {
              const active = c.projectId === selectedProjectId;
              return (
                <li key={c.projectId}>
                  <Link
                    href={`/messages?project=${c.projectId}`}
                    className={cn(s.conversationItem, active && s.conversationItemActive)}
                    scroll={false}
                  >
                    <p className={s.conversationTitle}>{c.projectName}</p>
                    <p className={s.conversationMeta}>{c.otherPartyLabel}</p>
                    {c.lastPreview ? (
                      <p className={s.conversationPreview}>{c.lastPreview}</p>
                    ) : (
                      <p className={s.conversationPreviewMuted}>No messages yet</p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={s.messageContent}>
        {!selectedProjectId ? (
          <div className={s.messageEmptyState}>
            <Icon name="forum" className="text-off-black/10" size={56} />
            <p className={s.messageEmptyTitle}>Select a conversation</p>
            <p className={s.messageEmptyDesc}>
              Choose a project on the left, or open Messages from a project page
            </p>
          </div>
        ) : (
          <>
            <div className={s.threadHeader}>
              <div>
                <p className={s.threadTitle}>{selectedProjectName}</p>
                <p className={s.threadMeta}>{selectedOtherParty}</p>
              </div>
            </div>
            <div className={s.threadScroll}>
              {threadMessages.length === 0 ? (
                <div className={s.threadEmptyInline}>
                  <p className={s.threadEmptyText}>No messages yet — say hello below.</p>
                </div>
              ) : (
                <ul className={s.threadList}>
                  {threadMessages.map((m) => {
                    const mine = m.senderId === currentUserId;
                    return (
                      <li
                        key={m.id}
                        className={cn(s.bubbleRow, mine ? s.bubbleRowMine : s.bubbleRowTheirs)}
                      >
                        <div className={cn(s.bubble, mine ? s.bubbleMine : s.bubbleTheirs)}>
                          {!mine && (
                            <p className={s.bubbleSender}>{m.senderName}</p>
                          )}
                          <p className={s.bubbleBody}>{m.body}</p>
                          <p className={s.bubbleTime}>
                            {new Date(m.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className={s.composer}>
              {error && <p className={s.composerError}>{error}</p>}
              <div className={s.composerRow}>
                <textarea
                  className={s.composerInput}
                  placeholder="Write a message…"
                  rows={2}
                  value={text}
                  disabled={isPending}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <button
                  type="button"
                  className={s.composerSend}
                  disabled={isPending || !text.trim()}
                  onClick={() => void sendMessage()}
                >
                  <Icon name="send" size={22} className="text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
