import { Routes, Route } from "react-router-dom";
import { getSubdomain } from "@/lib/subdomain";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { AdminPage } from "@/pages/AdminPage";
import { PublicParishPage } from "@/pages/PublicParishPage";
import { AuthGate } from "@/components/AuthGate";

function App() {
  const subdomain = getSubdomain(window.location.hostname);

  if (subdomain) {
    return <PublicParishPage slug={subdomain} />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/admin"
        element={
          <AuthGate>
            <AdminPage />
          </AuthGate>
        }
      />
    </Routes>
  );
}

export default App;
