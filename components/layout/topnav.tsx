import { Bell, MessageSquareMore, Search } from "lucide-react";

export function Topnav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 xl:left-[18rem]">
      <div className="bg-[rgb(250_248_255_/_0.7)] backdrop-blur-[12px]">
        <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="h-12 w-full rounded-full bg-surface-container-highest pl-12 pr-4 text-sm text-on-surface outline-none transition focus:bg-surface-container-lowest"
              placeholder="Search marketplace assets..."
              type="text"
            />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <button
              aria-label="Notifications"
              className="grid size-11 place-items-center rounded-full border-none bg-transparent text-on-surface-variant transition hover:bg-surface-container hover:text-primary"
              type="button"
            >
              <Bell className="size-5" />
            </button>
            <button
              aria-label="Messages"
              className="relative grid size-11 place-items-center rounded-full border-none bg-transparent text-on-surface-variant transition hover:bg-surface-container hover:text-primary"
              type="button"
            >
              <MessageSquareMore className="size-5" />
              <span className="absolute right-3 top-3 size-2 rounded-full bg-error ring-2 ring-surface" />
            </button>
            <div className="hidden items-center gap-3 sm:flex pl-4 border-l border-outline-variant/30">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-on-surface">Hello, Alex</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">Host Account</span>
              </div>
              <div className="relative size-10 overflow-hidden rounded-full ring-2 ring-primary ring-offset-2 ring-offset-surface shadow-[0_8px_28px_rgb(19_27_46_/_0.06)]">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
                  alt="Alex Rivera"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
