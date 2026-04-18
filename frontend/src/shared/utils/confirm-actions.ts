export const confirmFormSave = (entityLabel: string, isEditMode: boolean): boolean => {
  return window.confirm(
    isEditMode
      ? `Confirmi salvarea modificărilor pentru ${entityLabel}?`
      : `Confirmi salvarea pentru ${entityLabel}?`,
  );
};

export const confirmMessageRetry = (): boolean => {
  return window.confirm("Confirmi retrimiterea mesajului?");
};

export const confirmFollowUpStatusChange = (): boolean => {
  return window.confirm("Confirmi schimbarea statusului pentru follow-up?");
};