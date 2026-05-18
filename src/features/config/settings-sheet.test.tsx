/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockMutate = vi.fn();

vi.mock("~/features/config/use-config", () => ({
  useConfig: () => ({
    data: { username: "testuser", password: "testpass", apiToken: "tok123" },
  }),
  useSaveConfig: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

const { SettingsSheet } = await import("~/features/config/settings-sheet");

describe("SettingsSheet", () => {
  afterEach(() => {
    cleanup();
    mockMutate.mockReset();
  });

  async function openSheet() {
    const user = userEvent.setup();
    render(<SettingsSheet />);
    await user.click(screen.getByRole("button", { name: /settings/i }));
    return user;
  }

  it("renders settings trigger button", () => {
    render(<SettingsSheet />);
    expect(screen.getByRole("button", { name: /settings/i })).toBeDefined();
  });

  it("opens sheet with config values populated", async () => {
    await openSheet();
    const usernameInput = screen.getByLabelText(/bgg username/i);
    expect((usernameInput as HTMLInputElement).value).toBe("testuser");
  });

  it("renders all three form fields with labels", async () => {
    await openSheet();
    expect(screen.getByLabelText(/bgg username/i)).toBeDefined();
    expect(screen.getByLabelText(/bgg password/i)).toBeDefined();
    expect(screen.getByLabelText(/xml api token/i)).toBeDefined();
  });

  it("calls save with form values", async () => {
    const user = await openSheet();
    const usernameInput = screen.getByLabelText(/bgg username/i);
    await user.clear(usernameInput);
    await user.type(usernameInput, "newuser");
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ username: "newuser" }),
      expect.any(Object),
    );
  });

  it("calls clear with empty values after confirmation", async () => {
    const user = await openSheet();
    await user.click(screen.getByRole("button", { name: /^clear$/i }));
    await user.click(
      screen.getByRole("button", { name: /^clear$/i, hidden: false }),
    );
    expect(mockMutate).toHaveBeenCalledWith(
      { username: "", password: "", apiToken: "" },
      expect.any(Object),
    );
  });

  it("shows description text for password and api token fields", async () => {
    await openSheet();
    expect(screen.getByText(/used to log in to bgg/i)).toBeDefined();
    expect(
      screen.getByText(
        /only needed for searching games by name\. not required/i,
      ),
    ).toBeDefined();
  });
});
