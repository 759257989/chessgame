import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GameSetup } from "./GameSetup";

afterEach(() => {
  cleanup();
});

describe("GameSetup", () => {
  it("defaults to random color and random bot", () => {
    render(<GameSetup error={null} loading={false} onStart={vi.fn()} />);

    const colorGroup = screen.getByRole("group", { name: "Choose color" });
    expect(within(colorGroup).getByRole("button", { name: "random" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Bot")).toHaveValue("random");
  });

  it("starts with the selected white color and random bot", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(<GameSetup error={null} loading={false} onStart={onStart} />);

    const colorGroup = screen.getByRole("group", { name: "Choose color" });
    await user.click(within(colorGroup).getByRole("button", { name: "white" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(within(colorGroup).getByRole("button", { name: "white" })).toHaveAttribute("aria-pressed", "true");
    expect(within(colorGroup).getByRole("button", { name: "random" })).toHaveAttribute("aria-pressed", "false");
    expect(onStart).toHaveBeenCalledWith({ humanColor: "white", botId: "random" });
  });

  it("starts with the selected black color and random bot", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(<GameSetup error={null} loading={false} onStart={onStart} />);

    const colorGroup = screen.getByRole("group", { name: "Choose color" });
    await user.click(within(colorGroup).getByRole("button", { name: "black" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(within(colorGroup).getByRole("button", { name: "black" })).toHaveAttribute("aria-pressed", "true");
    expect(within(colorGroup).getByRole("button", { name: "random" })).toHaveAttribute("aria-pressed", "false");
    expect(onStart).toHaveBeenCalledWith({ humanColor: "black", botId: "random" });
  });

  it("starts with the selected attacker bot", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(<GameSetup error={null} loading={false} onStart={onStart} />);

    await user.selectOptions(screen.getByLabelText("Bot"), "attacker");
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(screen.getByLabelText("Bot")).toHaveValue("attacker");
    expect(onStart).toHaveBeenCalledWith({ humanColor: "random", botId: "attacker" });
  });

  it("returns to random color before starting with the random bot", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(<GameSetup error={null} loading={false} onStart={onStart} />);

    const colorGroup = screen.getByRole("group", { name: "Choose color" });
    await user.click(within(colorGroup).getByRole("button", { name: "white" }));
    await user.click(within(colorGroup).getByRole("button", { name: "random" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(within(colorGroup).getByRole("button", { name: "random" })).toHaveAttribute("aria-pressed", "true");
    expect(within(colorGroup).getByRole("button", { name: "white" })).toHaveAttribute("aria-pressed", "false");
    expect(onStart).toHaveBeenCalledWith({ humanColor: "random", botId: "random" });
  });

  it("disables Start and shows the loading label while loading", () => {
    render(<GameSetup error={null} loading={true} onStart={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Starting" })).toBeDisabled();
  });

  it("renders errors as alerts", () => {
    render(<GameSetup error="Bot oracle is not available" loading={false} onStart={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Bot oracle is not available");
  });
});
