import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SlipBar } from '../../ui/sport/index.jsx';
import { BetSlipProvider, useBetSlip } from '../../hooks/BetSlipProvider.jsx';
import { EventsView } from './EventsView.jsx';
import { MatchView } from './MatchView.jsx';
import { BetSlip } from './BetSlip.jsx';
import s from './sport.module.css';

const SPORT_KEY = 'wynveo-sport-filter';
const readSport = () => { try { return localStorage.getItem(SPORT_KEY) ?? 'all'; } catch { return 'all'; } };

function Layout() {
  const [sport, setSport] = useState(readSport);
  const [sheet, setSheet] = useState(false);
  const slip = useBetSlip();
  const chooseSport = (v) => { setSport(v); try { localStorage.setItem(SPORT_KEY, v); } catch { /* ignoré */ } };
  const showSheet = sheet || Boolean(slip.receipt);

  return (
    <div className={s.page}>
      <div className={s.content}>
        <Routes>
          <Route index element={<EventsView sport={sport} onSport={chooseSport} />} />
          <Route path="match/:id" element={<MatchView />} />
        </Routes>
      </div>
      {/* Ordinateur : coupon toujours visible à droite */}
      <aside className={s.aside} aria-label="Coupon">
        <BetSlip />
      </aside>
      {/* Mobile : barre en bas qui ouvre le coupon */}
      <div className={s.mobileOnly}>
        {!showSheet && <SlipBar count={slip.summary.count} odds={slip.type === 'combo' ? slip.summary.odds : null} onOpen={() => setSheet(true)} />}
        {showSheet && (
          <div className={s.sheetBackdrop} onClick={(e) => e.target === e.currentTarget && setSheet(false)} role="presentation">
            <div className={s.sheet} role="dialog" aria-modal="true" aria-label="Coupon">
              <BetSlip onClose={() => { setSheet(false); if (slip.receipt) slip.dismissReceipt(); }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Application Sport : matchs, détail d'un match et coupon. */
export function SportPage() {
  return <BetSlipProvider><Layout /></BetSlipProvider>;
}
