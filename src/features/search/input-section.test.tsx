/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InputSection } from "~/features/search/input-section";

describe("InputSection", () => {
  afterEach(() => cleanup());

  const defaultProps = {
    onSearchByName: vi.fn(),
    onAddByIds: vi.fn(),
    isSearching: false,
    hasConfig: true,
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
});
