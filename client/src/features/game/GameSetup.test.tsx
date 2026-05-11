import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GameSetup, type GameSetupProps } from "./GameSetup";
import type { BotCatalogItem } from "./types";

const bots: BotCatalogItem[] = [
  {
    id: "random",
    name: "random",
    description: "Senses and moves randomly.",
    availability: "available",
    unavailableReason: null
  },
  {
    id: "attacker",
    name: "attacker",
    description: "Tries a simple attacking plan.",
    availability: "available",
    unavailableReason: null
  },
  {
    id: "oracle",
    name: "Oracle",
    description: "Tracks possible board states.",
    availability: "unavailable",
    unavailableReason: "Not bundled in the local MVP"
  }
];

function renderSetup(options: Partial<GameSetupProps> = {}) {
  const props: GameSetupProps = {
    error: null,
    loading: false,
    bots,
    botsLoading: false,
    onStart: vi.fn(),
    ...options
  };

  render(<GameSetup {...props} />);
  return props;
}

afterEach(() => {
  cleanup();
});

describe("GameSetup", () => {
  it("defaults to random color and random bot", () => {
    renderSetup();

    const colorGroup = screen.getByRole("group", { name: "Choose color" });
    expect(within(colorGroup).getByRole("button", { name: "random" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Bot")).toHaveValue("random");
    expect(screen.getByRole("option", { name: /Oracle/ })).toBeDisabled();
    expect(screen.getByRole("option", { name: /Not bundled in the local MVP/ })).toBeDisabled();
  });

  it("starts with the selected white color and random bot", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    renderSetup({ onStart });

    const colorGroup = screen.getByRole("group", { name: "Choose color" });
    await user.click(within(colorGroup).getByRole("button", { name: "white" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(within(colorGroup).getByRole("button", { name: "white" })).toHaveAttribute("aria-pressed", "true");
    expect(within(colorGroup).getByRole("button", { name: "random" })).toHaveAttribute("aria-pressed", "false");
    expect(onStart).toHaveBeenCalledWith({
      humanColor: "white",
      botId: "random",
      timer: { initialSeconds: 900, incrementSeconds: 5 }
    });
  });

  it("starts with the selected black color and random bot", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    renderSetup({ onStart });

    const colorGroup = screen.getByRole("group", { name: "Choose color" });
    await user.click(within(colorGroup).getByRole("button", { name: "black" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(within(colorGroup).getByRole("button", { name: "black" })).toHaveAttribute("aria-pressed", "true");
    expect(within(colorGroup).getByRole("button", { name: "random" })).toHaveAttribute("aria-pressed", "false");
    expect(onStart).toHaveBeenCalledWith({
      humanColor: "black",
      botId: "random",
      timer: { initialSeconds: 900, incrementSeconds: 5 }
    });
  });

  it("starts with the selected attacker bot", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    renderSetup({ onStart });

    await user.selectOptions(screen.getByLabelText("Bot"), "attacker");
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(screen.getByLabelText("Bot")).toHaveValue("attacker");
    expect(onStart).toHaveBeenCalledWith({
      humanColor: "random",
      botId: "attacker",
      timer: { initialSeconds: 900, incrementSeconds: 5 }
    });
  });

  it("starts with the strict timer when selected", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    renderSetup({ onStart });

    await user.click(screen.getByRole("button", { name: "15:00 strict" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(screen.getByRole("button", { name: "15:00 strict" })).toHaveAttribute("aria-pressed", "true");
    expect(onStart).toHaveBeenCalledWith({
      humanColor: "random",
      botId: "random",
      timer: { initialSeconds: 900, incrementSeconds: 0 }
    });
  });

  it("returns to random color before starting with the random bot", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    renderSetup({ onStart });

    const colorGroup = screen.getByRole("group", { name: "Choose color" });
    await user.click(within(colorGroup).getByRole("button", { name: "white" }));
    await user.click(within(colorGroup).getByRole("button", { name: "random" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(within(colorGroup).getByRole("button", { name: "random" })).toHaveAttribute("aria-pressed", "true");
    expect(within(colorGroup).getByRole("button", { name: "white" })).toHaveAttribute("aria-pressed", "false");
    expect(onStart).toHaveBeenCalledWith({
      humanColor: "random",
      botId: "random",
      timer: { initialSeconds: 900, incrementSeconds: 5 }
    });
  });

  it("disables Start and shows the loading label while loading", () => {
    renderSetup({ loading: true });

    expect(screen.getByRole("button", { name: "Starting" })).toBeDisabled();
  });

  it("renders errors as alerts", () => {
    renderSetup({ error: "Bot oracle is not available" });

    expect(screen.getByRole("alert")).toHaveTextContent("Bot oracle is not available");
  });
});
