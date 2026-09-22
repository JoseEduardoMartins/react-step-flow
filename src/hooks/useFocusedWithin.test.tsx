import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { useRef, useState } from "react";
import { useFocusedWithin } from "./useFocusedWithin";

/**
 * Renders a host with focusable children plus an outside button, and exposes the
 * element currently reported by {@link useFocusedWithin} as text so tests can
 * assert what the spotlight would follow.
 */
function Harness({
  active = true,
  withHost = true,
}: {
  active?: boolean;
  withHost?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  // Publish the host element to state once mounted so the hook receives it.
  const focused = useFocusedWithin(withHost ? host : null, active);
  return (
    <div>
      <button>outside</button>
      <div ref={(el) => setHost(el ?? hostRef.current)}>
        <button>field-1</button>
        <button>field-2</button>
      </div>
      <span data-testid="focused">{focused?.textContent ?? "none"}</span>
    </div>
  );
}

const focus = (text: string) =>
  act(() =>
    (
      [...document.querySelectorAll("button")].find(
        (b) => b.textContent === text
      ) as HTMLElement
    ).focus()
  );

describe("useFocusedWithin", () => {
  it("reports the focused descendant of the host", () => {
    const { getByTestId } = render(<Harness />);
    focus("field-1");
    expect(getByTestId("focused").textContent).toBe("field-1");
    focus("field-2");
    expect(getByTestId("focused").textContent).toBe("field-2");
  });

  it("reports none when focus is outside the host", () => {
    const { getByTestId } = render(<Harness />);
    focus("field-1");
    expect(getByTestId("focused").textContent).toBe("field-1");
    focus("outside");
    expect(getByTestId("focused").textContent).toBe("none");
  });

  it("reports none when inactive", () => {
    const { getByTestId } = render(<Harness active={false} />);
    focus("field-1");
    expect(getByTestId("focused").textContent).toBe("none");
  });

  it("reports none when there is no host", () => {
    const { getByTestId } = render(<Harness withHost={false} />);
    focus("field-1");
    expect(getByTestId("focused").textContent).toBe("none");
  });
});
