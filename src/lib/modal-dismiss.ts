// Radix modals (Dialog / Sheet) auto-close on any "interact outside" event. But
// Sonner renders its toasts in a portal at the document body — outside the modal
// — so clicking a toast action (e.g. the "Undo" on a generated description) is
// seen as an outside interaction and closes the modal, discarding the edit.
//
// Pass this to a Radix content's `onInteractOutside`: it preventDefaults the
// close only when the interaction originated inside the Sonner toaster, so toast
// actions work while a Dialog/Sheet is open. Real backdrop clicks still close.

interface InteractOutsideEvent {
  detail?: { originalEvent?: Event };
  preventDefault: () => void;
}

export function keepModalOpenOnToastInteract(event: InteractOutsideEvent): void {
  const target = event.detail?.originalEvent?.target;
  if (target instanceof Element && target.closest("[data-sonner-toaster]")) {
    event.preventDefault();
  }
}
