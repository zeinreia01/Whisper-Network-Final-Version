
import { Route, Switch } from "wouter";
import Landing from "@/pages/landing";
import AnonymousMessaging from "@/pages/anonymous-messaging";
import Personal from "@/pages/personal";
import MessageThread from "@/pages/message-thread";
import UserProfile from "@/pages/user-profile";
import PersonalArchive from "@/pages/personal-archive";
import AdminPage from "@/pages/admin";
import AdminPersonal from "@/pages/admin-personal";
import AdminProfile from "@/pages/admin-profile";
import AdminProfileView from "@/pages/admin-profile-view";
import NotFound from "@/pages/not-found";
import { useState } from "react";

export default function Router() {
  const [hasEntered, setHasEntered] = useState(false);

  if (!hasEntered) {
    return <Landing onEnter={() => setHasEntered(true)} />;
  }

  return (
    <Switch>
      <Route path="/" component={AnonymousMessaging} />
      <Route path="/personal" component={Personal} />
      <Route path="/message/:id" component={MessageThread} />
      <Route path="/user/:username" component={UserProfile} />
      <Route path="/archive" component={PersonalArchive} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/personal" component={AdminPersonal} />
      <Route path="/admin/profile" component={AdminProfile} />
      <Route path="/admin/profile/:username" component={AdminProfileView} />
      <Route component={NotFound} />
    </Switch>
  );
}
