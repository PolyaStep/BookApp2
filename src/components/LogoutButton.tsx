import { IonButton } from "@ionic/react";
import { useAuth } from "../context/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();
  return <IonButton onClick={() => logout()}>Logout</IonButton>;
}