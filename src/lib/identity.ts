// Anonymous identity: display name + device UUID.
// Both live in localStorage; survive browser restarts but not across devices.

const DEVICE_ID_KEY = "taxi_device_id_v1";
const DISPLAY_NAME_KEY = "taxi_display_name_v1";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export function getDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DISPLAY_NAME_KEY);
}

export function setDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISPLAY_NAME_KEY, name);
}

export function clearDisplayName(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DISPLAY_NAME_KEY);
}
