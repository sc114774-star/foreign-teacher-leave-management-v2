// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "teacher" as "teacher" | "cingshan" | "dongyuan",
  supabaseConfigured: true,
  queryMode: "empty" as "empty" | "loading" | "error",
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u-1", name: "Lavinia", email: "teacher@example.com", role: state.role },
    supabaseConfigured: state.supabaseConfigured,
    supabaseSession: null,
    loading: false,
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ leave: { getAttachment: { fetch: vi.fn(async () => null) } } }),
    leave: { list: { useQuery: vi.fn(() => ({ data: [], isLoading: state.queryMode === "loading", error: state.queryMode === "error" ? new Error("network") : null })) } },
  },
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: state.queryMode === "loading",
    error: state.queryMode === "error" ? new Error("network") : null,
  })),
}));

import Home from "./Home";

describe("Home Supabase identity runtime consumer", () => {
  beforeEach(() => {
    state.supabaseConfigured = true;
    state.queryMode = "empty";
    window.history.replaceState({}, "", "/");
  });
  afterEach(() => cleanup());

  it.each([
    ["teacher", "New leave application"],
    ["cingshan", "青山國小 · School Office"],
    ["dongyuan", "東原國中 · School Office"],
  ] as const)("renders the %s workflow from Supabase identity", (role, expectedText) => {
    state.role = role;
    render(<Home />);
    expect(screen.getByText(expectedText)).toBeTruthy();
  });

  it("shows loading, error, and empty states for formal Supabase data", () => {
    state.role = "teacher";
    state.queryMode = "loading";
    const { rerender } = render(<Home />);
    expect(screen.getByText("Loading leave records · 正在載入請假紀錄")).toBeTruthy();
    state.queryMode = "error";
    rerender(<Home />);
    expect(screen.getByText("Unable to load leave records · 無法載入請假紀錄")).toBeTruthy();
    state.queryMode = "empty";
    rerender(<Home />);
    expect(screen.getByText("No leave records yet · 目前尚無請假紀錄")).toBeTruthy();
  });

  it("shows loading, error, and empty states on the authenticated tRPC path", () => {
    state.supabaseConfigured = false;
    state.role = "teacher";
    state.queryMode = "loading";
    const { rerender } = render(<Home />);
    expect(screen.getByText("Loading leave records · 正在載入請假紀錄")).toBeTruthy();
    state.queryMode = "error";
    rerender(<Home />);
    expect(screen.getByText("Unable to load leave records · 無法載入請假紀錄")).toBeTruthy();
    state.queryMode = "empty";
    rerender(<Home />);
    expect(screen.getByText("No leave records yet · 目前尚無請假紀錄")).toBeTruthy();
  });

  it("only permits URL role override in demo preview", () => {
    state.role = "teacher";
    window.history.replaceState({}, "", "/?role=dongyuan");
    render(<Home />);
    expect(screen.getByText("東原國中 · School Office")).toBeTruthy();
    cleanup();
    window.history.replaceState({}, "", "/");
    render(<Home />);
    expect(screen.getByText("Good morning, Lavinia")).toBeTruthy();
  });
});
