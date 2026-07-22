import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Spotlight } from "./Spotlight";
import type { Rect } from "../utils/rect";

const rect: Rect = {
  x: 10,
  y: 20,
  width: 100,
  height: 40,
  top: 20,
  left: 10,
  right: 110,
  bottom: 60,
};

describe("Spotlight", () => {
  it("renders a mask hole for the target rect", () => {
    const { container } = render(
      <Spotlight
        rect={rect}
        radius={6}
        color="#000"
        opacity={0.5}
        zIndex={1}
        interactable={false}
      />
    );
    const holes = container.querySelectorAll("mask rect");
    // one full-cover white rect + one black hole rect
    expect(holes.length).toBe(2);
  });

  it("renders without a hole when rect is null", () => {
    const { container } = render(
      <Spotlight
        rect={null}
        radius={6}
        color="#000"
        opacity={0.5}
        zIndex={1}
        interactable={false}
      />
    );
    expect(container.querySelectorAll("mask rect").length).toBe(1);
  });

  it("fires onOverlayClick when not interactable", async () => {
    const user = userEvent.setup();
    const onOverlayClick = vi.fn();
    const { container } = render(
      <Spotlight
        rect={rect}
        radius={6}
        color="#000"
        opacity={0.5}
        zIndex={1}
        interactable={false}
        onOverlayClick={onOverlayClick}
      />
    );
    await user.click(container.querySelector("svg")!);
    expect(onOverlayClick).toHaveBeenCalled();
  });

  it("does not capture clicks when interactable", () => {
    const { container } = render(
      <Spotlight
        rect={rect}
        radius={6}
        color="#000"
        opacity={0.5}
        zIndex={1}
        interactable
      />
    );
    expect((container.querySelector("svg") as SVGElement).style.pointerEvents).toBe(
      "none"
    );
  });
});
