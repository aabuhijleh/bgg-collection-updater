/**
 * @vitest-environment happy-dom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { InputSection } from "~/features/search/input-section";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("InputSection", () => {
  afterEach(() => cleanup());

  const defaultProps = {
    onSearchByName: vi.fn(),
    onAddByIds: vi.fn(),
    isSearching: false,
    searchWarning: null as string | null,
    idsWarning: null as string | null,
  };

  it("renders two tabs", () => {
    render(<InputSection {...defaultProps} />);
    expect(screen.getByRole("tab", { name: /search by name/i })).toBeDefined();
    expect(
      screen.getByRole("tab", { name: /i already have ids/i }),
    ).toBeDefined();
  });

  it("shows textarea for names tab", () => {
    render(<InputSection {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDefined();
    expect((textarea as HTMLTextAreaElement).placeholder).toContain("Catan");
  });

  it("calls onSearchByName with parsed names", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<InputSection {...defaultProps} onSearchByName={onSearch} />);
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Catan; Wingspan");
    const button = screen.getByRole("button", { name: /search games/i });
    await user.click(button);
    expect(onSearch).toHaveBeenCalledWith(["Catan", "Wingspan"], false);
  });

  it("disables search button when no input", () => {
    render(<InputSection {...defaultProps} />);
    const button = screen.getByRole("button", { name: /search games/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("disables search button and shows warning when searchWarning is set", async () => {
    const user = userEvent.setup();
    render(
      <InputSection
        {...defaultProps}
        searchWarning="Set your XML API token in settings to search by name."
      />,
    );
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Catan");
    const button = screen.getByRole("button", { name: /search games/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/set your xml api token/i)).toBeDefined();
  });

  it("disables add button and shows warning when idsWarning is set on ids tab", async () => {
    const user = userEvent.setup();
    render(
      <InputSection
        {...defaultProps}
        idsWarning="Set your BGG username and password in settings to add games."
      />,
    );
    await user.click(screen.getByRole("tab", { name: /i already have ids/i }));
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "12345");
    const button = screen.getByRole("button", { name: /add to collection/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/set your bgg username/i)).toBeDefined();
  });

  it("does not show searchWarning on the ids tab", async () => {
    const user = userEvent.setup();
    render(
      <InputSection
        {...defaultProps}
        searchWarning="Set your XML API token in settings to search by name."
      />,
    );
    await user.click(screen.getByRole("tab", { name: /i already have ids/i }));
    expect(screen.queryByText(/set your xml api token/i)).toBeNull();
  });

  it("does not show idsWarning on the names tab", () => {
    render(
      <InputSection
        {...defaultProps}
        idsWarning="Set your BGG username and password in settings to add games."
      />,
    );
    expect(screen.queryByText(/set your bgg username/i)).toBeNull();
  });

  it("enables search button when searchWarning is null and input exists", async () => {
    const user = userEvent.setup();
    render(<InputSection {...defaultProps} searchWarning={null} />);
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Catan");
    const button = screen.getByRole("button", { name: /search games/i });
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
});
