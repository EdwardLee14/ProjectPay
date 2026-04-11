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
        <h1 className={shared.pageTitle}>Settings</h1>
      </div>

      <div className={s.container}>
        {/* Profile Section */}
        <section className={s.sectionCard}>
          <div className={s.sectionBody}>
            <h2 className={s.sectionTitle}>Your Profile</h2>
            <ProfileForm
              initialName={user.name}
              initialCompanyName={user.companyName}
              initialPhone={user.phone}
            />
          </div>
        </section>

        {/* Account Details Section */}
        <section className={s.sectionCard}>
          <div className={s.sectionBody}>
            <h2 className={s.sectionTitle}>Account Details</h2>

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
          <div className={s.sectionBody}>
            <h2 className={s.sectionTitle}>Active Session</h2>
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
