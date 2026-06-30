import { AuthForm } from "../_components/auth-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <AuthForm mode="signup" />
    </main>
  );
}
