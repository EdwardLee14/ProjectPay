"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import s from "@/app/(dashboard)/messages/messages.module.css";
import shared from "@/styles/shared.module.css";
import { cn, formatCurrency } from "@/lib/utils";

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

type ProjectDetail = {
  id: string;
  name: string;
  status: string;
  totalBudget: number;
  totalSpent: number;
  categories: { name: string; allocated: number; spent: number }[];
};

type Props = {
  conversations: ConversationSummary[];
  selectedProjectId: string | null;
  selectedProjectName: string | null;
  selectedOtherParty: string | null;
  threadMessages: ThreadMessage[];
  currentUserId: string;
  projectDetail: ProjectDetail | null;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusClass(status: string): string {
  const lower = status.toLowerCase();
  if (lower === "active" || lower === "in_progress") return s.detailsStatusActive;
  if (lower === "completed" || lower === "paid") return s.detailsStatusCompleted;
  return s.detailsStatusDraft;
}

export function MessagesClient({
  conversations,
  selectedProjectId,
  selectedProjectName,
  selectedOtherParty,
  threadMessages,
  currentUserId,
  projectDetail,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [convTab, setConvTab] = useState<"all" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailTab, setDetailTab] = useState<"details" | "budget" | "history">("details");

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
    <div className={s.messagesWrapper}>
      {/* Floating header */}
      <div className={s.pageHeader}>
        <h1 className={shared.pageTitle}>Messages</h1>
        <p className={s.pageStats}>
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""} | {conversations.filter(c => c.lastPreview).length} active
        </p>
      </div>

      {/* Channel tabs */}
      <div className={s.channelTabs}>
        <span className={s.channelTabActive}>
          All<span className={s.channelTabCount}>{conversations.length}</span>
        </span>
        <span className={s.channelTab}>
          Projects<span className={s.channelTabCount}>{conversations.length}</span>
        </span>
        <span className={s.channelTab}>
          SMS<span className={s.channelTabCount}>0</span>
        </span>
        <span className={s.channelTab}>
          Email<span className={s.channelTabCount}>0</span>
        </span>
      </div>

      <div className={s.messagesLayout}>
      {/* ── Combined messages + chat container ── */}
      <div className={s.messagesContainer}>
      {/* ── Left panel: Conversation list ── */}
      <div className={s.conversationPanel}>
        <div className={s.convHeader}>
          <div className={s.convHeaderRow}>
            <h3 className={s.convTitle}>Messages</h3>
            <span className={s.convCount}>{conversations.length}</span>
          </div>
        </div>

        <div className={s.convToolbar}>
          <div className={s.convToolbarRow}>
            <button
              type="button"
              className={convTab === "all" ? shared.filterPillActive : shared.filterPill}
              onClick={() => setConvTab("all")}
            >
              All
            </button>
            <button
              type="button"
              className={convTab === "unread" ? shared.filterPillActive : shared.filterPill}
              onClick={() => setConvTab("unread")}
            >
              Unread
            </button>
          </div>
          <div className={s.convSearch}>
            <Icon name="search" size={16} className={s.convSearchIcon} />
            <input
              type="text"
              className={s.convSearchInput}
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {conversations.length === 0 ? (
          <div className={s.convEmpty}>
            <Icon name="chat_bubble_outline" className="text-off-black/15" size={40} />
            <p className={s.convEmptyTitle}>No projects yet</p>
            <p className={s.convEmptyDesc}>
              Create or join a project to start messaging your contractor or client
            </p>
          </div>
        ) : (
          <div className={s.convScroll}>
            {conversations
              .filter((c) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  c.projectName.toLowerCase().includes(q) ||
                  c.otherPartyLabel.toLowerCase().includes(q) ||
                  (c.lastPreview && c.lastPreview.toLowerCase().includes(q))
                );
              })
              .map((c) => {
              const active = c.projectId === selectedProjectId;
              return (
                <Link
                  key={c.projectId}
                  href={`/messages?project=${c.projectId}`}
                  className={active ? s.convItemActive : s.convItem}
                  scroll={false}
                >
                  <div className={s.convAvatar}>
                    {getInitials(c.otherPartyLabel)}
                  </div>
                  <div className={s.convContent}>
                    <p className={s.convName}>{c.projectName}</p>
                    <p className={s.convPreview}>
                      {c.lastPreview ?? "No messages yet"}
                    </p>
                  </div>
                  {c.lastAt && (
                    <span className={s.convTime}>
                      {formatRelativeTime(c.lastAt)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Center panel: Chat thread ── */}
      <div className={s.chatPanel}>
        {!selectedProjectId ? (
          <div className={s.chatEmpty}>
            <Icon name="forum" className={s.chatEmptyIcon} size={56} />
            <p className={s.chatEmptyTitle}>Select a conversation</p>
            <p className={s.chatEmptyDesc}>
              Choose a project on the left, or open Messages from a project page
            </p>
          </div>
        ) : (
          <>
            <div className={s.chatHeader}>
              <div className={s.chatHeaderLeft}>
                <div>
                  <p className={s.chatHeaderName}>{selectedProjectName}</p>
                  <p className={s.chatHeaderSub}>{selectedOtherParty}</p>
                </div>
              </div>
              <div className={s.chatHeaderActions}>
                <button type="button" className={s.chatHeaderAction} title="Phone call">
                  <Icon name="call" size={18} />
                </button>
                <button type="button" className={s.chatHeaderAction} title="Video call">
                  <Icon name="videocam" size={18} />
                </button>
                <button type="button" className={s.chatHeaderAction} title="More options">
                  <Icon name="more_vert" size={18} />
                </button>
              </div>
            </div>

            <div className={s.chatScroll}>
              {threadMessages.length === 0 ? (
                <div className={s.chatEmpty}>
                  <p className={s.chatEmptyDesc}>No messages yet -- say hello below.</p>
                </div>
              ) : (
                threadMessages.map((m) => {
                  const mine = m.senderId === currentUserId;
                  return (
                    <div
                      key={m.id}
                      className={mine ? s.msgRowMine : s.msgRowTheirs}
                    >
                      <div className={mine ? s.msgBubbleMine : s.msgBubbleTheirs}>
                        {!mine && <p className={s.msgSender}>{m.senderName}</p>}
                        <p className={s.msgBody}>{m.body}</p>
                        <p className={mine ? s.msgTimeMine : s.msgTimeTheirs}>
                          {new Date(m.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={s.composer}>
              {error && <p className={s.composerError}>{error}</p>}
              <input
                type="text"
                className={s.composerInput}
                placeholder="Write a message..."
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
                <Icon name="send" size={18} className="text-white" />
              </button>
            </div>
          </>
        )}
      </div>
      </div>

      {/* ── Right panel: Project details ── */}
      {selectedProjectId && projectDetail ? (
        <div className={s.detailsPanel}>
          <div className={s.detailsHeader}>
            <p className={s.detailsName}>{projectDetail.name}</p>
            <div className={s.detailsStatusRow}>
              <span className={cn(s.detailsStatusBadge, statusClass(projectDetail.status))}>
                {statusLabel(projectDetail.status)}
              </span>
            </div>
            <div className={s.detailsActions}>
              <button type="button" className={s.detailsActionBtn} title="Call">
                <Icon name="call" size={16} />
              </button>
              <button type="button" className={s.detailsActionBtn} title="Chat">
                <Icon name="chat" size={16} />
              </button>
              <button type="button" className={s.detailsActionBtn} title="Email">
                <Icon name="email" size={16} />
              </button>
            </div>
          </div>

          <div className={s.detailsTabs}>
            <button
              type="button"
              className={detailTab === "details" ? s.detailsTabActive : s.detailsTab}
              onClick={() => setDetailTab("details")}
            >
              Details
            </button>
            <button
              type="button"
              className={detailTab === "budget" ? s.detailsTabActive : s.detailsTab}
              onClick={() => setDetailTab("budget")}
            >
              Budget
            </button>
            <button
              type="button"
              className={detailTab === "history" ? s.detailsTabActive : s.detailsTab}
              onClick={() => setDetailTab("history")}
            >
              History
            </button>
          </div>

          <div className={s.detailsBody}>
            {detailTab === "details" && (
              <>
                <p className={s.detailsSectionTitle}>Project Info</p>
                <div className={s.detailsFieldGrid}>
                  <div className={s.detailsFieldItem}>
                    <p className={s.detailsFieldLabel}>Project</p>
                    <p className={s.detailsFieldValue}>{projectDetail.name}</p>
                  </div>
                  <div className={s.detailsFieldItem}>
                    <p className={s.detailsFieldLabel}>Status</p>
                    <p className={s.detailsFieldValue}>{statusLabel(projectDetail.status)}</p>
                  </div>
                  <div className={s.detailsFieldItem}>
                    <p className={s.detailsFieldLabel}>Contact</p>
                    <p className={s.detailsFieldValue}>{selectedOtherParty}</p>
                  </div>
                  <div className={s.detailsFieldItem}>
                    <p className={s.detailsFieldLabel}>Budget</p>
                    <p className={s.detailsFieldValue}>{formatCurrency(projectDetail.totalBudget)}</p>
                  </div>
                </div>

                <p className={s.detailsSectionTitle}>Budget Summary</p>
                <div>
                  <div className={s.detailsBudgetRow}>
                    <span className={s.detailsBudgetLabel}>Total Budget</span>
                    <span className={s.detailsBudgetValue}>
                      {formatCurrency(projectDetail.totalBudget)}
                    </span>
                  </div>
                  <div className={s.detailsBudgetRow}>
                    <span className={s.detailsBudgetLabel}>Spent</span>
                    <span className={s.detailsBudgetValue}>
                      {formatCurrency(projectDetail.totalSpent)}
                    </span>
                  </div>
                  <div className={s.detailsBudgetRow}>
                    <span className={s.detailsBudgetLabel}>Remaining</span>
                    <span className={s.detailsBudgetValue}>
                      {formatCurrency(projectDetail.totalBudget - projectDetail.totalSpent)}
                    </span>
                  </div>
                </div>

                <Link href={`/projects/${projectDetail.id}`} className={s.detailsLink}>
                  View full project &rarr;
                </Link>
              </>
            )}

            {detailTab === "budget" && (
              <>
                <p className={s.detailsSectionTitle}>Budget Overview</p>
                <div>
                  <div className={s.detailsBudgetRow}>
                    <span className={s.detailsBudgetLabel}>Total Budget</span>
                    <span className={s.detailsBudgetValue}>
                      {formatCurrency(projectDetail.totalBudget)}
                    </span>
                  </div>
                  <div className={s.detailsBudgetRow}>
                    <span className={s.detailsBudgetLabel}>Spent</span>
                    <span className={s.detailsBudgetValue}>
                      {formatCurrency(projectDetail.totalSpent)}
                    </span>
                  </div>
                  <div className={s.detailsBudgetRow}>
                    <span className={s.detailsBudgetLabel}>Remaining</span>
                    <span className={s.detailsBudgetValue}>
                      {formatCurrency(projectDetail.totalBudget - projectDetail.totalSpent)}
                    </span>
                  </div>
                </div>

                {projectDetail.categories.length > 0 && (
                  <>
                    <p className={s.detailsSectionTitle}>Categories</p>
                    {projectDetail.categories.map((cat) => {
                      const pct =
                        cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
                      return (
                        <div key={cat.name} className={s.detailsCategoryRow}>
                          <div className={s.detailsCategoryHeader}>
                            <span className={s.detailsCategoryName}>{cat.name}</span>
                            <span className={s.detailsCategoryAmount}>
                              {formatCurrency(cat.spent)} / {formatCurrency(cat.allocated)}
                            </span>
                          </div>
                          <ProgressBar value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {detailTab === "history" && (
              <>
                <p className={s.detailsSectionTitle}>Message History</p>
                <p className="text-xs text-off-black/40">
                  {threadMessages.length} message{threadMessages.length !== 1 ? "s" : ""} in this conversation
                </p>
              </>
            )}
          </div>
        </div>
      ) : selectedProjectId ? (
        <div className={s.detailsPanel}>
          <div className={s.detailsEmpty}>
            <p className={s.detailsEmptyText}>Project details unavailable</p>
          </div>
        </div>
      ) : null}
    </div>
    </div>
  );
}
