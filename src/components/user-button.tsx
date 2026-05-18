"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  LogIn,
  LogOut,
  LayoutDashboard,
  Bookmark,
  PlusCircle,
  PenSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export function UserButton() {
  const { user, loading, signOut, configured, isAdmin, ensureAdminChecked } = useAuth();
  const router = useRouter();

  if (!configured) {
    return null; // hide entirely until Supabase is set up
  }

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" aria-hidden />
    );
  }

  if (!user) {
    return (
      <Button asChild size="sm" variant="outline" className="gap-2">
        <Link href="/login">
          <LogIn className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign in</span>
        </Link>
      </Button>
    );
  }

  const initials = (user.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <DropdownMenu.Root
      onOpenChange={(open) => {
        if (open) void ensureAdminChecked();
      }}
    >
      <DropdownMenu.Trigger asChild>
        <button
          className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Account menu"
        >
          {initials}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-md"
        >
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate font-medium">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <Item icon={LayoutDashboard} onSelect={() => router.push("/dashboard")}>
            Dashboard
          </Item>
          <Item icon={Bookmark} onSelect={() => router.push("/bookmarks")}>
            Bookmarks
          </Item>

          {isAdmin && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Admin
              </div>
              <Item icon={PlusCircle} onSelect={() => router.push("/admin/questions/new")}>
                Add question
              </Item>
              <Item icon={PenSquare} onSelect={() => router.push("/admin/answers")}>
                Add answer
              </Item>
            </>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <Item
            icon={LogOut}
            onSelect={async () => {
              await signOut();
              router.refresh();
            }}
            destructive
          >
            Sign out
          </Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Item({
  icon: Icon,
  children,
  onSelect,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className={
        "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 outline-none data-[highlighted]:bg-accent " +
        (destructive ? "text-destructive" : "")
      }
    >
      <Icon className="h-3.5 w-3.5 opacity-70" />
      {children}
    </DropdownMenu.Item>
  );
}
