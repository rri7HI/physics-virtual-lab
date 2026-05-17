import React, { useEffect, useRef } from 'react';
import * as Matter from 'matter-js';
import { io } from 'socket.io-client';

const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Constraint = Matter.Constraint,
      Composites = Matter.Composites;

export default function PhysicsCanvas({ activeTool, onPhysicsTick, gravity }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const selectedBodyRef = useRef(null);
  const activeToolRef = useRef(activeTool);
  const pendingSpringStartRef = useRef(null);
  const socketRef = useRef(null);

  // Sync callback to a ref to prevent stale closure bugs in engine events
  const onTickRef = useRef(onPhysicsTick);
  useEffect(() => {
    onTickRef.current = onPhysicsTick;
  }, [onPhysicsTick]);

  useEffect(() => {
    activeToolRef.current = activeTool;
    if (engineRef.current && engineRef.current.mouseConstraint) {
        if (activeTool === 'drag') {
            engineRef.current.mouseConstraint.collisionFilter.mask = 0xFFFFFFFF;
        } else {
            engineRef.current.mouseConstraint.collisionFilter.mask = 0x00000000;
        }
    }
  }, [activeTool]);

  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.gravity.y = gravity;
    }
  }, [gravity]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Connect Socket.IO
    const socket = io('http://localhost:3002');
    socketRef.current = socket;
    socket.emit('join-room', 'global-sandbox');

    const engine = Engine.create();
    engineRef.current = engine;
    engine.gravity.y = gravity;

    try {
        const parent = canvasRef.current.parentElement;
        const width = parent?.clientWidth || 800;
        const height = parent?.clientHeight || 600;

        const render = Render.create({
          canvas: canvasRef.current,
          engine: engine,
          options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio || 1
          }
        });
        renderRef.current = render;

        // Walls
        const wallOptions = { isStatic: true, render: { fillStyle: 'rgba(255,255,255,0.05)' } };
        const ground = Matter.Bodies.rectangle(width / 2, height, width * 2, 60, wallOptions);
        const leftWall = Matter.Bodies.rectangle(0, height / 2, 60, height * 2, wallOptions);
        const rightWall = Matter.Bodies.rectangle(width, height / 2, 60, height * 2, wallOptions);
        Composite.add(engine.world, [ground, leftWall, rightWall]);

        // Mouse
        const mouse = Mouse.create(render.canvas);
        const dpr = window.devicePixelRatio || 1;
        Mouse.setScale(mouse, { x: 1 / dpr, y: 1 / dpr });
        
        const mouseConstraint = MouseConstraint.create(engine, {
          mouse: mouse,
          constraint: { stiffness: 0.2, render: { visible: false } }
        });
        engine.mouseConstraint = mouseConstraint;
        Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;

    const spawnToolBody = (toolInput, px, py, isRemote = false, actionData = null) => {
        let newBody = null;
        const x = px;
        const y = py;

        if (toolInput === 'box') {
            newBody = Bodies.rectangle(x, y, 60, 60, {
                render: { fillStyle: '#4f46e5' },
                restitution: 0.5,
                friction: 0.05
            });
        } else if (toolInput === 'circle') {
            newBody = Bodies.circle(x, y, 30, {
                render: { fillStyle: '#22d3ee' },
                restitution: 0.8,
                velocity: { x: Math.random() * 2 - 1, y: 0 }
            });
        } else if (toolInput === 'rope') {
            const systemId = 'rope_' + Date.now();
            const group = Matter.Body.nextGroup(true);
            const ropeComponents = Composites.stack(x, y, 8, 1, 10, 10, (rx, ry) => {
                const b = Bodies.rectangle(rx, ry, 40, 15, { collisionFilter: { group: group }, render: { fillStyle: '#f0f3f8' } });
                b.systemId = systemId;
                return b;
            });
            Composites.chain(ropeComponents, 0.5, 0, -0.5, 0, { stiffness: 0.8, length: 2, render: { visible: false } });
            ropeComponents.constraints.forEach(c => c.systemId = systemId);
            const pin = Constraint.create({ 
                bodyB: ropeComponents.bodies[0],
                pointB: { x: -20, y: 0 },
                pointA: { x: ropeComponents.bodies[0].position.x, y: ropeComponents.bodies[0].position.y },
                stiffness: 0.5,
                render: { strokeStyle: '#10b981', lineWidth: 4 }
            });
            pin.systemId = systemId;
            Composite.add(ropeComponents, pin);
            Composite.add(engine.world, ropeComponents);
            if (!isRemote) socket.emit('discrete-action', { roomId: 'global-sandbox', action: { type: 'rope', x: px, y: py } });
        } else if (toolInput === 'pulley') {
            const systemId = 'pulley_' + Date.now();
            const group = Matter.Body.nextGroup(true);
            const wheel = Bodies.circle(x, y, 40, { isStatic: true, friction: 0.001, render: { fillStyle: '#ef4444' } });
            wheel.systemId = systemId;
            const ropeLength = 18;
            const rope = Composites.stack(x - 160, y - 60, ropeLength, 1, 2, 2, (rx, ry) => {
                const b = Bodies.circle(rx, ry, 8, { collisionFilter: { group: group }, friction: 0.1, density: 0.01, render: { fillStyle: '#9ba1b0' } });
                b.systemId = systemId;
                return b;
            });
            Composites.chain(rope, 0.5, 0, -0.5, 0, { stiffness: 1, length: 2, render: { visible: false } });
            const weightLeft = Matter.Bodies.rectangle(x - 160, y + 50, 50, 50, { mass: 4, render: { fillStyle: '#22d3ee' } });
            weightLeft.systemId = systemId;
            const weightRight = Matter.Bodies.rectangle(x - 160 + (ropeLength*18), y + 50, 60, 60, { mass: 6, render: { fillStyle: '#4f46e5' } });
            weightRight.systemId = systemId;
            const linkLeft = Constraint.create({ bodyA: rope.bodies[0], bodyB: weightLeft, stiffness: 0.9, render: { visible: false } });
            linkLeft.systemId = systemId;
            const linkRight = Constraint.create({ bodyA: rope.bodies[ropeLength - 1], bodyB: weightRight, stiffness: 0.9, render: { visible: false } });
            linkRight.systemId = systemId;
            Composite.add(engine.world, [wheel, rope, weightLeft, weightRight, linkLeft, linkRight]);
            if (!isRemote) socket.emit('discrete-action', { roomId: 'global-sandbox', action: { type: 'pulley', x: px, y: py } });
        } else if (toolInput === 'motor') {
            const motorBox = Matter.Bodies.rectangle(x, y, 150, 20, { render: { fillStyle: '#ef4444' } });
            const motorConstraint = Constraint.create({ pointA: { x, y }, bodyB: motorBox, length: 0, render: { strokeStyle: '#fff' } });
            Matter.Events.on(engine, 'beforeUpdate', () => {
                Matter.Body.setAngularVelocity(motorBox, Math.PI / 30);
            });
            Composite.add(engine.world, [motorBox, motorConstraint]);
            if (!isRemote) socket.emit('discrete-action', { roomId: 'global-sandbox', action: { type: 'motor', x: px, y: py } });
        } else if (toolInput === 'eraser') {
            const allBodies = Composite.allBodies(engine.world);
            const body = Matter.Query.point(allBodies, { x, y })[0];
            if (body && !body.isStatic) {
                if (body.systemId) {
                    const toRemove = allBodies.filter(b => b.systemId === body.systemId);
                    toRemove.forEach(b => Composite.remove(engine.world, b));
                } else {
                    Composite.remove(engine.world, body);
                }
                if (!isRemote) socket.emit('discrete-action', { roomId: 'global-sandbox', action: { type: 'eraser', x: px, y: py } });
            }
        } else if (toolInput === 'spring') {
            const { start, end } = actionData;
            const bodyStart = Matter.Query.point(Composite.allBodies(engine.world), start)[0];
            const bodyEnd = Matter.Query.point(Composite.allBodies(engine.world), end)[0];
            if (bodyStart && bodyEnd && bodyStart !== bodyEnd) {
                const s = Constraint.create({ bodyA: bodyStart, bodyB: bodyEnd, stiffness: 0.02, render: { strokeStyle: '#9ba1b0', lineWidth: 2 } });
                Composite.add(engine.world, s);
            } else if (bodyStart || bodyEnd) {
                const bTask = bodyStart || bodyEnd;
                const aTask = bodyStart ? end : start;
                const s = Constraint.create({ pointA: aTask, bodyB: bTask, stiffness: 0.02, render: { strokeStyle: '#9ba1b0', lineWidth: 2 } });
                Composite.add(engine.world, s);
            }
        }

        if (newBody) {
            Composite.add(engine.world, newBody);
            selectedBodyRef.current = newBody;
            if (!isRemote) socket.emit('discrete-action', { roomId: 'global-sandbox', action: { type: toolInput, x: px, y: py } });
        }
    };

    const handleMouseDown = (e) => {
      const tool = activeToolRef.current;
      const x = e.offsetX;
      const y = e.offsetY;
      const pos = { x, y };

      if (tool === 'drag') {
          const allBodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
          const bounds = { 
            min: { x: x - 15, y: y - 15 }, 
            max: { x: x + 15, y: y + 15 } 
          };
          const body = Matter.Query.region(allBodies, bounds)[0];
          if (body) selectedBodyRef.current = body;
      } else if (tool === 'spring') {
          pendingSpringStartRef.current = pos;
      } else if (tool !== 'select') {
          spawnToolBody(tool, x, y);
      }
    };

    const handleMouseUp = (e) => {
        const tool = activeToolRef.current;
        if (tool === 'spring' && pendingSpringStartRef.current) {
            const start = pendingSpringStartRef.current;
            const end = { x: e.offsetX, y: e.offsetY };
            spawnToolBody('spring', end.x, end.y, false, { start, end });
            socket.emit('discrete-action', { roomId: 'global-sandbox', action: { type: 'spring', start, end } });
            pendingSpringStartRef.current = null;
        }
    };

    render.canvas.addEventListener('mousedown', handleMouseDown);
    render.canvas.addEventListener('mouseup', handleMouseUp);

    socket.on('discrete-sync', (action) => {
      spawnToolBody(action.type, action.x, action.y, true, action);
    });

    Matter.Events.on(engine, 'afterUpdate', () => {
        if (onTickRef.current) {
            const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
            const constraints = engine.world.constraints;
            
            let stats = { bodies: bodies.length, constraints: constraints.length };
            
            if (selectedBodyRef.current) {
                const b = selectedBodyRef.current;
                const v = b.speed || 0;
                const m = b.mass === Infinity ? 0 : b.mass;
                const e = 0.5 * m * (v * v);
                stats.velocity = Number(v.toFixed(2));
                stats.energy = Number(e.toFixed(2));
                stats.target = `Body #${b.id}`;
            } else {
                stats.velocity = 0;
                stats.energy = 0;
                stats.target = 'None';
            }
            onTickRef.current(stats);
        }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const handleResize = () => {
        const p = canvasRef.current?.parentElement;
        if (p && render.canvas) {
            render.canvas.width = p.clientWidth * (window.devicePixelRatio || 1);
            render.canvas.height = p.clientHeight * (window.devicePixelRatio || 1);
            render.options.width = p.clientWidth;
            render.options.height = p.clientHeight;
        }
    };
    
    // Defer initial sizing to ensure flexbox has settled
    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);

    } catch (err) {
        console.error("Physics Engine Crash:", err);
    }

    const clearWorld = () => {
        const staticBodies = engine.world.bodies.filter(b => b.isStatic);
        Composite.clear(engine.world);
        Composite.add(engine.world, staticBodies);
        selectedBodyRef.current = null;
    };
    window.addEventListener('clearWorld', clearWorld);

    return () => {
      socket.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('clearWorld', clearWorld);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, []);

  return (
    <div className="canvas-container w-full h-full relative" id="canvas-container">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
