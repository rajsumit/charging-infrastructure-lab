// Pure formula library. Used by the calculators on the site and by tests/verify.js
const PI = Math.PI;
const C = {
  // ---- Week 1/2 rectifiers
  halfWaveAvg: (Vpk) => Vpk / PI,
  fullWaveAvg: (Vpk) => 2 * Vpk / PI,
  // full-bridge + capacitor: ripple spec as fraction of Vpk, power P, line f (Hz)
  capFilter(Vrms, f, P, ripFrac) {
    const Vpk = Vrms * Math.SQRT2, dV = ripFrac * Vpk, Vmin = Vpk - dV;
    const Iavg = P / ((Vpk + Vmin) / 2);
    const ang = PI + Math.asin(Vmin / Vpk) - PI / 2;                // rad from peak to restart of conduction
    const tdis = ang / (2 * PI * f), tc = 1 / (2 * f) - tdis;
    return { Vpk, dV, Vmin, Iavg, tdis, tc, Cmin: Iavg * tdis / dV };
  },
  // ---- boost PFC
  boostD: (vs, Vo) => 1 - Math.abs(vs) / Vo,
  boostIpk: (P, Vrms) => Math.SQRT2 * P / Vrms,
  boostL: (Vo, dI, fsw) => Vo / (4 * dI * fsw),
  boostRipplePk: (vs, Vo, L, fsw) => { const d = 1 - Math.abs(vs) / Vo; return Math.abs(vs) * d / (L * fsw); },
  dblLineRipple: (P, fline, Vo, Cap) => P / (2 * PI * fline * Vo * Cap),   // peak-to-peak
  // ---- switch RMS currents
  rmsBuckSwitch: (Io, D) => Io * Math.sqrt(D),
  // ---- 3-phase VSC
  vscL(Vll, Vdc, m, P) {
    const Vs = Vll * Math.SQRT2 / Math.sqrt(3), Vc = m * Vdc / 2;
    const Ipk = 2 * P / (3 * Vs);
    return { Vs, Vc, Ipk, L: Math.sqrt(Vc * Vc - Vs * Vs) / (2 * PI * 50 * Ipk) };
  },
  spwmFundRms: (m, Vdc) => m * Vdc / (2 * Math.SQRT2),
  flybackPFC_Vo: (Vpk, d, n) => (Vpk / n) * d / (1 - d),
  pfFromDQ_dAligned: (id, iq) => id / Math.hypot(id, iq),
  // ---- isolated DC-DC
  forwardVo: (Vin, n, D) => n * Vin * D,
  forwardDmaxDemag: (Np, Nd) => 1 / (1 + Nd / Np),
  fullBridgeL: (Vo, D, dI, fsw) => Vo * (1 - D) / (2 * fsw * dI),
  swLossTri: (V, I, t) => V * I * t / 6,
  // ---- PSFB
  psfbLeadDead: (Cs, Vin, n, Io) => 2 * Cs * Vin / (n * Io),
  psfbDutyLoss: (Llk, Io, fs, n, Vin) => 4 * Llk * Io * fs / (n * Vin),
  psfbExtraL: (fr, Cs, Llk) => 1 / Math.pow(2 * 3.14 * fr, 2) / Cs - Llk,
  // ---- DAB
  dabP: (Vin, Vo, n, deltaRad, fs, L) => Vin * (Vo / n) * deltaRad * (PI - deltaRad) / (2 * PI * PI * fs * L),
  dabPmax: (Vin, Vo, n, fs, L) => Vin * (Vo / n) / (8 * fs * L),
  dabDeltaForFrac(frac) { // P = frac*Pmax, delta in degrees (<90)
    const s = (1 - Math.sqrt(1 - frac)) / 2; return s * 180;
  },
  optDeltaB: (a, b) => Math.pow(a / b, 0.25),
  // ---- AC Type-2
  cpDutyToAmp(d) { return d < 85 ? d * 0.6 : (d - 64) * 2.5; },
  ampToDuty(A) { return A <= 51 ? A / 0.6 : A / 2.5 + 64; },
  ppV: (R6, R4 = 330, R5 = 4700) => 5 * (R5 * R6 / (R5 + R6)) / ((R5 * R6 / (R5 + R6)) + R4),
  cpV: (Rvehicle) => 12 * Rvehicle / (1000 + Rvehicle),
  par: (a, b) => a * b / (a + b),
};
if (typeof module !== 'undefined') module.exports = C;
