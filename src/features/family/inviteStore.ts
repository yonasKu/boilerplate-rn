// Simple transient storage for invite codes across the auth flow
let _pendingInviteCode: string | null = null;

export function setInviteCode(code: string) {
  _pendingInviteCode = code;
}

export function getInviteCode(): string | null {
  return _pendingInviteCode;
}

export function consumeInviteCode(): string | null {
  const code = _pendingInviteCode;
  _pendingInviteCode = null;
  return code;
}
