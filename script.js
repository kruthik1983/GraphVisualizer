// Graph Visualizer Pro - Enhanced with modern features
const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');

// State management
let state = {
    nodes: [],
    edges: [],
    adj: new Map(),
    mode: null,
    startNode: null,
    goalNode: null,
    selectedEdgeStart: null,
    steps: [],
    stepIndex: 0,
    intervalId: null,
    speed: 700,
    currentAlgo: 'bfs',
    history: [],
    historyIndex: -1,
    zoom: 1,
    pan: { x: 0, y: 0 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
    theme: 'dark',
    selectedNodes: new Set(),
    searchResults: new Set(),
    hoverNode: null,
    hoverEdge: null,
    forceLayout: {
        enabled: false,
        repulsion: 100,
        attraction: 0.1,
        damping: 0.5
    }
};

// DOM Elements
const elements = {
    modeIndicator: document.getElementById('mode-indicator'),
    instructionBox: document.getElementById('instruction-box'),
    stepText: document.getElementById('step-text'),
    historyLog: document.getElementById('history-log'),
    dsBox: document.getElementById('ds-box'),
    visitedBox: document.getElementById('visited-box'),
    pathBox: document.getElementById('path-box'),
    nodesCount: document.getElementById('nodes-count'),
    edgesCount: document.getElementById('edges-count'),
    stepsCount: document.getElementById('steps-count'),
    graphDensity: document.getElementById('graph-density'),
    avgDegree: document.getElementById('avg-degree'),
    componentsCount: document.getElementById('components-count'),
    nodeInfo: document.getElementById('node-info'),
    algoDescription: document.getElementById('algo-description'),
    tutorialModal: document.getElementById('tutorial-modal'),
    shortcutsModal: document.getElementById('shortcuts-modal'),
    nodeSearch: document.getElementById('node-search'),
    searchResults: document.getElementById('search-results'),
    layoutSelect: document.getElementById('layout-select'),
    applyLayoutBtn: document.getElementById('apply-layout-btn'),
    showWeights: document.getElementById('show-weights'),
    showDegrees: document.getElementById('show-degrees'),
    multiSelectBtn: document.getElementById('multi-select-btn')
};

// Algorithm descriptions
const algoDescriptions = {
    bfs: "Breadth-First Search: Explores all neighbor nodes at the present depth before moving on to nodes at the next depth level.",
    dfs: "Depth-First Search: Explores as far as possible along each branch before backtracking.",
    dijkstra: "Dijkstra's Algorithm: Finds the shortest path between nodes in a graph with non-negative edge weights.",
    astar: "A* Search: Finds the shortest path using heuristics to guide the search toward the goal.",
    prim: "Prim's Algorithm: Finds a minimum spanning tree for a weighted undirected graph.",
    kruskal: "Kruskal's Algorithm: Finds a minimum spanning tree by sorting and adding the smallest edges that don't form cycles.",
    'bellman-ford': "Bellman-Ford Algorithm: Finds shortest paths from a source node even with negative weight edges (but no negative cycles).",
    'floyd-warshall': "Floyd-Warshall Algorithm: Finds shortest paths between all pairs of nodes in a weighted graph.",
    topological: "Topological Sort: Orders nodes in a directed acyclic graph (DAG) such that for every edge u→v, u comes before v.",
    'connected-components': "Connected Components: Finds all connected components in an undirected graph."
};

// Color scheme
const COLORS = {
    NODE: '#64748b',
    NODE_BORDER: '#0f172a',
    START: '#16a34a',
    GOAL: '#dc2626',
    VISITING: '#f59e0b',
    VISITED: '#0ea5e9',
    PATH: '#8b5cf6',
    EDGE: '#cbd5e1',
    ACTIVE_EDGE: '#f43f5e',
    TEXT: '#062a3c',
    WEIGHT_BG: 'rgba(255, 255, 255, 0.95)',
    HIGHLIGHT: '#f97316',
    SELECTED: '#ec4899',
    HOVER: '#fbbf24'
};

// Initialize the application
function init() {
    resizeCanvas();
    setupEventListeners();
    updateStats();
    setAlgorithmDescription();
    loadTheme();
    draw();
}

// Set up all event listeners
function setupEventListeners() {
    // Window events
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);

    // Canvas events
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Button events
    document.getElementById('add-node-btn').addEventListener('click', () => setMode('add-node'));
    document.getElementById('add-edge-btn').addEventListener('click', () => setMode('add-edge'));
    document.getElementById('delete-btn').addEventListener('click', () => setMode('delete'));
    document.getElementById('set-start-btn').addEventListener('click', () => setMode('set-start'));
    document.getElementById('set-goal-btn').addEventListener('click', () => setMode('set-goal'));
    document.getElementById('multi-select-btn').addEventListener('click', () => setMode('multi-select'));
    document.getElementById('clear-btn').addEventListener('click', clearCanvas);
    document.getElementById('reset-vis-btn').addEventListener('click', resetVisualization);
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);
    document.getElementById('export-btn').addEventListener('click', exportGraph);
    document.getElementById('import-file').addEventListener('change', importGraph);
    document.getElementById('generate-btn').addEventListener('click', generateRandomGraph);
    document.getElementById('theme-light').addEventListener('click', () => setTheme('light'));
    document.getElementById('theme-dark').addEventListener('click', () => setTheme('dark'));
    document.getElementById('tutorial-btn').addEventListener('click', showTutorial);
    document.getElementById('shortcuts-btn').addEventListener('click', showShortcuts);
    document.getElementById('zoom-in').addEventListener('click', () => adjustZoom(0.1));
    document.getElementById('zoom-out').addEventListener('click', () => adjustZoom(-0.1));
    document.getElementById('reset-view').addEventListener('click', resetView);
    document.getElementById('apply-layout-btn').addEventListener('click', applyLayout);
    elements.showWeights.addEventListener('change', draw);
    elements.showDegrees.addEventListener('change', draw);

    // Playback controls
    document.getElementById('next-btn').addEventListener('click', nextStep);
    document.getElementById('prev-btn').addEventListener('click', prevStep);
    document.getElementById('play-btn').addEventListener('click', play);
    document.getElementById('pause-btn').addEventListener('click', pause);
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        state.speed = 2100 - e.target.value;
        if (state.intervalId) {
            pause();
            play();
        }
    });

    // Algorithm selection
    document.getElementById('algorithm-select').addEventListener('change', (e) => {
        state.currentAlgo = e.target.value;
        setAlgorithmDescription();
    });

    // Search functionality
    elements.nodeSearch.addEventListener('input', handleSearch);
    elements.nodeSearch.addEventListener('focus', () => {
        elements.searchResults.classList.add('active');
    });
    elements.nodeSearch.addEventListener('blur', () => {
        setTimeout(() => {
            elements.searchResults.classList.remove('active');
        }, 200);
    });

    // Tutorial controls
    document.getElementById('tutorial-next').addEventListener('click', nextTutorialStep);
    document.getElementById('tutorial-prev').addEventListener('click', prevTutorialStep);
    document.getElementById('tutorial-finish').addEventListener('click', closeTutorial);
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.tutorialModal.classList.remove('active');
            elements.shortcutsModal.classList.remove('active');
        });
    });

    // Panel toggles
    document.getElementById('left-panel-toggle').addEventListener('click', () => {
        document.querySelector('.left-panel').classList.toggle('collapsed');
    });

    document.getElementById('right-panel-toggle').addEventListener('click', () => {
        document.querySelector('.right-panel').classList.toggle('collapsed');
    });
}

// Set algorithm description
function setAlgorithmDescription() {
    elements.algoDescription.textContent = algoDescriptions[state.currentAlgo] || "Select an algorithm to see description";
}

// Resize canvas to fit container
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    draw();
}

// Draw the graph
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(state.pan.x, state.pan.y);
    ctx.scale(state.zoom, state.zoom);

    // Draw edges
    state.edges.forEach(drawEdge);

    // Draw nodes
    state.nodes.forEach(drawNode);

    // Draw hover effects
    if (state.hoverNode) drawNodeHighlight(state.hoverNode);
    if (state.hoverEdge) drawEdgeHighlight(state.hoverEdge);

    ctx.restore();
}

// Draw a node
function drawNode(n) {
    const x = n.x;
    const y = n.y;
    const radius = 20;

    // Draw node
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    // Set node color based on state
    if (state.searchResults.has(n.id)) {
        ctx.fillStyle = COLORS.HIGHLIGHT;
    } else if (state.selectedNodes.has(n.id)) {
        ctx.fillStyle = COLORS.SELECTED;
    } else if (n === state.startNode) {
        ctx.fillStyle = COLORS.START;
    } else if (n === state.goalNode) {
        ctx.fillStyle = COLORS.GOAL;
    } else {
        ctx.fillStyle = n.color || COLORS.NODE;
    }

    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.NODE_BORDER;
    ctx.stroke();
    ctx.closePath();

    // Draw node label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.label || n.id, x, y);

    // Draw node degree if enabled
    if (elements.showDegrees.checked) {
        const degree = state.adj.get(n.id)?.length || 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(`deg:${degree}`, x, y + 25);
    }

    // Draw start/goal indicators
    if (n === state.startNode) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.START;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    if (n === state.goalNode) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.GOAL;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}

// Draw an edge
function drawEdge(e) {
    const a = state.nodes.find(n => n.id === e.from);
    const b = state.nodes.find(n => n.id === e.to);
    if (!a || !b) return;

    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const ax = a.x + Math.cos(angle) * 22;
    const ay = a.y + Math.sin(angle) * 22;
    const bx = b.x - Math.cos(angle) * 22;
    const by = b.y - Math.sin(angle) * 22;

    // Draw edge line
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineWidth = 3;
    ctx.strokeStyle = e.color || COLORS.EDGE;
    ctx.stroke();
    ctx.closePath();

    // Draw arrowhead for directed edges
    if (document.getElementById('directed-toggle').checked) {
        drawArrowhead({ x: ax, y: ay }, { x: bx, y: by }, e.color || COLORS.EDGE);
    }

    // Draw weight if enabled
    if (elements.showWeights.checked) {
        const m = midpoint({ x: ax, y: ay }, { x: bx, y: by });
        e._weightBox = { x: m.x - 18, y: m.y - 12, w: 36, h: 22, cx: m.x, cy: m.y };

        ctx.fillStyle = COLORS.WEIGHT_BG;
        ctx.fillRect(e._weightBox.x, e._weightBox.y, e._weightBox.w, e._weightBox.h);

        ctx.fillStyle = COLORS.TEXT;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.weight, e._weightBox.cx, e._weightBox.cy);
    }
}

// Draw node highlight
function drawNodeHighlight(node) {
    const x = node.x;
    const y = node.y;
    const radius = 25;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.HOVER;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

// Draw edge highlight
function drawEdgeHighlight(edge) {
    const a = state.nodes.find(n => n.id === edge.from);
    const b = state.nodes.find(n => n.id === edge.to);
    if (!a || !b) return;

    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const ax = a.x + Math.cos(angle) * 22;
    const ay = a.y + Math.sin(angle) * 22;
    const bx = b.x - Math.cos(angle) * 22;
    const by = b.y - Math.sin(angle) * 22;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineWidth = 5;
    ctx.strokeStyle = COLORS.HOVER;
    ctx.stroke();
    ctx.closePath();
}

// Draw arrowhead for directed edges
function drawArrowhead(from, to, color) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    const len = 10;

    ctx.save();
    ctx.translate(to.x, to.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-len, -6);
    ctx.lineTo(0, 0);
    ctx.lineTo(-len, 6);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

// Calculate midpoint between two points
function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Calculate distance between two points
function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// Find node at position
function findNodeAt(pos) {
    // Adjust for zoom and pan
    const adjustedPos = {
        x: (pos.x - state.pan.x) / state.zoom,
        y: (pos.y - state.pan.y) / state.zoom
    };

    return state.nodes.find(n => dist(n, adjustedPos) < 22);
}

// Find edge at position
function findEdgeAt(pos) {
    // Adjust for zoom and pan
    const adjustedPos = {
        x: (pos.x - state.pan.x) / state.zoom,
        y: (pos.y - state.pan.y) / state.zoom
    };

    for (const e of state.edges) {
        if (e._weightBox) {
            const wx = e._weightBox.x, wy = e._weightBox.y, ww = e._weightBox.w, wh = e._weightBox.h;
            if (adjustedPos.x >= wx && adjustedPos.x <= wx + ww &&
                adjustedPos.y >= wy && adjustedPos.y <= wy + wh) {
                return e;
            }
        }

        // Check if clicking near the edge line
        const a = state.nodes.find(n => n.id === e.from);
        const b = state.nodes.find(n => n.id === e.to);
        if (!a || !b) continue;

        // Calculate distance from point to line segment
        const lineDist = pointToLineDistance(adjustedPos, a, b);
        if (lineDist < 5) {
            return e;
        }
    }
    return null;
}

// Calculate distance from point to line segment
function pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq !== 0) {
        param = dot / len_sq;
    }

    let xx, yy;

    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Handle pointer down event
function handlePointerDown(evt) {
    const rect = canvas.getBoundingClientRect();
    const pos = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };

    if (evt.button === 1 || (evt.button === 0 && evt.ctrlKey)) {
        // Middle click or Ctrl+Left click for panning
        state.isPanning = true;
        state.panStart = { x: pos.x - state.pan.x, y: pos.y - state.pan.y };
        canvas.style.cursor = 'grabbing';
        return;
    }

    const clicked = findNodeAt(pos);
    state.pointerDownInfo = { pos, clicked, time: Date.now(), id: evt.pointerId };

    canvas.setPointerCapture(evt.pointerId);
}

// Handle pointer move event
function handlePointerMove(evt) {
    const rect = canvas.getBoundingClientRect();
    const pos = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };

    // Update hover effects
    const nodeUnderCursor = findNodeAt(pos);
    const edgeUnderCursor = findEdgeAt(pos);

    if (nodeUnderCursor !== state.hoverNode || edgeUnderCursor !== state.hoverEdge) {
        state.hoverNode = nodeUnderCursor;
        state.hoverEdge = edgeUnderCursor;
        draw();

        // Update node info
        if (nodeUnderCursor) {
            const degree = state.adj.get(nodeUnderCursor.id)?.length || 0;
            elements.nodeInfo.textContent = `Node ${nodeUnderCursor.label || nodeUnderCursor.id} (Degree: ${degree})`;
        } else if (edgeUnderCursor) {
            const fromNode = state.nodes.find(n => n.id === edgeUnderCursor.from);
            const toNode = state.nodes.find(n => n.id === edgeUnderCursor.to);
            elements.nodeInfo.textContent = `Edge: ${fromNode?.label || fromNode?.id} → ${toNode?.label || toNode?.id} (Weight: ${edgeUnderCursor.weight})`;
        } else {
            elements.nodeInfo.textContent = "Select a node to see details";
        }
    }

    if (state.isPanning) {
        state.pan.x = pos.x - state.panStart.x;
        state.pan.y = pos.y - state.panStart.y;
        draw();
        return;
    }

    if (!state.pointerDownInfo) return;

    const dx = pos.x - state.pointerDownInfo.pos.x;
    const dy = pos.y - state.pointerDownInfo.pos.y;
    const moved = Math.hypot(dx, dy);

    if (state.pointerDownInfo.clicked && moved > 6 && !state.draggingNode) {
        state.draggingNode = state.pointerDownInfo.clicked;
        state.dragOffset = {
            x: (pos.x - state.pan.x) / state.zoom - state.draggingNode.x,
            y: (pos.y - state.pan.y) / state.zoom - state.draggingNode.y
        };
    }

    if (state.draggingNode) {
        state.draggingNode.x = (pos.x - state.pan.x) / state.zoom - state.dragOffset.x;
        state.draggingNode.y = (pos.y - state.pan.y) / state.zoom - state.dragOffset.y;

        // Snap to grid if enabled
        if (document.getElementById('grid-snap').checked) {
            state.draggingNode.x = Math.round(state.draggingNode.x / 20) * 20;
            state.draggingNode.y = Math.round(state.draggingNode.y / 20) * 20;
        }

        draw();
    }
}

// Handle pointer up event
function handlePointerUp(evt) {
    const rect = canvas.getBoundingClientRect();
    const pos = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    const clickedNow = findNodeAt(pos);

    if (state.isPanning) {
        state.isPanning = false;
        canvas.style.cursor = 'default';
        return;
    }

    if (state.draggingNode) {
        saveState();
        state.draggingNode = null;
        state.pointerDownInfo = null;
        canvas.releasePointerCapture(evt.pointerId);
        return;
    }

    if (state.pointerDownInfo) {
        const wasClick = !state.pointerDownInfo.clicked ||
            (clickedNow && state.pointerDownInfo.clicked &&
                clickedNow.id === state.pointerDownInfo.clicked.id);

        if (wasClick) {
            handleClick(pos, clickedNow);
        }
    }

    state.pointerDownInfo = null;
    canvas.releasePointerCapture(evt.pointerId);
}

// Handle mouse enter
function handleMouseEnter() {
    canvas.style.cursor = 'default';
}

// Handle mouse leave
function handleMouseLeave() {
    state.hoverNode = null;
    state.hoverEdge = null;
    draw();
}

// Handle click on canvas
function handleClick(pos, clicked) {
    // Check if clicked on an edge weight
    const edge = findEdgeAt(pos);
    if (edge) {
        const newW = prompt('Edit edge weight:', edge.weight);
        if (newW !== null) {
            const num = parseInt(newW);
            if (!isNaN(num) && num > 0) {
                edge.weight = num;

                // Update adjacency list
                updateAdjacencyList();
                saveState();
                draw();
            }
        }
        return;
    }

    switch (state.mode) {
        case 'add-node':
            if (!clicked) {
                addNode(pos);
            }
            break;

        case 'add-edge':
            if (clicked) {
                if (state.selectedEdgeStart == null) {
                    state.selectedEdgeStart = clicked;
                    flashIndicator('Source selected — click target node');
                } else if (state.selectedEdgeStart.id !== clicked.id) {
                    addEdge(state.selectedEdgeStart, clicked);
                }
            }
            break;

        case 'delete':
            if (clicked) {
                deleteNode(clicked);
            } else {
                const edge = findClosestEdge(pos);
                if (edge) {
                    deleteEdge(edge);
                }
            }
            break;

        case 'set-start':
            if (clicked) {
                setStartNode(clicked);
            }
            break;

        case 'set-goal':
            if (clicked) {
                setGoalNode(clicked);
            }
            break;

        case 'multi-select':
            if (clicked) {
                if (state.selectedNodes.has(clicked.id)) {
                    state.selectedNodes.delete(clicked.id);
                } else {
                    state.selectedNodes.add(clicked.id);
                }
                draw();
            }
            break;
    }
}

// Handle double click
function handleDoubleClick(evt) {
    const rect = canvas.getBoundingClientRect();
    const pos = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    const clicked = findNodeAt(pos);

    if (clicked) {
        const newLabel = prompt('Rename node:', clicked.label || clicked.id);
        if (newLabel !== null) {
            clicked.label = String(newLabel);
            saveState();
            draw();
        }
    }
}

// Handle mouse wheel for zooming
function handleWheel(evt) {
    evt.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = evt.clientX - rect.left;
    const mouseY = evt.clientY - rect.top;

    // Zoom factor
    const zoomFactor = evt.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(state.zoom * zoomFactor, 0.5), 3);

    // Adjust pan to zoom toward mouse position
    state.pan.x = mouseX - (mouseX - state.pan.x) * (newZoom / state.zoom);
    state.pan.y = mouseY - (mouseY - state.pan.y) * (newZoom / state.zoom);
    state.zoom = newZoom;

    draw();
}

// Handle keyboard shortcuts
function handleKeyDown(e) {
    if (e.target.tagName === 'INPUT') return;

    switch (e.key) {
        case 'n': case 'N': setMode('add-node'); break;
        case 'e': case 'E': setMode('add-edge'); break;
        case 'd': case 'D': setMode('delete'); break;
        case 's': case 'S': setMode('set-start'); break;
        case 'g': case 'G': setMode('set-goal'); break;
        case 'm': case 'M': setMode('multi-select'); break;
        case 'f': case 'F': elements.nodeSearch.focus(); break;
        case ' ': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowRight': e.preventDefault(); nextStep(); break;
        case 'ArrowLeft': e.preventDefault(); prevStep(); break;
        case '+': case '=': e.preventDefault(); adjustZoom(0.1); break;
        case '-': case '_': e.preventDefault(); adjustZoom(-0.1); break;
        case '0': e.preventDefault(); resetView(); break;
        case 'l': case 'L': e.preventDefault(); applyLayout(); break;
        case 'z': case 'Z': if (e.ctrlKey) { e.preventDefault(); undo(); } break;
        case 'y': case 'Y': if (e.ctrlKey) { e.preventDefault(); redo(); } break;
        case 'Escape': setMode(null); break;
    }
}

// Set the current mode
function setMode(newMode) {
    state.mode = newMode;

    // Update UI
    document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));

    const modeButtons = {
        'add-node': 'add-node-btn',
        'add-edge': 'add-edge-btn',
        'delete': 'delete-btn',
        'set-start': 'set-start-btn',
        'set-goal': 'set-goal-btn',
        'multi-select': 'multi-select-btn'
    };

    if (newMode && modeButtons[newMode]) {
        document.getElementById(modeButtons[newMode]).classList.add('active');
    }

    // Update mode indicator
    const modeNames = {
        'add-node': 'Add Node',
        'add-edge': 'Add Edge',
        'delete': 'Delete',
        'set-start': 'Set Start',
        'set-goal': 'Set Goal',
        'multi-select': 'Multi-select',
        null: 'Idle'
    };

    const modeIcons = {
        'add-node': 'fa-plus-circle',
        'add-edge': 'fa-link',
        'delete': 'fa-trash-alt',
        'set-start': 'fa-play-circle',
        'set-goal': 'fa-flag-checkered',
        'multi-select': 'fa-mouse-pointer',
        null: 'fa-mouse-pointer'
    };

    elements.modeIndicator.innerHTML =
        `<i class="fas ${modeIcons[newMode]}"></i> Mode: ${modeNames[newMode]}`;

    // Update instructions
    const instructions = {
        'add-node': 'Click on empty space to create nodes. Double-click a node to rename. Drag to move.',
        'add-edge': 'Click a node to pick source, then click another node to create an edge.',
        'delete': 'Click on a node or edge to delete it.',
        'set-start': 'Click a node to mark it as the start node for algorithms.',
        'set-goal': 'Click a node to mark it as the goal node for pathfinding algorithms.',
        'multi-select': 'Click nodes to select multiple. Press Delete to remove selected nodes.',
        null: 'Select a tool to begin building your graph.'
    };

    elements.instructionBox.textContent = instructions[newMode];

    // Update cursor
    const cursors = {
        'add-node': 'crosshair',
        'add-edge': 'pointer',
        'delete': 'pointer',
        'set-start': 'pointer',
        'set-goal': 'pointer',
        'multi-select': 'pointer',
        null: 'default'
    };

    canvas.style.cursor = cursors[newMode];

    // Animate mode indicator
    const indicator = elements.modeIndicator;
    indicator.classList.remove('mode-animate');
    void indicator.offsetWidth;
    indicator.classList.add('mode-animate');
}

// Add a new node
function addNode(pos) {
    // Adjust for zoom and pan
    const adjustedPos = {
        x: (pos.x - state.pan.x) / state.zoom,
        y: (pos.y - state.pan.y) / state.zoom
    };

    // Snap to grid if enabled
    if (document.getElementById('grid-snap').checked) {
        adjustedPos.x = Math.round(adjustedPos.x / 20) * 20;
        adjustedPos.y = Math.round(adjustedPos.y / 20) * 20;
    }

    const id = state.nodes.length;
    const newNode = { id, x: adjustedPos.x, y: adjustedPos.y, label: String(id) };
    state.nodes.push(newNode);
    state.adj.set(id, []);

    saveState();
    updateStats();
    draw();
}

// Add a new edge
function addEdge(fromNode, toNode) {
    const randomWeightEnabled = document.getElementById('random-weight').checked;
    let weight = 1;

    if (randomWeightEnabled) {
        weight = Math.floor(Math.random() * 20) + 1;
    } else {
        const input = prompt('Edge weight (positive integer):', '1');
        if (input === null) return;

        weight = parseInt(input);
        if (isNaN(weight) || weight <= 0) {
            alert('Please enter a valid positive integer');
            return;
        }
    }

    // Check if edge already exists
    const edgeExists = state.edges.some(e =>
        (e.from === fromNode.id && e.to === toNode.id) ||
        (!document.getElementById('directed-toggle').checked && e.from === toNode.id && e.to === fromNode.id)
    );

    if (edgeExists) {
        alert('An edge already exists between these nodes');
        return;
    }

    state.edges.push({ from: fromNode.id, to: toNode.id, weight });

    // Update adjacency list
    if (!state.adj.has(fromNode.id)) state.adj.set(fromNode.id, []);
    state.adj.get(fromNode.id).push({ node: toNode.id, weight });

    if (!document.getElementById('directed-toggle').checked) {
        if (!state.adj.has(toNode.id)) state.adj.set(toNode.id, []);
        state.adj.get(toNode.id).push({ node: fromNode.id, weight });
    }

    state.selectedEdgeStart = null;
    saveState();
    updateStats();
    draw();
}

// Delete a node
function deleteNode(node) {
    // Remove node
    state.nodes = state.nodes.filter(n => n.id !== node.id);

    // Remove edges connected to node
    state.edges = state.edges.filter(e => e.from !== node.id && e.to !== node.id);

    // Update adjacency list
    state.adj.delete(node.id);
    for (let [key, value] of state.adj) {
        state.adj.set(key, value.filter(n => n.node !== node.id));
    }

    // Update start and goal nodes
    if (state.startNode === node) state.startNode = null;
    if (state.goalNode === node) state.goalNode = null;

    // Remove from selected nodes
    state.selectedNodes.delete(node.id);
    state.searchResults.delete(node.id);

    saveState();
    updateStats();
    draw();
}

// Find the closest edge to a position
function findClosestEdge(pos) {
    // Adjust for zoom and pan
    const adjustedPos = {
        x: (pos.x - state.pan.x) / state.zoom,
        y: (pos.y - state.pan.y) / state.zoom
    };

    let closestEdge = null;
    let minDistance = Infinity;

    for (const e of state.edges) {
        const a = state.nodes.find(n => n.id === e.from);
        const b = state.nodes.find(n => n.id === e.to);
        if (!a || !b) continue;

        const m = midpoint(a, b);
        const distance = dist(adjustedPos, m);

        if (distance < minDistance && distance < 30) {
            minDistance = distance;
            closestEdge = e;
        }
    }

    return closestEdge;
}

// Delete an edge
function deleteEdge(edge) {
    state.edges = state.edges.filter(e => e !== edge);

    // Update adjacency list
    updateAdjacencyList();

    saveState();
    updateStats();
    draw();
}

// Update adjacency list based on edges
function updateAdjacencyList() {
    state.adj.clear();

    for (const node of state.nodes) {
        state.adj.set(node.id, []);
    }

    for (const edge of state.edges) {
        if (!state.adj.has(edge.from)) state.adj.set(edge.from, []);
        state.adj.get(edge.from).push({ node: edge.to, weight: edge.weight });

        if (!document.getElementById('directed-toggle').checked) {
            if (!state.adj.has(edge.to)) state.adj.set(edge.to, []);
            state.adj.get(edge.to).push({ node: edge.from, weight: edge.weight });
        }
    }
}

// Set start node
function setStartNode(node) {
    if (state.startNode) {
        delete state.startNode.color;
    }

    state.startNode = node;
    if (node) {
        node.color = COLORS.START;
    }

    saveState();
    draw();
}

// Set goal node
function setGoalNode(node) {
    if (state.goalNode) {
        delete state.goalNode.color;
    }

    state.goalNode = node;
    if (node) {
        node.color = COLORS.GOAL;
    }

    saveState();
    draw();
}

// Save current state to history
function saveState() {
    // Remove future states if we're not at the end of history
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }

    // Deep copy current state
    const stateCopy = {
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        edges: JSON.parse(JSON.stringify(state.edges)),
        startNode: state.startNode ? state.nodes.find(n => n.id === state.startNode.id) : null,
        goalNode: state.goalNode ? state.nodes.find(n => n.id === state.goalNode.id) : null
    };

    state.history.push(stateCopy);
    state.historyIndex = state.history.length - 1;

    // Limit history size
    if (state.history.length > 50) {
        state.history.shift();
        state.historyIndex--;
    }

    updateUndoRedoButtons();
}

// Undo last action
function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        restoreState();
    }
}

// Redo undone action
function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        restoreState();
    }
}

// Restore state from history
function restoreState() {
    const historyState = state.history[state.historyIndex];

    state.nodes = JSON.parse(JSON.stringify(historyState.nodes));
    state.edges = JSON.parse(JSON.stringify(historyState.edges));

    // Restore start and goal nodes by reference
    state.startNode = historyState.startNode ?
        state.nodes.find(n => n.id === historyState.startNode.id) : null;
    state.goalNode = historyState.goalNode ?
        state.nodes.find(n => n.id === historyState.goalNode.id) : null;

    // Update adjacency list
    updateAdjacencyList();

    updateUndoRedoButtons();
    updateStats();
    draw();
}

// Update undo/redo buttons state
function updateUndoRedoButtons() {
    document.getElementById('undo-btn').disabled = state.historyIndex <= 0;
    document.getElementById('redo-btn').disabled = state.historyIndex >= state.history.length - 1;
}

// Clear the canvas
function clearCanvas() {
    if (!confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
        return;
    }

    state.nodes = [];
    state.edges = [];
    state.adj.clear();
    state.startNode = null;
    state.goalNode = null;
    state.steps = [];
    state.stepIndex = 0;
    state.selectedNodes.clear();
    state.searchResults.clear();

    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }

    elements.historyLog.innerHTML = '';
    elements.dsBox.innerHTML = '';
    elements.visitedBox.innerHTML = '';
    elements.pathBox.innerHTML = '';
    elements.stepText.textContent = 'Canvas cleared';

    saveState();
    updateStats();
    draw();
}

// Reset visualization
function resetVisualization() {
    state.steps = [];
    state.stepIndex = 0;

    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }

    // Reset node and edge colors
    state.nodes.forEach(n => {
        if (n === state.startNode) {
            n.color = COLORS.START;
        } else if (n === state.goalNode) {
            n.color = COLORS.GOAL;
        } else {
            delete n.color;
        }
    });

    state.edges.forEach(e => delete e.color);

    elements.historyLog.innerHTML = '';
    elements.dsBox.innerHTML = '';
    elements.visitedBox.innerHTML = '';
    elements.pathBox.innerHTML = '';
    elements.stepText.textContent = 'Visualization reset';

    updateStats();
    draw();
}

// Update statistics
function updateStats() {
    elements.nodesCount.textContent = state.nodes.length;
    elements.edgesCount.textContent = state.edges.length;
    elements.stepsCount.textContent = state.steps.length;

    // Calculate graph density
    const n = state.nodes.length;
    const maxEdges = n * (n - 1) / 2;
    const density = maxEdges > 0 ? (state.edges.length / maxEdges).toFixed(2) : 0;
    elements.graphDensity.textContent = density;

    // Calculate average degree
    let totalDegree = 0;
    for (const [_, neighbors] of state.adj) {
        totalDegree += neighbors.length;
    }
    const avgDegree = n > 0 ? (totalDegree / n).toFixed(1) : 0;
    elements.avgDegree.textContent = avgDegree;

    // Calculate connected components (simplified)
    const components = findConnectedComponents();
    elements.componentsCount.textContent = components.length;
}

// Find connected components using BFS
function findConnectedComponents() {
    const visited = new Set();
    const components = [];

    for (const node of state.nodes) {
        if (!visited.has(node.id)) {
            const component = [];
            const queue = [node.id];
            visited.add(node.id);

            while (queue.length > 0) {
                const current = queue.shift();
                component.push(current);

                const neighbors = state.adj.get(current) || [];
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor.node)) {
                        visited.add(neighbor.node);
                        queue.push(neighbor.node);
                    }
                }
            }

            components.push(component);
        }
    }

    return components;
}

// Flash indicator message
function flashIndicator(text) {
    elements.stepText.textContent = text;
    setTimeout(() => {
        if (state.stepIndex === 0) {
            elements.stepText.textContent = 'Use controls to play steps.';
        }
    }, 2000);
}

// Export graph to JSON
function exportGraph() {
    const graph = {
        nodes: state.nodes.map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y })),
        edges: state.edges.map(e => ({ from: e.from, to: e.to, weight: e.weight })),
        directed: document.getElementById('directed-toggle').checked,
        start: state.startNode ? state.startNode.id : null,
        goal: state.goalNode ? state.goalNode.id : null
    };

    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Import graph from JSON
function importGraph(evt) {
    const file = evt.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Clear current graph
            state.nodes = [];
            state.edges = [];
            state.adj.clear();
            state.selectedNodes.clear();
            state.searchResults.clear();

            // Add nodes
            data.nodes.forEach(n => {
                state.nodes.push({ id: n.id, label: n.label, x: n.x, y: n.y });
                state.adj.set(n.id, []);
            });

            // Add edges
            data.edges.forEach(ed => {
                state.edges.push({ from: ed.from, to: ed.to, weight: ed.weight });

                if (!state.adj.has(ed.from)) state.adj.set(ed.from, []);
                state.adj.get(ed.from).push({ node: ed.to, weight: ed.weight });

                if (!data.directed) {
                    if (!state.adj.has(ed.to)) state.adj.set(ed.to, []);
                    state.adj.get(ed.to).push({ node: ed.from, weight: ed.weight });
                }
            });

            // Set directed toggle
            if (document.getElementById('directed-toggle')) {
                document.getElementById('directed-toggle').checked = !!data.directed;
            }

            // Set start and goal nodes
            if (data.start !== null && data.start !== undefined) {
                const startNode = state.nodes.find(n => n.id === data.start);
                if (startNode) setStartNode(startNode);
            }

            if (data.goal !== null && data.goal !== undefined) {
                const goalNode = state.nodes.find(n => n.id === data.goal);
                if (goalNode) setGoalNode(goalNode);
            }

            // Reset file input
            evt.target.value = '';

            saveState();
            updateStats();
            draw();

            elements.stepText.textContent = 'Graph imported successfully';
        } catch (err) {
            alert('Error importing graph: Invalid JSON format');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// Generate random graph
function generateRandomGraph() {
    const nodeCount = Math.min(parseInt(prompt('Number of nodes (max 20):', '8')) || 8, 20);
    const edgeProbability = Math.min(parseFloat(prompt('Edge probability (0.1 to 0.9):', '0.3')) || 0.3, 0.9);

    // Clear current graph
    state.nodes = [];
    state.edges = [];
    state.adj.clear();
    state.startNode = null;
    state.goalNode = null;
    state.selectedNodes.clear();
    state.searchResults.clear();

    // Add nodes in a circular layout
    const centerX = canvas.width / (2 * state.zoom) - state.pan.x / state.zoom;
    const centerY = canvas.height / (2 * state.zoom) - state.pan.y / state.zoom;
    const radius = Math.min(canvas.width, canvas.height) / (3 * state.zoom);

    for (let i = 0; i < nodeCount; i++) {
        const angle = (i * 2 * Math.PI) / nodeCount;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        state.nodes.push({ id: i, x, y, label: String(i) });
        state.adj.set(i, []);
    }

    // Add edges
    const isDirected = document.getElementById('directed-toggle').checked;
    const randomWeight = document.getElementById('random-weight').checked;

    for (let i = 0; i < nodeCount; i++) {
        for (let j = isDirected ? 0 : i + 1; j < nodeCount; j++) {
            if (i !== j && Math.random() < edgeProbability) {
                const weight = randomWeight ? Math.floor(Math.random() * 20) + 1 : 1;
                state.edges.push({ from: i, to: j, weight });

                state.adj.get(i).push({ node: j, weight });
                if (!isDirected) {
                    state.adj.get(j).push({ node: i, weight });
                }
            }
        }
    }

    // Set start and goal nodes
    if (nodeCount >= 2) {
        setStartNode(state.nodes[0]);
        setGoalNode(state.nodes[nodeCount - 1]);
    }

    saveState();
    updateStats();
    draw();

    elements.stepText.textContent = `Random graph with ${nodeCount} nodes generated`;
}

// Adjust zoom level
function adjustZoom(factor) {
    const newZoom = Math.min(Math.max(state.zoom + factor, 0.5), 3);

    // Adjust pan to keep center
    const zoomRatio = newZoom / state.zoom;
    state.pan.x = canvas.width / 2 - (canvas.width / 2 - state.pan.x) * zoomRatio;
    state.pan.y = canvas.height / 2 - (canvas.height / 2 - state.pan.y) * zoomRatio;

    state.zoom = newZoom;
    draw();
}

// Reset view (zoom and pan)
function resetView() {
    state.zoom = 1;
    state.pan = { x: 0, y: 0 };
    draw();
}

// Set theme
function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('theme-light').classList.toggle('active', theme === 'light');
    document.getElementById('theme-dark').classList.toggle('active', theme === 'dark');

    // Save theme preference
    localStorage.setItem('graph-visualizer-theme', theme);
}

// Load theme from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('graph-visualizer-theme') || 'dark';
    setTheme(savedTheme);
}

// Handle search
function handleSearch() {
    const query = elements.nodeSearch.value.toLowerCase();
    elements.searchResults.innerHTML = '';
    state.searchResults.clear();

    if (query.length < 1) {
        elements.searchResults.classList.remove('active');
        draw();
        return;
    }

    const results = state.nodes.filter(node =>
        String(node.id).includes(query) ||
        (node.label && node.label.toLowerCase().includes(query))
    );

    if (results.length > 0) {
        elements.searchResults.classList.add('active');

        results.forEach(node => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.textContent = `Node ${node.id}: ${node.label || 'No label'}`;
            item.addEventListener('click', () => {
                // Center on the node
                state.pan.x = canvas.width / 2 - node.x * state.zoom;
                state.pan.y = canvas.height / 2 - node.y * state.zoom;
                draw();
                elements.nodeSearch.value = '';
                elements.searchResults.classList.remove('active');
            });
            elements.searchResults.appendChild(item);
            state.searchResults.add(node.id);
        });
    } else {
        elements.searchResults.classList.remove('active');
    }

    draw();
}

// Apply layout algorithm
function applyLayout() {
    const layoutType = elements.layoutSelect.value;

    switch (layoutType) {
        case 'circle':
            applyCircleLayout();
            break;
        case 'force':
            startForceDirectedLayout();
            break;
        case 'tree':
            applyTreeLayout();
            break;
        default:
            // Manual layout - do nothing
            break;
    }

    saveState();
    draw();
}

// Apply circle layout
function applyCircleLayout() {
    const centerX = canvas.width / (2 * state.zoom) - state.pan.x / state.zoom;
    const centerY = canvas.height / (2 * state.zoom) - state.pan.y / state.zoom;
    const radius = Math.min(canvas.width, canvas.height) / (3 * state.zoom);

    state.nodes.forEach((node, i) => {
        const angle = (i * 2 * Math.PI) / state.nodes.length;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
    });
}

// Start force-directed layout
function startForceDirectedLayout() {
    // Simple force-directed layout implementation
    const centerX = canvas.width / (2 * state.zoom) - state.pan.x / state.zoom;
    const centerY = canvas.height / (2 * state.zoom) - state.pan.y / state.zoom;

    // Initialize positions randomly around center
    state.nodes.forEach(node => {
        node.x = centerX + (Math.random() - 0.5) * 200;
        node.y = centerY + (Math.random() - 0.5) * 200;
        node.vx = 0;
        node.vy = 0;
    });

    // Run a few iterations of force-directed layout
    const iterations = 100;
    let iteration = 0;

    function step() {
        // Calculate repulsive forces
        state.nodes.forEach((node, i) => {
            node.vx = 0;
            node.vy = 0;

            state.nodes.forEach((other, j) => {
                if (i !== j) {
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;

                    // Repulsion force
                    const force = state.forceLayout.repulsion / (distance * distance);
                    node.vx += (dx / distance) * force;
                    node.vy += (dy / distance) * force;
                }
            });
        });

        // Calculate attractive forces (from edges)
        state.edges.forEach(edge => {
            const from = state.nodes.find(n => n.id === edge.from);
            const to = state.nodes.find(n => n.id === edge.to);
            if (!from || !to) return;

            const dx = from.x - to.x;
            const dy = from.y - to.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;

            // Attraction force
            const force = state.forceLayout.attraction * distance;
            from.vx -= (dx / distance) * force;
            from.vy -= (dy / distance) * force;
            to.vx += (dx / distance) * force;
            to.vy += (dy / distance) * force;
        });

        // Apply forces with damping
        state.nodes.forEach(node => {
            node.x += node.vx * state.forceLayout.damping;
            node.y += node.vy * state.forceLayout.damping;

            // Keep nodes within bounds
            node.x = Math.max(20, Math.min(canvas.width / state.zoom - 20, node.x));
            node.y = Math.max(20, Math.min(canvas.height / state.zoom - 20, node.y));
        });

        draw();

        iteration++;
        if (iteration < iterations) {
            requestAnimationFrame(step);
        }
    }

    step();
}

// Apply tree layout (simple hierarchical)
function applyTreeLayout() {
    if (!state.startNode) {
        alert('Tree layout requires a start node');
        return;
    }

    const centerX = canvas.width / (2 * state.zoom) - state.pan.x / state.zoom;
    const startY = canvas.height / (4 * state.zoom) - state.pan.y / state.zoom;
    const levelHeight = 80;

    // BFS to assign levels
    const levels = new Map();
    const queue = [{ node: state.startNode, level: 0 }];
    const visited = new Set([state.startNode.id]);
    levels.set(state.startNode.id, 0);

    while (queue.length > 0) {
        const { node, level } = queue.shift();

        const neighbors = state.adj.get(node.id) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.node)) {
                visited.add(neighbor.node);
                levels.set(neighbor.node, level + 1);
                const neighborNode = state.nodes.find(n => n.id === neighbor.node);
                if (neighborNode) {
                    queue.push({ node: neighborNode, level: level + 1 });
                }
            }
        }
    }

    // Calculate positions for each level
    const nodesByLevel = {};
    state.nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        if (!nodesByLevel[level]) nodesByLevel[level] = [];
        nodesByLevel[level].push(node);
    });

    // Position nodes
    Object.keys(nodesByLevel).forEach(level => {
        const nodes = nodesByLevel[level];
        const levelWidth = canvas.width / state.zoom;
        const spacing = levelWidth / (nodes.length + 1);

        nodes.forEach((node, i) => {
            node.x = (i + 1) * spacing;
            node.y = startY + (parseInt(level) * levelHeight);
        });
    });
}

// Show tutorial
function showTutorial() {
    elements.tutorialModal.classList.add('active');
    document.querySelectorAll('.tutorial-step').forEach(step => step.classList.remove('active'));
    document.querySelector('.tutorial-step[data-step="1"]').classList.add('active');
    document.getElementById('tutorial-prev').disabled = true;
    document.getElementById('tutorial-next').style.display = 'block';
    document.getElementById('tutorial-finish').style.display = 'none';
}

// Show shortcuts
function showShortcuts() {
    elements.shortcutsModal.classList.add('active');
}

// Next tutorial step
function nextTutorialStep() {
    const currentStep = document.querySelector('.tutorial-step.active');
    const currentStepNum = parseInt(currentStep.dataset.step);
    const nextStepNum = currentStepNum + 1;
    const nextStep = document.querySelector(`.tutorial-step[data-step="${nextStepNum}"]`);

    if (nextStep) {
        currentStep.classList.remove('active');
        nextStep.classList.add('active');
        document.getElementById('tutorial-prev').disabled = false;

        if (!document.querySelector(`.tutorial-step[data-step="${nextStepNum + 1}"]`)) {
            document.getElementById('tutorial-next').style.display = 'none';
            document.getElementById('tutorial-finish').style.display = 'block';
        }
    }
}

// Previous tutorial step
function prevTutorialStep() {
    const currentStep = document.querySelector('.tutorial-step.active');
    const currentStepNum = parseInt(currentStep.dataset.step);
    const prevStepNum = currentStepNum - 1;
    const prevStep = document.querySelector(`.tutorial-step[data-step="${prevStepNum}"]`);

    if (prevStep) {
        currentStep.classList.remove('active');
        prevStep.classList.add('active');
        document.getElementById('tutorial-next').style.display = 'block';
        document.getElementById('tutorial-finish').style.display = 'none';

        if (prevStepNum === 1) {
            document.getElementById('tutorial-prev').disabled = true;
        }
    }
}

// Close tutorial
function closeTutorial() {
    elements.tutorialModal.classList.remove('active');
}

// Algorithm preparation and execution functions
function prepareAlgo() {
    if (!state.startNode) {
        alert('Please select a start node first.');
        return;
    }

    if ((state.currentAlgo === 'astar' || state.currentAlgo === 'dijkstra' ||
        state.currentAlgo === 'bellman-ford') && !state.goalNode) {
        alert('Please select a goal node for this algorithm.');
        return;
    }

    elements.historyLog.innerHTML = '';

    switch (state.currentAlgo) {
        case 'bfs': prepareBFS(); break;
        case 'dfs': prepareDFS(); break;
        case 'dijkstra': prepareDijkstra(); break;
        case 'astar': prepareAStar(); break;
        case 'prim': preparePrim(); break;
        case 'kruskal': prepareKruskal(); break;
        case 'bellman-ford': prepareBellmanFord(); break;
        case 'floyd-warshall': prepareFloydWarshall(); break;
        case 'topological': prepareTopologicalSort(); break;
        case 'connected-components': prepareConnectedComponents(); break;
    }

    state.stepIndex = 0;
    if (state.steps.length > 0) {
        showStep(0);
    }
}

function prepareBFS() {
    state.steps = [];
    const queue = [state.startNode.id];
    const visited = new Set([state.startNode.id]);

    state.steps.push({
        desc: `Starting BFS from node ${state.startNode.label || state.startNode.id}`,
        ds: [...queue],
        visited: [...visited],
        path: []
    });

    while (queue.length > 0) {
        const current = queue.shift();
        const currentNode = state.nodes.find(n => n.id === current);

        state.steps.push({
            desc: `Visiting node ${currentNode.label || current}`,
            ds: [...queue],
            visited: [...visited],
            path: []
        });

        const neighbors = state.adj.get(current) || [];
        const neighborIds = neighbors.map(n => n.node);

        state.steps.push({
            desc: `Neighbors of ${currentNode.label || current}: [${neighborIds.join(', ')}]`,
            ds: [...queue],
            visited: [...visited],
            path: []
        });

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.node)) {
                visited.add(neighbor.node);
                queue.push(neighbor.node);

                state.steps.push({
                    desc: `Discovered node ${neighbor.node}, added to queue`,
                    ds: [...queue],
                    visited: [...visited],
                    path: []
                });
            }
        }
    }

    state.steps.push({
        desc: 'BFS completed',
        ds: [],
        visited: [...visited],
        path: []
    });
}

function prepareDFS() {
    state.steps = [];
    const stack = [state.startNode.id];
    const visited = new Set();

    state.steps.push({
        desc: `Starting DFS from node ${state.startNode.label || state.startNode.id}`,
        ds: [...stack],
        visited: [...visited],
        path: []
    });

    while (stack.length > 0) {
        const current = stack.pop();

        if (visited.has(current)) {
            state.steps.push({
                desc: `Skipping already visited node ${current}`,
                ds: [...stack],
                visited: [...visited],
                path: []
            });
            continue;
        }

        visited.add(current);
        const currentNode = state.nodes.find(n => n.id === current);

        state.steps.push({
            desc: `Visiting node ${currentNode.label || current}`,
            ds: [...stack],
            visited: [...visited],
            path: []
        });

        const neighbors = state.adj.get(current) || [];
        const unvisitedNeighbors = neighbors.filter(n => !visited.has(n.node));

        if (unvisitedNeighbors.length > 0) {
            const neighborIds = unvisitedNeighbors.map(n => n.node);
            state.steps.push({
                desc: `Adding unvisited neighbors to stack: [${neighborIds.join(', ')}]`,
                ds: [...stack],
                visited: [...visited],
                path: []
            });

            // Add neighbors in reverse order to maintain DFS order
            for (let i = unvisitedNeighbors.length - 1; i >= 0; i--) {
                stack.push(unvisitedNeighbors[i].node);
            }
        }
    }

    state.steps.push({
        desc: 'DFS completed',
        ds: [],
        visited: [...visited],
        path: []
    });
}

function prepareDijkstra() {
    state.steps = [];
    const dist = new Map();
    const prev = new Map();
    const queue = [];

    // Initialize distances
    for (const node of state.nodes) {
        dist.set(node.id, node.id === state.startNode.id ? 0 : Infinity);
        prev.set(node.id, null);
        queue.push(node.id);
    }

    state.steps.push({
        desc: `Starting Dijkstra's algorithm from node ${state.startNode.label || state.startNode.id}`,
        ds: [...queue],
        visited: [],
        path: [],
        dist: Object.fromEntries(dist)
    });

    while (queue.length > 0) {
        // Find node with smallest distance
        let minNode = null;
        for (const nodeId of queue) {
            if (minNode === null || dist.get(nodeId) < dist.get(minNode)) {
                minNode = nodeId;
            }
        }

        // Remove minNode from queue
        const index = queue.indexOf(minNode);
        queue.splice(index, 1);

        const currentNode = state.nodes.find(n => n.id === minNode);
        state.steps.push({
            desc: `Visiting node ${currentNode.label || minNode} with distance ${dist.get(minNode)}`,
            ds: [...queue],
            visited: Array.from(dist.keys()).filter(k => !queue.includes(k) && dist.get(k) < Infinity),
            path: [],
            dist: Object.fromEntries(dist)
        });

        // If we reached the goal, we can stop early
        if (minNode === state.goalNode.id) {
            // Reconstruct path
            const path = [];
            let current = minNode;
            while (current !== null) {
                path.unshift(current);
                current = prev.get(current);
            }

            state.steps.push({
                desc: `Found shortest path to goal with distance ${dist.get(minNode)}`,
                ds: [...queue],
                visited: Array.from(dist.keys()).filter(k => !queue.includes(k) && dist.get(k) < Infinity),
                path: [...path],
                dist: Object.fromEntries(dist)
            });
            break;
        }

        // Update distances for neighbors
        const neighbors = state.adj.get(minNode) || [];
        for (const neighbor of neighbors) {
            if (queue.includes(neighbor.node)) {
                const alt = dist.get(minNode) + neighbor.weight;
                if (alt < dist.get(neighbor.node)) {
                    dist.set(neighbor.node, alt);
                    prev.set(neighbor.node, minNode);

                    state.steps.push({
                        desc: `Updated distance to node ${neighbor.node}: ${alt}`,
                        ds: [...queue],
                        visited: Array.from(dist.keys()).filter(k => !queue.includes(k) && dist.get(k) < Infinity),
                        path: [],
                        dist: Object.fromEntries(dist)
                    });
                }
            }
        }
    }

    state.steps.push({
        desc: "Dijkstra's algorithm completed",
        ds: [],
        visited: Array.from(dist.keys()).filter(k => dist.get(k) < Infinity),
        path: [],
        dist: Object.fromEntries(dist)
    });
}

function prepareAStar() {
    state.steps = [];
    // For simplicity, we'll use a simple heuristic (Euclidean distance to goal)
    const heuristic = (nodeId) => {
        const node = state.nodes.find(n => n.id === nodeId);
        const goal = state.goalNode;
        if (!node || !goal) return 0;
        return Math.sqrt(Math.pow(node.x - goal.x, 2) + Math.pow(node.y - goal.y, 2)) / 50;
    };

    const gScore = {};
    const fScore = {};
    const openSet = [state.startNode.id];
    const cameFrom = {};

    // Initialize scores
    for (const node of state.nodes) {
        gScore[node.id] = node.id === state.startNode.id ? 0 : Infinity;
        fScore[node.id] = node.id === state.startNode.id ? heuristic(state.startNode.id) : Infinity;
    }

    state.steps.push({
        desc: `Starting A* search from node ${state.startNode.label || state.startNode.id}`,
        ds: [...openSet],
        visited: [],
        path: [],
        gScore: { ...gScore },
        fScore: { ...fScore }
    });

    while (openSet.length > 0) {
        // Find node with lowest fScore
        let current = openSet[0];
        for (const nodeId of openSet) {
            if (fScore[nodeId] < fScore[current]) {
                current = nodeId;
            }
        }

        // If we reached the goal
        if (current === state.goalNode.id) {
            // Reconstruct path
            const path = [current];
            while (cameFrom[current] !== undefined) {
                current = cameFrom[current];
                path.unshift(current);
            }

            state.steps.push({
                desc: `Found path to goal with cost ${gScore[state.goalNode.id]}`,
                ds: [...openSet],
                visited: Object.keys(gScore).filter(k => gScore[k] < Infinity).map(Number),
                path: path,
                gScore: { ...gScore },
                fScore: { ...fScore }
            });
            break;
        }

        // Remove current from openSet
        const index = openSet.indexOf(current);
        openSet.splice(index, 1);

        const visitedNodes = Object.keys(gScore).filter(k => gScore[k] < Infinity);
        state.steps.push({
            desc: `Visiting node ${current} with fScore ${fScore[current].toFixed(2)}`,
            ds: [...openSet],
            visited: visitedNodes.map(Number),
            path: [],
            gScore: { ...gScore },
            fScore: { ...fScore }
        });

        // Process neighbors
        const neighbors = state.adj.get(current) || [];
        for (const neighbor of neighbors) {
            const tentativeGScore = gScore[current] + neighbor.weight;
            if (tentativeGScore < gScore[neighbor.node]) {
                cameFrom[neighbor.node] = current;
                gScore[neighbor.node] = tentativeGScore;
                fScore[neighbor.node] = gScore[neighbor.node] + heuristic(neighbor.node);

                if (!openSet.includes(neighbor.node)) {
                    openSet.push(neighbor.node);
                }

                state.steps.push({
                    desc: `Updated scores for node ${neighbor.node}: g=${gScore[neighbor.node].toFixed(2)}, f=${fScore[neighbor.node].toFixed(2)}`,
                    ds: [...openSet],
                    visited: visitedNodes.map(Number),
                    path: [],
                    gScore: { ...gScore },
                    fScore: { ...fScore }
                });
            }
        }
    }

    const visitedNodes = Object.keys(gScore).filter(k => gScore[k] < Infinity);
    state.steps.push({
        desc: "A* search completed",
        ds: [],
        visited: visitedNodes.map(Number),
        path: [],
        gScore: { ...gScore },
        fScore: { ...fScore }
    });
}

function prepareBellmanFord() {
    state.steps = [{
        desc: "Bellman-Ford algorithm preparation not implemented in this version",
        ds: [],
        visited: [],
        path: []
    }];
}

function prepareFloydWarshall() {
    state.steps = [{
        desc: "Floyd-Warshall algorithm preparation not implemented in this version",
        ds: [],
        visited: [],
        path: []
    }];
}

function prepareTopologicalSort() {
    state.steps = [{
        desc: "Topological sort preparation not implemented in this version",
        ds: [],
        visited: [],
        path: []
    }];
}

function prepareConnectedComponents() {
    state.steps = [{
        desc: "Connected components algorithm preparation not implemented in this version",
        ds: [],
        visited: [],
        path: []
    }];
}

function preparePrim() {
    state.steps = [{
        desc: "Prim's algorithm preparation not implemented in this version",
        ds: [],
        visited: [],
        path: []
    }];
}

function prepareKruskal() {
    state.steps = [{
        desc: "Kruskal's algorithm preparation not implemented in this version",
        ds: [],
        visited: [],
        path: []
    }];
}

function showStep(index) {
    if (index < 0 || index >= state.steps.length) return;

    state.stepIndex = index;
    const step = state.steps[index];

    // Reset all node colors
    state.nodes.forEach(n => {
        if (n === state.startNode) {
            n.color = COLORS.START;
        } else if (n === state.goalNode) {
            n.color = COLORS.GOAL;
        } else {
            delete n.color;
        }
    });

    // Reset all edge colors
    state.edges.forEach(e => delete e.color);

    // Color visited nodes
    if (step.visited) {
        step.visited.forEach(nodeId => {
            const node = state.nodes.find(n => n.id === nodeId);
            if (node && node !== state.startNode && node !== state.goalNode) {
                node.color = COLORS.VISITED;
            }
        });
    }

    // Color nodes in data structure (currently being processed)
    if (step.ds) {
        step.ds.forEach(nodeId => {
            const node = state.nodes.find(n => n.id === nodeId);
            if (node && node !== state.startNode && node !== state.goalNode) {
                node.color = COLORS.VISITING;
            }
        });
    }

    // Color path nodes
    if (step.path && step.path.length > 0) {
        step.path.forEach(nodeId => {
            const node = state.nodes.find(n => n.id === nodeId);
            if (node && node !== state.startNode && node !== state.goalNode) {
                node.color = COLORS.PATH;
            }
        });

        // Color path edges
        for (let i = 0; i < step.path.length - 1; i++) {
            const from = step.path[i];
            const to = step.path[i + 1];

            const edge = state.edges.find(e =>
                (e.from === from && e.to === to) || (e.from === to && e.to === from)
            );

            if (edge) {
                edge.color = COLORS.ACTIVE_EDGE;
            }
        }
    }

    // Update UI
    elements.stepText.textContent = step.desc;
    updateRightPanel(step);
    draw();
}

function updateRightPanel(step) {
    // Update data structure visualization
    const dsBox = elements.dsBox;
    dsBox.innerHTML = '';

    if (step.ds && step.ds.length > 0) {
        step.ds.forEach(x => {
            const div = document.createElement('div');
            div.className = 'ds-item';
            div.textContent = x;
            dsBox.appendChild(div);
        });
    } else {
        dsBox.innerHTML = '<div class="small-muted">Empty</div>';
    }

    // Update visited nodes
    const visitedBox = elements.visitedBox;
    visitedBox.innerHTML = '';

    if (step.visited && step.visited.length > 0) {
        step.visited.forEach(v => {
            const d = document.createElement('div');
            d.className = 'ds-item';
            d.style.background = 'linear-gradient(90deg, var(--good), #34d399)';
            d.textContent = v;
            visitedBox.appendChild(d);
        });
    } else {
        visitedBox.innerHTML = '<div class="small-muted">None</div>';
    }

    // Update path
    const pathBox = elements.pathBox;
    pathBox.innerHTML = '';

    if (step.path && step.path.length > 0) {
        step.path.forEach(v => {
            const d = document.createElement('div');
            d.className = 'ds-item';
            d.style.background = 'linear-gradient(90deg, var(--accent-2), #c084fc)';
            d.textContent = v;
            pathBox.appendChild(d);
        });
    } else {
        pathBox.innerHTML = '<div class="small-muted">No path found</div>';
    }

    // Update history log
    const history = elements.historyLog;
    const li = document.createElement('li');
    li.textContent = step.desc;
    history.appendChild(li);
    history.scrollTop = history.scrollHeight;
}

function nextStep() {
    if (state.steps.length === 0) prepareAlgo();
    if (state.stepIndex < state.steps.length - 1) {
        showStep(state.stepIndex + 1);
    }
}

function prevStep() {
    if (state.steps.length > 0 && state.stepIndex > 0) {
        showStep(state.stepIndex - 1);
    }
}

function play() {
    if (state.steps.length === 0) prepareAlgo();
    if (state.intervalId) clearInterval(state.intervalId);

    state.intervalId = setInterval(() => {
        if (state.stepIndex < state.steps.length - 1) {
            showStep(state.stepIndex + 1);
        } else {
            clearInterval(state.intervalId);
            state.intervalId = null;
        }
    }, state.speed);
}

function pause() {
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
}

function togglePlayPause() {
    if (state.intervalId) {
        pause();
    } else {
        play();
    }
}

// Initialize the application when the page loads
window.addEventListener('load', init);