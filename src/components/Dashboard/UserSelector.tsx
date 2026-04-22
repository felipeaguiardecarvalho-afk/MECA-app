import React, { useEffect, useMemo, useRef, useState } from "react";

export type AdminUserOption = {
  user_id: string;
  email: string;
  diagnosticsCount: number;
};

interface Props {
  users: AdminUserOption[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
}

function diagnosticsLabel(count: number): string {
  return count === 1 ? "1 diagnóstico" : `${count} diagnósticos`;
}

export const UserSelector: React.FC<Props> = ({
  users,
  selectedUserId,
  onSelect,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user.user_id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;

    return users.filter((user) => {
      const label = diagnosticsLabel(user.diagnosticsCount).toLowerCase();
      return (
        user.email.toLowerCase().includes(normalizedQuery) ||
        label.includes(normalizedQuery)
      );
    });
  }, [query, users]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <label
        htmlFor="admin-user-search"
        className="mb-2 block text-sm font-semibold text-gray-800"
      >
        Usuários
      </label>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[52px] w-full items-center justify-between gap-4 rounded-lg border-2 border-[#1a3a5c] bg-[#eef3f9] px-4 py-3 text-left transition hover:bg-[#e6eef7] focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/25"
      >
        <span className="min-w-0">
          <span className="block break-all text-sm font-bold text-[#1a3a5c]">
            {selectedUser?.email ?? "Selecione um usuário"}
          </span>
          {selectedUser && (
            <span className="mt-0.5 block text-xs text-gray-600">
              {diagnosticsLabel(selectedUser.diagnosticsCount)}
            </span>
          )}
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-base font-bold text-[#1a3a5c] transition ${
            open ? "rotate-180" : ""
          }`}
        >
          v
        </span>
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-[calc(100%-10px)] z-30 rounded-lg border border-gray-200 bg-white p-3 shadow-xl sm:left-5 sm:right-5">
          <input
            id="admin-user-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por e-mail ou diagnósticos"
            className="mb-3 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/15"
            autoFocus
          />

          <div
            role="listbox"
            aria-label="Usuários"
            className="max-h-72 overflow-y-auto pr-1"
          >
            {filteredUsers.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-gray-500">
                Nenhum usuário encontrado.
              </p>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => {
                  const selected = user.user_id === selectedUserId;

                  return (
                    <button
                      key={user.user_id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onSelect(user.user_id);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`w-full rounded-md border px-3 py-2.5 text-left transition ${
                        selected
                          ? "border-[#1a3a5c] bg-[#eef3f9]"
                          : "border-transparent bg-white hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`block break-all text-sm ${
                          selected
                            ? "font-bold text-[#1a3a5c]"
                            : "font-semibold text-gray-800"
                        }`}
                      >
                        {user.email}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {diagnosticsLabel(user.diagnosticsCount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
