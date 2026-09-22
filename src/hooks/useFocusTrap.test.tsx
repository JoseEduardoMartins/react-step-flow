import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useRef, useState } from "react";
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

function TrapWithOutside({ containFocus }: { containFocus?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, { active: true, containFocus });
  return (
    <div>
      <div ref={ref}>
        <button>first</button>
        <button>second</button>
      </div>
      <button>outside</button>
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

  it("lets focus leave the container when containFocus is false", async () => {
    const user = userEvent.setup();
    render(<TrapWithOutside containFocus={false} />);
    const second = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "second"
    )!;
    second.focus();
    await user.tab();
    expect(document.activeElement?.textContent).toBe("outside");
  });

  it("still contains focus by default (containFocus omitted)", async () => {
    const user = userEvent.setup();
    render(<TrapWithOutside />);
    const second = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "second"
    )!;
    second.focus();
    await user.tab();
    expect(document.activeElement?.textContent).toBe("first");
  });
});

/**
 * Interactive step: the tooltip and the highlighted element (e.g. a non-modal
 * drawer) sit in separate DOM subtrees, with unrelated page content before and
 * after both. `extraContainer` joins the highlighted element into the trap so
 * Tab cycles across tooltip + panel in document order and never reaches the
 * page behind.
 */
function TrapWithExtra() {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const extraRef = useRef<HTMLDivElement>(null);
  const [extra, setExtra] = useState<HTMLElement | null>(null);
  useEffect(() => setExtra(extraRef.current), []);
  useFocusTrap(tooltipRef, { active: true, extraContainer: extra });
  return (
    <div>
      <button>before</button>
      <div ref={tooltipRef}>
        <button>tip-1</button>
        <button>tip-2</button>
      </div>
      <div ref={extraRef}>
        <button>panel-1</button>
        <button>panel-2</button>
      </div>
      <button>after</button>
    </div>
  );
}

const focusByText = (text: string) =>
  [...document.querySelectorAll("button")].find((b) => b.textContent === text)!.focus();

describe("useFocusTrap with an extra (interactive) container", () => {
  it("extends the trap from the tooltip into the highlighted element", async () => {
    const user = userEvent.setup();
    render(<TrapWithExtra />);
    focusByText("tip-2"); // last tooltip focusable
    await user.tab();
    expect(document.activeElement?.textContent).toBe("panel-1");
  });

  it("wraps from the last panel focusable back to the first tooltip focusable", async () => {
    const user = userEvent.setup();
    render(<TrapWithExtra />);
    focusByText("panel-2"); // last focusable of the whole trapped set
    await user.tab();
    expect(document.activeElement?.textContent).toBe("tip-1");
  });

  it("wraps backward from the first tooltip focusable to the last panel focusable", async () => {
    const user = userEvent.setup();
    render(<TrapWithExtra />);
    focusByText("tip-1");
    await user.tab({ shift: true });
    expect(document.activeElement?.textContent).toBe("panel-2");
  });

  it("never lets focus reach page content outside the trapped set", async () => {
    const user = userEvent.setup();
    render(<TrapWithExtra />);
    focusByText("panel-2");
    await user.tab(); // forward past the end
    expect(document.activeElement?.textContent).not.toBe("after");
    focusByText("tip-1");
    await user.tab({ shift: true }); // backward past the start
    expect(document.activeElement?.textContent).not.toBe("before");
  });

  it("still moves initial focus to the tooltip, not the highlighted element", () => {
    render(<TrapWithExtra />);
    expect(document.activeElement?.textContent).toBe("tip-1");
  });
});
