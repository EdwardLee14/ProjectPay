import { redirect } from "next/navigation";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import { ProfileForm } from "@/components/settings/profile-form";
import { SignOutButton } from "@/components/settings/sign-out-button";
import s from "./settings.module.css";
import shared from "@/styles/shared.module.css";

export default async function SettingsPage() {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className={shared.dashboardPage}>
      {/* Page Header */}
      <div>
        <p className={shared.eyebrow}>Account</p>
        <h1 className={shared.pageTitle}>
          <span className="font-normal">Account</span>{" "}
          <strong>Settings</strong>
        </h1>
      </div>

      <div className={s.container}>
        {/* Profile Section */}
        <section className={s.sectionCard}>
          <div className={s.accentPrimary} />
          <div className={s.sectionBody}>
            <h2 className={s.sectionTitle}>
              <span className="font-normal">Your</span> <strong>Profile</strong>
            </h2>
            <ProfileForm
              initialName={user.name}
              initialCompanyName={user.companyName}
              initialPhone={user.phone}
            />
          </div>
        </section>

        {/* Account Details Section */}
        <section className={s.sectionCard}>
          <div className={s.accentMint} />
          <div className={s.sectionBody}>
            <h2 className={s.sectionTitle}>
              <span className="font-normal">Account</span>{" "}
              <strong>Details</strong>
            </h2>

            <div>
              {/* Email */}
              <div className={s.readOnlyFieldBorder}>
                <span className={s.readOnlyLabel}>
                  <Icon name="lock" className="text-base text-off-black" />
                  Email
                </span>
                <span className={s.readOnlyValue}>{user.email}</span>
              </div>

              {/* Role */}
              <div className={s.readOnlyFieldBorder}>
                <span className={s.readOnlyLabel}>Role</span>
                <span className={s.roleBadge}>{user.role}</span>
              </div>

              {/* Member since */}
              <div className={s.readOnlyField}>
                <span className={s.readOnlyLabel}>Member since</span>
                <span className={s.readOnlyValue}>{memberSince}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Session Section */}
        <section className={s.sectionCard}>
          <div className={s.accentDestructive} />
          <div className={s.sectionBody}>
            <h2 className={s.sectionTitle}>
              <span className="font-normal">Active</span>{" "}
              <strong>Session</strong>
            </h2>
            <p className={s.sessionDescription}>
              Sign out of your account on this device. You will need to sign in
              again to access your projects and settings.
            </p>
            <SignOutButton />
          </div>
        </section>
      </div>
    </main>
  );
}
