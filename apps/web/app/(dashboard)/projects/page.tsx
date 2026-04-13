import { Icon } from "@/components/ui/icon";
import s from "./projects.module.css";

export default function ProjectsPage() {
  return (
    <div className={s.emptyDetail}>
      <Icon name="folder_open" className={s.emptyDetailIcon} size={48} />
      <p className={s.emptyDetailTitle}>Select a project</p>
      <p className={s.emptyDetailDesc}>
        Choose a project from the list to view details
      </p>
    </div>
  );
}
