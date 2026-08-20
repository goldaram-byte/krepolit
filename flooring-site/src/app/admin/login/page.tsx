"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <form action={formAction} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">Вход в админку</h1>

        <div className="mt-6">
          <label htmlFor="login" className="block text-sm font-medium text-stone-700">
            Логин
          </label>
          <input
            id="login"
            name="login"
            type="text"
            required
            autoComplete="username"
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="password" className="block text-sm font-medium text-stone-700">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {state.error && <p className="mt-4 text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Вход…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
