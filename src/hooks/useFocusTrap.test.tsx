import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { useFocusTrap } from "./useFocusTrap";

function Trap({
  active,
  onEscape,
  focusKey,
}: {
  active: boolean;
  onEscape?: () => void;
  focusKey?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, { active, onEscape, focusKey });
  return (
    <div ref={ref}>
      <button>first</button>
      <button>second</button>
    </div>
  );
}

describe("useFocusTrap", () => {
  it("moves focus to the first focusable when activated", () => {
    render(<Trap active />);
    expect(document.activeElement?.textContent).toBe("first");
  });

  it("does not move focus when inactive", () => {
    render(<Trap active={false} />);
    expect(document.activeElement?.textContent).not.toBe("first");
  });

  it("wraps focus forward from the last element", async () => {
    const user = userEvent.setup();
    render(<Trap active />);
    const [, second] = document.querySelectorAll("button");
    second!.focus();
    await user.tab();
    expect(document.activeElement?.textContent).toBe("first");
  });

  it("wraps focus backward from the first element", async () => {
    const user = userEvent.setup();
    render(<Trap active />);
    const [first] = document.querySelectorAll("button");
    first!.focus();
    await user.tab({ shift: true });
    expect(document.activeElement?.textContent).toBe("second");
  });

  it("calls onEscape when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    render(<Trap active onEscape={onEscape} />);
    await user.keyboard("{Escape}");
    expect(onEscape).toHaveBeenCalledOnce();
  });

  it("restores focus to the previously focused element on teardown", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "trigger";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { unmount } = render(<Trap active />);
    expect(document.activeElement?.textContent).toBe("first");
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("re-moves focus to the first element when focusKey changes", () => {
    const { rerender } = render(<Trap active focusKey={0} />);
    const [, second] = document.querySelectorAll("button");
    second!.focus();
    rerender(<Trap active focusKey={1} />);
    expect(document.activeElement?.textContent).toBe("first");
  });
});
