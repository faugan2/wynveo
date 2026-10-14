import { Brand } from '../ui/index.js';

export function SplashScreen() {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: '60vh' }} aria-busy="true">
      <Brand size={34} />
    </div>
  );
}
