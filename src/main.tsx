
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import { AuthProvider } from "./auth";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider
      config={{
        loginMethods: ['apple', 'email', 'passkey', 'wallet'],
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
        appearance: { theme: 'light', accentColor: '#00FFC2' },
      }}
    >
      <App />
    </AuthProvider>
  );
