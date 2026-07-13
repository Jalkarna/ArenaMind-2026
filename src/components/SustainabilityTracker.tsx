import React, { useState } from 'react';
import { Leaf, Trophy, Gift, Check, QrCode } from 'lucide-react';
import { sustainabilityLeaderboard } from '../utils/mockData';

export const SustainabilityTracker: React.FC = () => {
  const [points, setPoints] = useState(150);
  const [carbonOffset, setCarbonOffset] = useState(3.5);
  const [scansCount, setScansCount] = useState(7);
  const [recentScan, setRecentScan] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  const handleScanBin = () => {
    setPoints(prev => prev + 50);
    setCarbonOffset(prev => parseFloat((prev + 0.5).toFixed(1)));
    setScansCount(prev => prev + 1);
    setRecentScan(true);

    setTimeout(() => {
      setRecentScan(false);
    }, 3000);
  };

  const handleClaimCoupon = () => {
    if (points < 100) return;

    setPoints(prev => prev - 100);

    const array = new Uint16Array(1);
    window.crypto.getRandomValues(array);
    const codeSuffix = array[0].toString(16).toUpperCase().padStart(4, '0');
    setCouponCode(`GREEN-FIFA-${codeSuffix}`);
  };

  return (
    <div className="card glass-card sustainability-card flex flex-col h-full">
      <div className="card-header border-b pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="text-emerald" size={20} />
          <h2 className="card-title text-lg font-bold">Green Stadium Fan Hub</h2>
        </div>
        <span className="badge-emerald text-xs px-2 py-0.5 rounded font-semibold">FIFA Green Goal</span>
      </div>

      {/* Scanned Notification */}
      {recentScan && (
        <div className="bg-emerald-950/60 border border-emerald-800 rounded p-2.5 mb-3 text-xs text-emerald-300 flex items-center gap-2 animate-pulse" id="scan-notification">
          <Check size={16} />
          <span>Eco-Deposit verified! +50 Points, +0.5 kg CO2 offset. Thank you!</span>
        </div>
      )}

      {/* Stats Board */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Eco Points</span>
          <span className="text-xl font-black text-emerald-400" id="eco-points">{points}</span>
        </div>
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">CO2 Saved</span>
          <span className="text-xl font-black text-emerald-400" id="eco-co2">{carbonOffset} kg</span>
        </div>
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Deposits</span>
          <span className="text-xl font-black text-slate-200" id="eco-scans">{scansCount}</span>
        </div>
      </div>

      {/* Interaction Buttons */}
      <div className="space-y-3 mb-4 flex-grow">
        <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg flex flex-col gap-2">
          <p className="text-xs text-slate-400 leading-relaxed">
            Scan QR code on smart bins when disposing of cups, bottles, or food trays.
          </p>
          <button
            onClick={handleScanBin}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 rounded transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950"
            id="btn-scan-bin"
          >
            <QrCode size={14} /> Scan Smart Bin QR Code
          </button>
        </div>

        {/* Claim Rewards */}
        <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <Gift size={13} className="text-amber-400" /> Claim Rewards
            </h3>
            <span className="text-[10px] text-slate-500">Cost: 100 pts</span>
          </div>

          {!couponCode ? (
            <button
              onClick={handleClaimCoupon}
              disabled={points < 100}
              className={`w-full text-xs py-2 rounded transition font-semibold ${
                points >= 100
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed'
              }`}
              id="btn-claim-coupon"
            >
              Claim 15% Merch Discount Code
            </button>
          ) : (
            <div className="p-2 bg-amber-950/30 border border-amber-900/40 rounded text-center" id="coupon-display">
              <span className="block text-[9px] uppercase font-bold text-amber-500">Your Discount Code:</span>
              <code className="text-sm font-mono font-bold text-amber-200">{couponCode}</code>
              <p className="text-[8px] text-slate-400 mt-1">Show this code at any official stadium kiosk.</p>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="border-t border-slate-800 pt-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Trophy size={12} className="text-amber-500" /> Stadium Eco Leaderboard
        </h3>
        <div className="space-y-1.5 max-h-[120px] overflow-y-auto scrollbar-thin">
          {sustainabilityLeaderboard.map((user) => (
            <div key={user.rank} className="flex items-center justify-between text-xs py-1 px-2 bg-slate-900/30 border border-slate-900 rounded">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-500 text-[10px]">#{user.rank}</span>
                <span className="text-slate-300 font-semibold">{user.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 font-bold">{user.points} pts</span>
                <span className="text-slate-500 text-[10px]">{user.carbonSavedKg} kg CO2</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
