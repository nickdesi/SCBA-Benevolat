import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UserAuthModal from './UserAuthModal';

vi.mock('react-dom', () => ({
  createPortal: (children: React.ReactNode) => children,
}));

vi.mock('../hooks/useScrollLock', () => ({
  default: () => {},
}));

vi.mock('../utils/authStore', () => ({
  resetUserPassword: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UserAuthModal', () => {
  it('only presents authentication options', () => {
    vi.stubGlobal('document', { body: {} });

    const markup = renderToStaticMarkup(
      <UserAuthModal isOpen onClose={() => {}} onGoogleLogin={() => {}} onToast={() => {}} />,
    );

    expect(markup).toContain('Continuer avec Google');
    expect(markup).toContain('Se connecter');
    expect(markup).toContain('Créer un compte');
    expect(markup).not.toContain('invité');
  });
});
