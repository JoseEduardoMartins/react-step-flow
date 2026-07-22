import { cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode, Ref } from "react";
import { useTutorialTarget } from "../hooks/useTutorialTarget";
import { mergeRefs } from "../utils/mergeRefs";

/** Props for {@link TutorialTarget}. */
export interface TutorialTargetProps {
  /** The id this element is registered under; referenced by a step's `target`. */
  id: string;
  children: ReactNode;
  /**
   * When true (default) the child element is cloned and the registration ref is
   * merged onto it, adding no wrapper DOM. Set false to wrap in a
   * `display:contents` span instead (useful for text/fragment children).
   */
  asChild?: boolean;
}

type ChildWithRef = ReactElement<{ ref?: Ref<HTMLElement> }> & {
  ref?: Ref<HTMLElement>;
};

/**
 * Declaratively register a DOM element as a tutorial target. The element is
 * registered on mount and unregistered on unmount.
 */
export function TutorialTarget({
  id,
  children,
  asChild = true,
}: TutorialTargetProps): ReactElement {
  const setRef = useTutorialTarget<HTMLElement>(id);

  if (asChild && isValidElement(children)) {
    const child = children as ChildWithRef;
    // React 19 exposes ref via props; older elements via `.ref`. Merge either.
    const existingRef = child.props.ref ?? child.ref;
    return cloneElement(child, { ref: mergeRefs(setRef, existingRef) });
  }

  return (
    <span ref={setRef} style={{ display: "contents" }}>
      {children}
    </span>
  );
}
