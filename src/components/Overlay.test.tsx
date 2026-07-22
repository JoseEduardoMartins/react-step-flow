import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Overlay } from "./Overlay";

describe("Overlay", () => {
  it("renders a backdrop with the given color and opacity", () => {
    const { container } = render(
      <Overlay color="#123" opacity={0.4} zIndex={5} />
    );
    const el = container.querySelector("[data-rsf-overlay]") as HTMLElement;
    expect(el.style.backgroundColor).toBe("rgb(17, 34, 51)");
    expect(el.style.opacity).toBe("0.4");
    expect(el.style.cursor).toBe("default");
  });

  it("invokes onClick and shows a pointer cursor when clickable", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <Overlay color="#000" opacity={0.5} zIndex={1} onClick={onClick} />
    );
    const el = container.querySelector("[data-rsf-overlay]") as HTMLElement;
    expect(el.style.cursor).toBe("pointer");
    await user.click(el);
    expect(onClick).toHaveBeenCalled();
  });
});
