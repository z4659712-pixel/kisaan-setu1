"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CheckCircle2, ChevronDown,
  CircleHelp, CloudSun, Filter, Leaf, MapPin, Menu, Search, ShieldCheck,
  Sprout, TrendingUp, Truck, Users, Wallet, Wheat, X
} from "lucide-react";

type Market = {
  name: string;
  district: string;
  crop: string;
  price: number;
  change: number;
  arrival: string;
  distance: string;
  grade: string;
};

const markets: Market[] = [
  { name: "Siliguri Regulated Market", district: "Darjeeling", crop: "Potato", price: 1450, change: 4.2, arrival: "Medium", distance: "18 km", grade: "FAQ" },
  { name: "Jalpaiguri Market Yard", district: "Jalpaiguri", crop: "Potato", price: 1520, change: 6.1, arrival: "Low", distance: "26 km", grade: "FAQ" },
  { name: "Kolkata wholesale market", district: "Kolkata", crop: "Potato", price: 1780, change: 2.8, arrival: "High", distance: "560 km", grade: "Grade A" },
  { name: "Medinipur Market Yard", district: "Paschim Medinipur", crop: "Tomato", price: 2200, change: -1.4, arrival: "Medium", distance: "470 km", grade: "Grade A" },
  { name: "Siliguri Regulated Market", district: "Darjeeling", crop: "Tomato", price: 2450, change: 3.5, arrival: "Low", distance: "18 km", grade: "FAQ" },
  { name: "Jalpaiguri Market Yard", district: "Jalpaiguri", crop: "Rice", price: 2350, change: 1.2, arrival: "Medium", distance: "26 km", grade: "FAQ" },
  { name: "Medinipur Market Yard", district: "Paschim Medinipur", crop: "Rice", price: 2420, change: 2.1, arrival: "Low", distance: "470 km", grade: "Grade A" },
];

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function Home() {
  const [crop, setCrop] = useState("Potato");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [role, setRole] = useState("Farmer");
  const [notice, setNotice] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const visibleMarkets = useMemo(() => markets.filter((market) =>
    market.crop.toLowerCase() === crop.toLowerCase() &&
    `${market.name} ${market.district} ${market.crop}`.toLowerCase().includes(query.toLowerCase())
  ), [crop, query]);

  function action(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  const navItems = ["Overview", "Market prices", "Buyer offers", "My produce"];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Kisaan Setu home">
          <span className="brand-mark"><Sprout size={25} strokeWidth={2.3} /></span>
          <span><strong>Kisaan Setu</strong><small>SMART FARM. FAIR PRICE.</small></span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item, i) => (
            <button key={item} className={`nav-item ${activeTab === item ? "active" : ""}`} onClick={() => setActiveTab(item)}>
              {i === 0 ? <TrendingUp size={18} /> : i === 1 ? <Wheat size={18} /> : i === 2 ? <Users size={18} /> : <Leaf size={18} />}
              <span>{item}</span>{item === "Buyer offers" && <span className="nav-count">3</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon"><CircleHelp size={19}/></div>
            <strong>Need a hand?</strong>
            <p>Get help using Kisaan Setu in your language.</p>
            <button onClick={() => setShowHelp(true)}>Get support <ArrowRight size={14}/></button>
          </div>
          <div className="profile">
            <div className="avatar">KS</div>
            <div><strong>Demo account</strong><small>{role} workspace</small></div>
            <ChevronDown size={16} className="profile-chevron"/>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => action("Navigation: choose a section from the sidebar on desktop.")} aria-label="Menu"><Menu size={21}/></button>
          <div className="breadcrumb">Workspace <span>/</span> <b>{activeTab}</b></div>
          <div className="top-actions">
            <span className="location-chip"><MapPin size={15}/> West Bengal <ChevronDown size={14}/></span>
            <button className="icon-button" aria-label="Notifications" onClick={() => action("You're all caught up on notifications.")}><Bell size={18}/><i/></button>
            <div className="top-avatar">KS</div>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow"><span className="live-dot"/> FARMER MARKET INTELLIGENCE</div>
              <h1>Good morning, <em>Farmer.</em> <span className="wave">✳</span></h1>
              <p className="subtitle">Make your next selling decision with better market information.</p>
            </div>
            <label className="role-switch">View as <select value={role} onChange={(e) => setRole(e.target.value)}><option>Farmer</option><option>FPO Manager</option><option>Buyer</option></select></label>
          </div>

          <div className="demo-notice"><span><CircleHelp size={16}/></span><p><strong>Prototype preview</strong> — market figures below are sample data for demonstration, not live mandi prices.</p><button onClick={() => setShowHelp(true)}>Learn more <ArrowRight size={14}/></button></div>

          <div className="stat-grid">
            <article className="stat-card">
              <div className="stat-top"><span>Selected crop</span><span className="stat-icon green"><Wheat size={18}/></span></div>
              <div className="crop-select-wrap"><select aria-label="Choose crop" value={crop} onChange={(e) => setCrop(e.target.value)}><option>Potato</option><option>Tomato</option><option>Rice</option></select><ChevronDown size={15}/></div>
              <div className="stat-foot">Explore market rates by crop</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Best listed price</span><span className="stat-icon mint"><TrendingUp size={18}/></span></div>
              <div className="stat-number">{visibleMarkets.length ? money(Math.max(...visibleMarkets.map(m => m.price))) : "—"}<small>/ quintal</small></div>
              <div className="stat-foot"><span className="positive"><ArrowUpRight size={14}/> Sample listing</span> · Compare before selling</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Buyer verification</span><span className="stat-icon yellow"><ShieldCheck size={18}/></span></div>
              <div className="stat-number">Safety first</div>
              <div className="stat-foot">Review buyer details before a deal</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Sale planning</span><span className="stat-icon blue"><CloudSun size={18}/></span></div>
              <div className="stat-number">Plan ahead</div>
              <div className="stat-foot">Consider weather, transport and quality</div>
            </article>
          </div>

          <div className="section-heading">
            <div><h2>Market price discovery</h2><p>Compare sample prices across markets before choosing where to sell.</p></div>
            <button className="outline-button" onClick={() => action("Price data is sample-only. Connect an approved mandi data source to show live prices.")}><Filter size={15}/> Data source <ChevronDown size={14}/></button>
          </div>

          <section className="market-panel">
            <div className="panel-toolbar">
              <div className="market-tabs"><span className="tab-active">Nearby & regional</span><span className="tab-muted">All markets</span></div>
              <label className="searchbox"><Search size={16}/><input placeholder="Search market or district" value={query} onChange={(e) => setQuery(e.target.value)}/><kbd>⌕</kbd></label>
            </div>
            <div className="table-scroll"><table>
              <thead><tr><th>MARKET / DISTRICT</th><th>COMMODITY</th><th>PRICE / QUINTAL</th><th>CHANGE</th><th>ARRIVALS</th><th>GRADE</th><th></th></tr></thead>
              <tbody>
                {visibleMarkets.map((m, i) => <tr key={`${m.name}-${m.crop}-${i}`}>
                  <td><div className="market-name">{m.name}</div><div className="muted">{m.district} · {m.distance}</div></td>
                  <td><span className="crop-pill">{m.crop}</span></td>
                  <td className="price">{money(m.price)}</td>
                  <td><span className={m.change >= 0 ? "change-up" : "change-down"}>{m.change >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {Math.abs(m.change).toFixed(1)}%</span></td>
                  <td><span className={`arrival ${m.arrival.toLowerCase()}`}><i/>{m.arrival}</span></td>
                  <td><span className="grade">{m.grade}</span></td>
                  <td><button className="row-action" onClick={() => action(`${m.name}: sample price ${money(m.price)} per quintal. Verify current rates before making a sale.`)}>Details <ArrowRight size={14}/></button></td>
                </tr>)}
                {!visibleMarkets.length && <tr><td colSpan={7} className="empty-state">No sample listings match this search. Try another crop or district.</td></tr>}
              </tbody>
            </table></div>
            <div className="panel-footer"><span>Showing {visibleMarkets.length} sample listings</span><span>Prices shown in INR / quintal <span className="footer-dot">•</span> Demo only</span></div>
          </section>

          <div className="lower-grid">
            <section className="insight-card">
              <div className="card-heading"><div><span className="mini-icon"><TrendingUp size={17}/></span><h3>Before you sell</h3></div><span className="tag">QUICK CHECKLIST</span></div>
              <div className="check-row"><span className="check-icon"><CheckCircle2 size={17}/></span><div><strong>Compare at least 2–3 offers</strong><p>Check the net amount after transport and handling.</p></div></div>
              <div className="check-row"><span className="check-icon"><CheckCircle2 size={17}/></span><div><strong>Confirm quality requirements</strong><p>Ask about grade, moisture, packaging and deductions.</p></div></div>
              <div className="check-row"><span className="check-icon"><CheckCircle2 size={17}/></span><div><strong>Verify the buyer and payment terms</strong><p>Keep a written record of the agreed price and date.</p></div></div>
            </section>
            <section className="logistics-card">
              <div className="logistics-art"><div className="sun-shape"/><div className="hill hill-back"/><div className="hill hill-front"/><div className="road"/><div className="truck-icon"><Truck size={27}/></div></div>
              <div className="logistics-copy"><span className="tag green-tag">LOGISTICS PLANNING</span><h3>Plan the journey, not just the price.</h3><p>Estimate distance, pickup needs and storage before accepting an offer.</p><button onClick={() => action("Logistics planning is a preview. Route and transport APIs can be connected next.")}>Explore logistics <ArrowRight size={15}/></button></div>
            </section>
          </div>

          <footer className="footer"><span><Sprout size={15}/> Kisaan Setu <span className="footer-dot">•</span> Built for fairer farm markets</span><span>Prototype · Verify prices with official market sources</span></footer>
        </div>
      </section>

      {notice && <div className="toast"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}
      {showHelp && <div className="modal-backdrop" onClick={() => setShowHelp(false)}><section className="help-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowHelp(false)} aria-label="Close"><X size={19}/></button><div className="modal-mark"><Sprout size={26}/></div><h2>Welcome to Kisaan Setu</h2><p>This deployable prototype demonstrates market comparison and sale-planning workflows. Figures are sample data only; live prices, verified buyer accounts, authentication, and real transactions are not connected yet.</p><div className="help-point"><ShieldCheck size={18}/><span>Always verify buyer identity and payment terms before shipping produce.</span></div><div className="help-point"><Wallet size={18}/><span>Compare the final amount after transport, storage and quality deductions.</span></div><button className="primary-button" onClick={() => setShowHelp(false)}>Got it</button></section></div>}
    </main>
  );
}
