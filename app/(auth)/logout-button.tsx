import { logoutAction } from "@/app/(auth)/actions";

// Plain server-action form — no client JS needed. Inherits whatever button
// style the caller passes via className.
export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button className={className} type="submit">
        Log out
      </button>
    </form>
  );
}
