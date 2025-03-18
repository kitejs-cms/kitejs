import { DashboardModule } from "../../models/module.model";
import { ProfilePage } from "./pages/profile";
import { UserIcon } from "lucide-react";

export const ProfileModule: DashboardModule = {
  name: "profile",
  routes: [
    {
      path: "profile",
      element: <ProfilePage />,
      label: "Profile",
      icon: <UserIcon />,
    },
  ],
};
