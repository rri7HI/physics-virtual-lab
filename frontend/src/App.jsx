import React, { useState, useEffect, useRef } from 'react';
import { 
  FlaskConical, Library, Share2, MousePointer2, Square, Circle, Link as LinkIcon, 
  CircleDot, Activity, Settings, Eraser, Trash2, BarChart2, ChevronRight, X 
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import PhysicsCanvas from './PhysicsCanvas';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MemoizedPhysicsCanvas = React.memo(PhysicsCanvas);

function App() {
  const [labInitiated, setLabInitiated] = useState(false);
  const [activeTool, setActiveTool] = useState('drag');
  const [gravity, setGravity] = useState(1);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [stats, setStats] = useState({ bodies: 0, constraints: 0, velocity: 0, energy: 0, target: 'None' });
  
  // Real-time chart data buffers
  const velDataRef = useRef(new Array(50).fill(0));
  const enDataRef = useRef(new Array(50).fill(0));
  const labelsRef = useRef(new Array(50).fill(''));
  const lastStateUpdateRef = useRef(0);

  const onPhysicsTick = React.useCallback((newStats) => {
    // Throttle React state updates to reduce lag
    const now = Date.now();
    if (now - lastStateUpdateRef.current > 100) {
      setStats(newStats);
      lastStateUpdateRef.current = now;
    }
    
    // Update chart data refs (Always at full frequency for smooth charts)
    velDataRef.current.push(newStats.velocity);
    enDataRef.current.push(newStats.energy);
    if (velDataRef.current.length > 50) {
      velDataRef.current.shift();
      enDataRef.current.shift();
    }
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ba1b0', size: 10 } },
      x: { display: false }
    },
    plugins: { legend: { display: false } },
    elements: { line: { tension: 0.4 }, point: { radius: 0 } },
    animation: false
  };

  const enterLab = () => setLabInitiated(true);

  return (
    <div className="dark-mode h-screen flex flex-col font-sans overflow-hidden">
      {/* Landing Screen Overlay */}
      {!labInitiated && (
        <div id="landing-screen" className="landing-overlay">
          <div className="glow-orb orb-cyan"></div>
          <div className="glow-orb orb-magenta"></div>
          <div className="glow-orb orb-orange"></div>
          
          <div className="tech-deco deco-top-left">[SYS_STATUS: ONLINE]</div>
          <div className="tech-deco deco-top-right">MODEL // VIRTUAL-LAB V2.1</div>
          <div className="tech-deco deco-bottom-left">T=1.000 | F_GRAV=9.8M/S²</div>

          <div className="landing-content cinematic">
            <h1 className="landing-title">VIRTUAL-LAB<br/>ISN'T JUST A<br/><span className="highlight">SANDBOX.</span></h1>
            <p className="landing-subtitle">A digital twin environment built for high-fidelity mechanical systems testing and collaborative spatial simulation.</p>
            <div className="landing-actions">
              <button className="btn-pill" onClick={enterLab}>
                INITIATE WORKSPACE <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main App Container */}
      {labInitiated && (
        <>
          <header className="app-header glass">
            <div className="header-top">
              <div className="logo">
                <FlaskConical size={24} className="text-accent" />
                <h1 className="text-xl font-semibold tracking-wide">VIRTUAL-LAB</h1>
                <span className="badge">Digital Twin Env</span>
              </div>
              <div className="room-controls">
                <span className="status-indicator online"></span>
                <span className="room-id">Room: Alpha-7</span>
                <button className="btn btn-secondary" onClick={() => setIsGalleryOpen(true)}>
                  <Library size={18} /> Library
                </button>
                <button className="btn btn-primary">
                  <Share2 size={18} /> Share
                </button>
              </div>
            </div>
          </header>

          <main className="app-main flex-1 relative flex overflow-hidden">
            {/* Workspace Area */}
            <section id="tab-sandbox" className="tab-pane workspace active flex flex-row relative w-full h-full">
              {/* Floating Toolbar */}
              <aside className="toolbar glass-panel">
                <div className="tool-grid">
                  <button className={`tool-btn ${activeTool === 'drag' ? 'active' : ''}`} title="Drag & Select" onClick={() => setActiveTool('drag')}><MousePointer2 size={20} /></button>
                  <button className={`tool-btn ${activeTool === 'box' ? 'active' : ''}`} title="Add Box" onClick={() => setActiveTool('box')}><Square size={20} /></button>
                  <button className={`tool-btn ${activeTool === 'circle' ? 'active' : ''}`} title="Add Circle" onClick={() => setActiveTool('circle')}><Circle size={20} /></button>
                  <button className={`tool-btn ${activeTool === 'rope' ? 'active' : ''}`} title="Add Rope" onClick={() => setActiveTool('rope')}><LinkIcon size={20} /></button>
                  <button className={`tool-btn ${activeTool === 'pulley' ? 'active' : ''}`} title="Add Pulley" onClick={() => setActiveTool('pulley')}><CircleDot size={20} /></button>
                  <button className={`tool-btn ${activeTool === 'spring' ? 'active' : ''}`} title="Add Spring" onClick={() => setActiveTool('spring')}><Activity size={20} /></button>
                  <button className={`tool-btn ${activeTool === 'motor' ? 'active' : ''}`} title="Add Motor" onClick={() => setActiveTool('motor')}><Settings size={20} /></button>
                  <div className="divider" style={{ width: '20px', margin: 0 }}></div>
                  <button className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`} title="Erase Object" style={{ color: 'var(--danger)' }} onClick={() => setActiveTool('eraser')}><Eraser size={20} /></button>
                </div>
                
                <div className="divider"></div>
                
                <div className="env-controls">
                  <span>Gravity</span>
                  <input 
                    type="range" 
                    min="-2" max="2" step="0.1" 
                    value={gravity} 
                    onChange={(e) => setGravity(parseFloat(e.target.value))}
                  />
                  <button className="btn btn-danger w-full mt-2" onClick={() => window.dispatchEvent(new CustomEvent('clearWorld'))}>
                    <Trash2 size={16} /> <span className="hidden">Clear World</span>
                  </button>
                </div>
              </aside>

              {/* Physics Engine Component */}
              <MemoizedPhysicsCanvas activeTool={activeTool} gravity={gravity} onPhysicsTick={onPhysicsTick} />

              {/* Right Sidebar Analytics Dashboard */}
              <aside className="analytics-dashboard glass-panel">
                <h3 className="mb-4 text-lg">
                  <BarChart2 size={20} className="inline mr-2" /> Real-Time Analytics
                </h3>
                <div className="selected-target border-l-2 border-accent pl-3 mb-6">
                  <span className="text-xs text-muted block uppercase">Target</span>
                  <span id="target-name" className="text-accent font-medium">{stats.target}</span>
                </div>
                
                <div className="chart-wrapper h-32 mb-6">
                  <h4 className="text-xs text-muted uppercase mb-2">Velocity (m/s)</h4>
                  <Line 
                    data={{
                      labels: labelsRef.current,
                      datasets: [{ data: [...velDataRef.current], borderColor: '#22d3ee', borderWidth: 2, fill: false }]
                    }} 
                    options={chartOptions} 
                  />
                </div>

                <div className="chart-wrapper h-32 mb-6">
                  <h4 className="text-xs text-muted uppercase mb-2">Kinetic Energy (J)</h4>
                  <Line 
                    data={{
                      labels: labelsRef.current,
                      datasets: [{ data: [...enDataRef.current], borderColor: '#4f46e5', borderWidth: 2, fill: false }]
                    }} 
                    options={chartOptions} 
                  />
                </div>
                
                <div className="simulation-stats mt-auto space-y-2">
                  <div className="stat-row">
                    <span>Bodies:</span>
                    <span>{stats.bodies}</span>
                  </div>
                  <div className="stat-row">
                    <span>Constraints:</span>
                    <span>{stats.constraints}</span>
                  </div>
                </div>
              </aside>
            </section>
          </main>
        </>
      )}

      {/* Experiment Library Modal */}
      {isGalleryOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <header className="modal-header">
              <h2 className="text-xl font-bold">Experiment Library</h2>
              <button className="icon-btn" onClick={() => setIsGalleryOpen(false)}><X size={24} /></button>
            </header>
            <div className="gallery-grid h-96 overflow-y-auto">
              <div className="template-card">
                 <h4 className="text-accent font-medium">Double Pendulum</h4>
                 <p className="text-xs text-muted">Chaotic motion test</p>
              </div>
              <div className="template-card">
                 <h4 className="text-accent font-medium">Pulley System</h4>
                 <p className="text-xs text-muted">Statics and Tension</p>
              </div>
            </div>
            <div className="modal-footer border-t border-white/10 pt-4 text-right">
              <button className="btn btn-primary">Save Current Scene</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
