import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the Stage 1 game shell", () => {
    render(<App />);

    expect(screen.getByLabelText("Chess board")).toBeInTheDocument();
    expect(screen.getByText("Your turn to sense")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pass" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resign" })).toBeInTheDocument();
  });
});
