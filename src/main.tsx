import React from "react";
import { createRoot } from "react-dom/client";
import { IonApp, setupIonicReact } from "@ionic/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "@ionic/react/css/core.css";
import "./theme/variables.css";

setupIonicReact();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <IonApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </IonApp>
    </AuthProvider>
  </React.StrictMode>
);
