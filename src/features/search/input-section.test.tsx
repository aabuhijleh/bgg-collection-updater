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
    idsWarning: null as string | null,
  };

  it("renders two tabs", () => {
    render(<InputSection {...defaultProps} />);
    expect(screen.getByRole("tab", { name: /search by name/i })).toBeDefined();
    expect(
      screen.getByRole("tab", { name: /i already have ids/i }),
    ).toBeDefined();
  });

  it("shows textarea with names placeholder", () => {
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
    const button = screen.getByRole("button", { name: /search/i });
    await user.click(button);
    expect(onSearch).toHaveBeenCalledWith(["Catan", "Wingspan"]);
  });

  it("does not disable search button when no input", () => {
    render(<InputSection {...defaultProps} />);
    const button = screen.getByRole("button", { name: /search/i });
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows idsWarning text on ids tab", async () => {
    const user = userEvent.setup();
    render(
      <InputSection
        {...defaultProps}
        idsWarning="Set your BGG username and password in settings to add games."
      />,
    );
    await user.click(screen.getByRole("tab", { name: /i already have ids/i }));
    expect(screen.getByText(/set your bgg username/i)).toBeDefined();
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
});
