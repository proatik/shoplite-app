export const NAVIGATE_EVENT = 'shoplite:navigate';

// pushState fires no event, so subscribers are told through NAVIGATE_EVENT.
export function navigate(to: string) {
  const current = `${window.location.pathname}${window.location.search}`;

  if (to === current) {
    return;
  }

  window.history.pushState(null, '', to);
  window.scrollTo(0, 0);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}
