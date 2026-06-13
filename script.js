/* ========================================
   BlockBlast - Full Game Logic
   ======================================== */

// ==========================================
// CONSTANTS & SHAPE DEFINITIONS
// ==========================================
const BOARD_SIZE = 8;

const BLOCK_COLORS = [
    '#00e5ff', // cyan
    '#e040fb', // magenta
    '#ff6d00', // orange
    '#00e676', // green
    '#ffd600', // yellow
    '#2979ff', // blue
    '#ff4081', // pink
];

// Each shape is defined as an array of [row, col] offsets relative to top-left
const SHAPES = [
    // === 1-cell ===
    { cells: [[0,0]], name: 'dot' },

    // === 2-cells ===
    { cells: [[0,0],[0,1]], name: 'h2' },
    { cells: [[0,0],[1,0]], name: 'v2' },

    // === 3-cells ===
    { cells: [[0,0],[0,1],[0,2]], name: 'h3' },
    { cells: [[0,0],[1,0],[2,0]], name: 'v3' },
    { cells: [[0,0],[0,1],[1,0]], name: 'L-tl' },
    { cells: [[0,0],[0,1],[1,1]], name: 'L-tr' },
    { cells: [[0,0],[1,0],[1,1]], name: 'L-bl' },
    { cells: [[0,1],[1,0],[1,1]], name: 'L-br' },

    // === 4-cells ===
    { cells: [[0,0],[0,1],[0,2],[0,3]], name: 'h4' },
    { cells: [[0,0],[1,0],[2,0],[3,0]], name: 'v4' },
    { cells: [[0,0],[0,1],[1,0],[1,1]], name: 'sq2' },
    // T-shapes
    { cells: [[0,0],[0,1],[0,2],[1,1]], name: 'T-down' },
    { cells: [[0,1],[1,0],[1,1],[2,1]], name: 'T-left' },
    { cells: [[0,1],[1,0],[1,1],[1,2]], name: 'T-up' },
    { cells: [[0,0],[1,0],[1,1],[2,0]], name: 'T-right' },
    // S/Z shapes
    { cells: [[0,0],[0,1],[1,1],[1,2]], name: 'S' },
    { cells: [[0,1],[0,2],[1,0],[1,1]], name: 'Z' },
    { cells: [[0,0],[1,0],[1,1],[2,1]], name: 'S-vert' },
    { cells: [[0,1],[1,0],[1,1],[2,0]], name: 'Z-vert' },

    // === 5-cells ===
    { cells: [[0,0],[0,1],[0,2],[0,3],[0,4]], name: 'h5' },
    { cells: [[0,0],[1,0],[2,0],[3,0],[4,0]], name: 'v5' },
    // Big L
    { cells: [[0,0],[1,0],[2,0],[2,1],[2,2]], name: 'bigL' },
    { cells: [[0,0],[0,1],[0,2],[1,0],[2,0]], name: 'bigL2' },
    { cells: [[0,0],[0,1],[0,2],[1,2],[2,2]], name: 'bigL3' },
    { cells: [[0,2],[1,2],[2,0],[2,1],[2,2]], name: 'bigL4' },

    // === 9-cells (3x3 square) ===
    { cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], name: 'sq3' },

    // === 6-cells ===
    { cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], name: 'rect-h-2x3' },
    { cells: [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]], name: 'rect-v-3x2' },

    // === Hook 4-cells ===
    { cells: [[0,0], [1,0], [1,1], [1,2]], name: 'hook-tl-h-1x3' },
    { cells: [[0,2], [1,0], [1,1], [1,2]], name: 'hook-tr-h-1x3' },
    { cells: [[0,0], [0,1], [0,2], [1,0]], name: 'hook-bl-h-1x3' },
    { cells: [[0,0], [0,1], [0,2], [1,2]], name: 'hook-br-h-1x3' },
    { cells: [[0,0], [0,1], [1,1], [2,1]], name: 'hook-tl-v-3x1' },
    { cells: [[0,1], [1,1], [2,0], [2,1]], name: 'hook-bl-v-3x1' },
    { cells: [[0,0], [0,1], [1,0], [2,0]], name: 'hook-tr-v-3x1' },
    { cells: [[0,0], [1,0], [2,0], [2,1]], name: 'hook-br-v-3x1' },
];


// ==========================================
// SOUND EFFECTS & HAPTICS ENGINE
// ==========================================
class SoundEffects {
    constructor() {
        this.enabled = localStorage.getItem('blockblast_sound') !== 'false';
        this.ctx = null;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    play(type) {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            
            const now = this.ctx.currentTime;
            
            if (type === 'click') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
                
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'place') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
                
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'clear') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.25);
                
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'combo') {
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.08);
                    
                    gain.gain.setValueAtTime(0.0, now);
                    gain.gain.linearRampToValueAtTime(0.1, now + i * 0.08 + 0.02);
                    gain.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.2);
                    
                    osc.start(now + i * 0.08);
                    osc.stop(now + i * 0.08 + 0.2);
                });
            } else if (type === 'gameover') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.linearRampToValueAtTime(70, now + 0.55);
                
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.55);
                
                osc.start(now);
                osc.stop(now + 0.55);
            }
        } catch (e) {
            console.error('Audio failed to play', e);
        }
    }
}

const soundEffects = new SoundEffects();

const vibrationEnabled = () => localStorage.getItem('blockblast_vibrate') !== 'false';
function triggerVibration(duration) {
    if (vibrationEnabled() && navigator.vibrate) {
        try {
            navigator.vibrate(duration);
        } catch (e) {
            // Ignore vibration errors
        }
    }
}


// ==========================================
// BACKGROUND PARTICLE SYSTEM (from intro)
// ==========================================
class ParticleBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.themeMinHue = null;
        this.themeMaxHue = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.init();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        const count = Math.min(Math.floor((this.canvas.width * this.canvas.height) / 15000), 80);
        this.particles = [];
        for (let i = 0; i < count; i++) {
            let hue;
            if (this.themeMinHue === null) {
                hue = Math.random() * 360;
            } else if (this.themeMaxHue === null) {
                hue = this.themeMinHue;
            } else {
                hue = this.themeMinHue + Math.random() * (this.themeMaxHue - this.themeMinHue);
            }
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.3 + 0.1,
                hue: hue,
            });
        }
    }

    setThemeColors(minHue, maxHue = null) {
        this.themeMinHue = minHue;
        this.themeMaxHue = maxHue;
        for (const p of this.particles) {
            if (minHue === null) {
                p.hue = Math.random() * 360;
            } else if (maxHue === null) {
                p.hue = minHue;
            } else {
                p.hue = minHue + Math.random() * (maxHue - minHue);
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(30, 20, 60, 0.3)');
        gradient.addColorStop(0.5, 'rgba(15, 10, 40, 0.2)');
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const p of this.particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`;
            this.ctx.fill();
        }

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(100, 100, 200, ${0.05 * (1 - dist / 100)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
        requestAnimationFrame(() => this.animate());
    }
}


// ==========================================
// FLOATING BLOCKS MANAGER (intro decoration)
// ==========================================
class FloatingBlocksManager {
    constructor(container) {
        this.container = container;
        this.colors = BLOCK_COLORS;
        this.shapes = [
            { cols: 2, cells: [1, 0, 1, 0, 1, 1] },
            { cols: 3, cells: [1, 1, 1, 0, 1, 0] },
            { cols: 2, cells: [1, 1, 1, 1] },
            { cols: 1, cells: [1, 1, 1] },
            { cols: 3, cells: [0, 1, 1, 1, 1, 0] },
            { cols: 1, cells: [1] },
            { cols: 2, cells: [1, 1, 1, 0] },
        ];
        this.spawnBlocks();
    }

    createBlock() {
        const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const block = document.createElement('div');
        block.className = 'floating-block';
        block.style.color = color;
        block.style.gridTemplateColumns = `repeat(${shape.cols}, 1fr)`;
        block.style.left = `${Math.random() * 90 + 5}%`;
        block.style.top = `${Math.random() * 80 + 10}%`;
        block.style.animationDuration = `${Math.random() * 8 + 8}s`;
        block.style.animationDelay = `${Math.random() * 6}s`;
        const scale = 0.6 + Math.random() * 0.8;
        block.style.transform = `scale(${scale})`;
        for (const cell of shape.cells) {
            const cellEl = document.createElement('div');
            cellEl.className = `fb-cell${cell ? ' filled' : ''}`;
            block.appendChild(cellEl);
        }
        return block;
    }

    spawnBlocks() {
        const count = window.innerWidth < 480 ? 6 : 12;
        for (let i = 0; i < count; i++) {
            this.container.appendChild(this.createBlock());
        }
    }
}


// ==========================================
// PREVIEW BOARD ANIMATION (intro screen)
// ==========================================
class PreviewBoardAnimation {
    constructor(boardEl) {
        this.board = boardEl;
        this.size = 5;
        this.grid = Array(this.size * this.size).fill(false);
        this.cells = [];
        this.running = true;
        this.createBoard();
        this.runDemo();
    }

    createBoard() {
        this.board.innerHTML = '';
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            this.board.appendChild(cell);
            this.cells.push(cell);
        }
    }

    stop() { this.running = false; }

    placeBlock(positions, color) {
        return new Promise(resolve => {
            let delay = 0;
            for (const pos of positions) {
                if (pos >= 0 && pos < this.size * this.size) {
                    this.grid[pos] = true;
                    const cell = this.cells[pos];
                    setTimeout(() => {
                        cell.classList.add('filled');
                        cell.style.background = color;
                        cell.style.transform = 'scale(0)';
                        cell.offsetHeight;
                        cell.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
                        cell.style.transform = 'scale(1)';
                    }, delay);
                    delay += 60;
                }
            }
            setTimeout(resolve, delay + 200);
        });
    }

    checkAndClear() {
        return new Promise(resolve => {
            const toClear = new Set();
            for (let row = 0; row < this.size; row++) {
                let full = true;
                for (let col = 0; col < this.size; col++) {
                    if (!this.grid[row * this.size + col]) { full = false; break; }
                }
                if (full) {
                    for (let col = 0; col < this.size; col++) toClear.add(row * this.size + col);
                }
            }
            for (let col = 0; col < this.size; col++) {
                let full = true;
                for (let row = 0; row < this.size; row++) {
                    if (!this.grid[row * this.size + col]) { full = false; break; }
                }
                if (full) {
                    for (let row = 0; row < this.size; row++) toClear.add(row * this.size + col);
                }
            }
            if (toClear.size > 0) {
                for (const pos of toClear) this.cells[pos].classList.add('clearing');
                setTimeout(() => {
                    for (const pos of toClear) {
                        this.grid[pos] = false;
                        this.cells[pos].classList.remove('filled', 'clearing');
                        this.cells[pos].style.background = '';
                        this.cells[pos].style.transform = '';
                        this.cells[pos].style.transition = '';
                    }
                    resolve(true);
                }, 500);
            } else {
                resolve(false);
            }
        });
    }

    resetBoard() {
        return new Promise(resolve => {
            for (let i = 0; i < this.grid.length; i++) {
                this.grid[i] = false;
                const cell = this.cells[i];
                cell.classList.remove('filled', 'clearing');
                cell.style.background = '';
                cell.style.transform = '';
                cell.style.transition = '';
            }
            setTimeout(resolve, 300);
        });
    }

    async runDemo() {
        const colors = BLOCK_COLORS;
        const rc = () => colors[Math.floor(Math.random() * colors.length)];
        while (this.running) {
            await this.resetBoard();
            await this.sleep(1000);
            if (!this.running) break;
            await this.placeBlock([10, 11, 15], rc());
            await this.sleep(600);
            if (!this.running) break;
            await this.placeBlock([12, 13, 7, 8], rc());
            await this.sleep(600);
            if (!this.running) break;
            await this.placeBlock([14, 9, 4], rc());
            await this.sleep(400);
            await this.checkAndClear();
            await this.sleep(800);
            if (!this.running) break;
            await this.placeBlock([0, 1, 5, 6], rc());
            await this.sleep(500);
            if (!this.running) break;
            await this.placeBlock([2, 3, 12, 17], rc());
            await this.sleep(500);
            if (!this.running) break;
            await this.placeBlock([22, 21, 20], rc());
            await this.sleep(400);
            await this.checkAndClear();
            await this.sleep(1500);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


// ==========================================
// MODAL MANAGER
// ==========================================
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.setupListeners();
    }

    setupListeners() {
        const howToPlayBtn = document.getElementById('howToPlayBtn');
        const howToPlayModal = document.getElementById('howToPlayModal');
        const modalCloseBtn = document.getElementById('modalCloseBtn');

        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const settingsCloseBtn = document.getElementById('settingsCloseBtn');

        const soundToggle = document.getElementById('soundToggle');
        const vibrateToggle = document.getElementById('vibrateToggle');
        const resetScoreBtn = document.getElementById('resetScoreBtn');

        // Initialize checkbox states from localStorage
        soundToggle.checked = localStorage.getItem('blockblast_sound') !== 'false';
        vibrateToggle.checked = localStorage.getItem('blockblast_vibrate') !== 'false';

        // How To Play listeners
        howToPlayBtn.addEventListener('click', () => {
            soundEffects.play('click');
            this.open(howToPlayModal);
        });
        modalCloseBtn.addEventListener('click', () => {
            soundEffects.play('click');
            this.close(howToPlayModal);
        });
        howToPlayModal.addEventListener('click', (e) => {
            if (e.target === howToPlayModal) {
                soundEffects.play('click');
                this.close(howToPlayModal);
            }
        });

        // Settings Modal listeners
        settingsBtn.addEventListener('click', () => {
            soundEffects.play('click');
            this.open(settingsModal);
        });
        settingsCloseBtn.addEventListener('click', () => {
            soundEffects.play('click');
            this.close(settingsModal);
        });
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                soundEffects.play('click');
                this.close(settingsModal);
            }
        });

        // Settings actions
        soundToggle.addEventListener('change', () => {
            soundEffects.enabled = soundToggle.checked;
            localStorage.setItem('blockblast_sound', soundToggle.checked.toString());
            soundEffects.play('click');
        });

        vibrateToggle.addEventListener('change', () => {
            localStorage.setItem('blockblast_vibrate', vibrateToggle.checked.toString());
            soundEffects.play('click');
            triggerVibration(15);
        });

        resetScoreBtn.addEventListener('click', () => {
            soundEffects.play('click');
            if (confirm('En yüksek skoru sıfırlamak istediğinize emin misiniz?')) {
                localStorage.removeItem('blockblast_highscore');
                if (window.gameInstance) {
                    window.gameInstance.highScore = 0;
                    window.gameInstance.highScoreValueEl.textContent = '0';
                }
                soundEffects.play('clear');
                alert('En yüksek skor sıfırlandı!');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                soundEffects.play('click');
                this.close(this.activeModal);
            }
        });
    }

    open(modal) {
        modal.classList.add('active');
        this.activeModal = modal;
    }

    close(modal) {
        modal.classList.remove('active');
        this.activeModal = null;
    }
}


// ==========================================
// MAIN GAME ENGINE
// ==========================================
class BlockBlastGame {
    constructor() {
        window.gameInstance = this;
        // DOM
        this.introScreen = document.getElementById('introScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.gameBoardEl = document.getElementById('gameBoard');
        this.boardWrapper = this.gameBoardEl.parentElement;
        this.pieceTray = document.getElementById('pieceTray');
        this.scoreValueEl = document.getElementById('scoreValue');
        this.highScoreValueEl = document.getElementById('highScoreValue');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.gameOverScoreEl = document.getElementById('gameOverScore');
        this.gameOverBestEl = document.getElementById('gameOverBest');
        this.dragGhost = document.getElementById('dragGhost');

        // State
        this.board = [];           // 8x8 grid: null or color string
        this.cells = [];           // DOM cell references
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('blockblast_highscore') || '0');
        this.pieces = [null, null, null]; // 3 piece slots
        this.piecesUsed = 0;
        this.streak = 0;
        this.currentTheme = 'default';

        // Drag state
        this.dragging = false;
        this.dragPieceIndex = -1;
        this.dragShape = null;
        this.dragColor = '';
        this.dragCenterRow = 0;       // shape center offset for anchor calc
        this.dragCenterCol = 0;
        this.dragShapeRows = 0;
        this.dragShapeCols = 0;
        this.lastPreviewCells = [];
        this.lastWillClearCells = [];
        this.lastAnchorRow = -1;      // cache to avoid redundant preview updates
        this.lastAnchorCol = -1;

        // Initialize
        this.createBoard();
        this.setupDragHandlers();
        this.setupButtons();
    }

    // --- Board creation ---
    createBoard() {
        this.gameBoardEl.innerHTML = '';
        this.board = [];
        this.cells = [];

        for (let r = 0; r < BOARD_SIZE; r++) {
            this.board[r] = [];
            this.cells[r] = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                this.board[r][c] = null;
                const cell = document.createElement('div');
                cell.className = 'game-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                this.gameBoardEl.appendChild(cell);
                this.cells[r][c] = cell;
            }
        }
    }

    // --- Start new game ---
    startGame() {
        this.score = 0;
        this.streak = 0;
        this.setTheme('default', false);
        this.highScoreValueEl.textContent = this.highScore;
        this.updateScoreDisplay();

        // Reset board
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                this.board[r][c] = null;
                this.cells[r][c].className = 'game-cell';
                this.cells[r][c].style.background = '';
            }
        }

        this.gameOverOverlay.classList.add('hidden');
        this.generatePieces();
    }

    // --- Generate 3 random pieces ---
    generatePieces() {
        this.piecesUsed = 0;
        for (let i = 0; i < 3; i++) {
            let selectedShape = null;
            let retries = 0;
            
            // Try to pick a shape that can be placed on the current board (maximum 6 retries)
            while (retries < 6) {
                const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
                if (this.canPlaceAnywhere(shape)) {
                    selectedShape = shape;
                    break;
                }
                retries++;
            }
            
            // Fallback: If no placeable shape is found, select a small shape (cells <= 3) which is easier to place
            if (!selectedShape) {
                const easyShapes = SHAPES.filter(s => s.cells.length <= 3);
                selectedShape = easyShapes[Math.floor(Math.random() * easyShapes.length)];
            }
            
            const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
            this.pieces[i] = { shape: selectedShape, color };
            this.renderPieceSlot(i);
        }
        // Check game over after generating
        this.checkGameOver();
    }

    // --- Render a single piece into its slot ---
    renderPieceSlot(index) {
        const slotEl = document.getElementById(`pieceSlot${index}`);
        slotEl.innerHTML = '';
        slotEl.classList.remove('empty', 'slot-unplaceable');

        const piece = this.pieces[index];
        if (!piece) {
            slotEl.classList.add('empty');
            return;
        }

        const { shape, color } = piece;
        let maxR = 0, maxC = 0;
        for (const [r, c] of shape.cells) {
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
        }
        const rows = maxR + 1;
        const cols = maxC + 1;

        const grid = document.createElement('div');
        grid.className = 'piece-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        const cellMap = new Set(shape.cells.map(([r, c]) => `${r},${c}`));

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'piece-cell';
                if (cellMap.has(`${r},${c}`)) {
                    cell.classList.add('filled');
                    cell.style.background = color;
                }
                grid.appendChild(cell);
            }
        }

        slotEl.appendChild(grid);
        slotEl.dataset.pieceIndex = index;
    }

    // --- Drag & Drop system (mouse + touch) ---
    setupDragHandlers() {
        const pieceTray = this.pieceTray;

        // Mouse events
        pieceTray.addEventListener('mousedown', (e) => this.onDragStart(e));
        document.addEventListener('mousemove', (e) => this.onDragMove(e));
        document.addEventListener('mouseup', (e) => this.onDragEnd(e));

        // Touch events
        pieceTray.addEventListener('touchstart', (e) => this.onDragStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.onDragMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.onDragEnd(e));
        document.addEventListener('touchcancel', (e) => this.onDragEnd(e));
    }

    getSlotFromEvent(e) {
        const target = e.target.closest('.piece-slot');
        if (!target || target.classList.contains('empty')) return null;
        return target;
    }

    getPointerPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    onDragStart(e) {
        const slot = this.getSlotFromEvent(e);
        if (!slot) return;

        e.preventDefault();
        const index = parseInt(slot.dataset.pieceIndex);
        const piece = this.pieces[index];
        if (!piece) return;

        soundEffects.play('click');
        this.dragging = true;
        this.dragPieceIndex = index;
        this.dragShape = piece.shape;
        this.dragColor = piece.color;

        // Compute shape bounding box and center
        let maxR = 0, maxC = 0;
        for (const [r, c] of piece.shape.cells) {
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
        }
        this.dragShapeRows = maxR + 1;
        this.dragShapeCols = maxC + 1;
        // Center of the shape (used to align ghost center with pointer)
        this.dragCenterRow = maxR / 2;
        this.dragCenterCol = maxC / 2;

        // Reset preview cache
        this.lastAnchorRow = -1;
        this.lastAnchorCol = -1;

        // Cache coordinates and dimensions to prevent reflow during dragging
        this.cachedBoardRect = this.gameBoardEl.getBoundingClientRect();
        this.cachedCellMetrics = this.getRenderedCellMetrics();

        // Hide piece from slot
        slot.style.opacity = '0.3';

        // Create ghost
        this.createDragGhost(piece);
        const pos = this.getPointerPos(e);
        this.updateGhostPosition(pos.x, pos.y);
        this.dragGhost.classList.remove('hidden');
    }

    createDragGhost(piece) {
        this.dragGhost.innerHTML = '';
        const { shape, color } = piece;
        const cols = this.dragShapeCols;
        const rows = this.dragShapeRows;

        this.dragGhost.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
        this.dragGhost.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;

        const cellMap = new Set(shape.cells.map(([r, c]) => `${r},${c}`));

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'ghost-cell';
                if (cellMap.has(`${r},${c}`)) {
                    cell.style.background = color;
                    cell.classList.add('filled');
                } else {
                    cell.style.background = 'transparent';
                    cell.style.boxShadow = 'none';
                }
                this.dragGhost.appendChild(cell);
            }
        }
    }

    updateGhostPosition(x, y) {
        // Offset upward so the user can see beneath their finger
        const fingerOffset = ('ontouchstart' in window) ? 80 : 30;

        // Use cached metrics for performance optimization
        const cs = this.cachedCellMetrics;

        // Ghost pixel dimensions
        const ghostW = this.dragShapeCols * cs.cellW + (this.dragShapeCols - 1) * cs.gap;
        const ghostH = this.dragShapeRows * cs.cellH + (this.dragShapeRows - 1) * cs.gap;

        // Position ghost so its center aligns with pointer (with finger offset)
        const ghostLeft = x - ghostW / 2;
        const ghostTop = (y - fingerOffset) - ghostH / 2;

        this.dragGhost.style.left = `${ghostLeft}px`;
        this.dragGhost.style.top = `${ghostTop}px`;
        this.dragGhost.style.transform = 'none'; // no CSS translate, we handle it manually
    }

    // Get the actual rendered cell width, height and gap from the board
    getRenderedCellMetrics() {
        // Use the first cell's actual size
        const firstCell = this.cells[0][0];
        const secondCell = this.cells[0][1];
        const r1 = firstCell.getBoundingClientRect();
        const r2 = secondCell.getBoundingClientRect();
        return {
            cellW: r1.width,
            cellH: r1.height,
            gap: r2.left - r1.right
        };
    }

    onDragMove(e) {
        if (!this.dragging) return;
        e.preventDefault();

        const pos = this.getPointerPos(e);
        this.updateGhostPosition(pos.x, pos.y);

        // Determine which board cell the CENTER of the ghost is over
        const fingerOffset = ('ontouchstart' in window) ? 80 : 30;
        const ghostCenterX = pos.x;
        const ghostCenterY = pos.y - fingerOffset;

        // Convert ghost center to an anchor (top-left) row/col on the board
        const anchorPos = this.getAnchorFromGhostCenter(ghostCenterX, ghostCenterY);

        if (anchorPos) {
            // Only update preview if anchor changed (perf optimization)
            if (anchorPos.row !== this.lastAnchorRow || anchorPos.col !== this.lastAnchorCol) {
                this.clearPreview();
                this.showPreview(anchorPos.row, anchorPos.col);
                this.lastAnchorRow = anchorPos.row;
                this.lastAnchorCol = anchorPos.col;
            }
        } else {
            if (this.lastAnchorRow !== -1 || this.lastAnchorCol !== -1) {
                this.clearPreview();
                this.lastAnchorRow = -1;
                this.lastAnchorCol = -1;
            }
        }
    }

    // Convert ghost center position to the anchor (top-left) cell on the board
    getAnchorFromGhostCenter(centerX, centerY) {
        const boardRect = this.cachedBoardRect;
        const cs = this.cachedCellMetrics;
        const step = cs.cellW + cs.gap;

        // The center of the ghost corresponds to the center of the shape
        // Shape center in grid units: (dragCenterRow, dragCenterCol)
        // So we need to find which cell the center maps to, then subtract the shape center offset

        const relX = centerX - boardRect.left;
        const relY = centerY - boardRect.top;

        // Which cell is the center of the shape over?
        const centerCol = relX / step;
        const centerRow = relY / step;

        // Anchor = center position - shape center offset
        const anchorCol = Math.round(centerCol - this.dragCenterCol);
        const anchorRow = Math.round(centerRow - this.dragCenterRow);

        // Check if the anchor is somewhat reasonable (shape might extend outside)
        if (anchorRow < -(this.dragShapeRows) || anchorRow >= BOARD_SIZE + this.dragShapeRows) return null;
        if (anchorCol < -(this.dragShapeCols) || anchorCol >= BOARD_SIZE + this.dragShapeCols) return null;

        return { row: anchorRow, col: anchorCol };
    }

    onDragEnd(e) {
        if (!this.dragging) return;

        // Use last cached anchor position for placement (more reliable than end position)
        const anchorRow = this.lastAnchorRow;
        const anchorCol = this.lastAnchorCol;

        // Try to place
        if (anchorRow >= 0 && anchorCol >= 0 && this.canPlace(anchorRow, anchorCol, this.dragShape)) {
            this.placePiece(anchorRow, anchorCol, this.dragShape, this.dragColor);
            soundEffects.play('place');
            triggerVibration(15);
            this.pieces[this.dragPieceIndex] = null;
            this.renderPieceSlot(this.dragPieceIndex);
            this.piecesUsed++;

            // Check line clears
            setTimeout(() => {
                this.checkAndClearLines();

                // If all 3 pieces used, generate new set
                if (this.piecesUsed >= 3) {
                    setTimeout(() => this.generatePieces(), 300);
                } else {
                    this.checkGameOver();
                }
            }, 50);
        } else {
            // Restore slot visibility
            soundEffects.play('click');
            const slot = document.getElementById(`pieceSlot${this.dragPieceIndex}`);
            if (slot) slot.style.opacity = '1';
        }

        // Clean up
        this.clearPreview();
        this.dragGhost.classList.add('hidden');
        this.dragging = false;
        this.dragPieceIndex = -1;
        this.dragShape = null;
        this.dragColor = '';
        this.lastAnchorRow = -1;
        this.lastAnchorCol = -1;
    }

    // --- Placement logic ---
    canPlace(row, col, shape) {
        for (const [dr, dc] of shape.cells) {
            const r = row + dr;
            const c = col + dc;
            if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
            if (this.board[r][c] !== null) return false;
        }
        return true;
    }

    placePiece(row, col, shape, color) {
        for (const [dr, dc] of shape.cells) {
            const r = row + dr;
            const c = col + dc;
            this.board[r][c] = color;
            const cell = this.cells[r][c];
            cell.classList.add('filled', 'just-placed');
            cell.style.background = color;
            setTimeout(() => cell.classList.remove('just-placed'), 350);
        }

        // Score for placing
        const placePoints = shape.cells.length;
        this.addScore(placePoints);

        // Restore slot opacity
        const slot = document.getElementById(`pieceSlot${this.dragPieceIndex}`);
        if (slot) slot.style.opacity = '1';
    }

    // --- Preview (hover highlight + line-clear glow) ---
    showPreview(row, col) {
        const valid = this.canPlace(row, col, this.dragShape);

        // Show piece cells preview
        for (const [dr, dc] of this.dragShape.cells) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                const cell = this.cells[r][c];
                cell.classList.add(valid ? 'preview-valid' : 'preview-invalid');
                this.lastPreviewCells.push(cell);
            }
        }

        // If valid placement, check which lines would clear and glow them
        if (valid) {
            this.showWillClearPreview(row, col);
        }
    }

    // Simulate placement and highlight rows/columns that would be completed
    showWillClearPreview(row, col) {
        // Create a temporary board copy with the piece placed
        const tempBoard = this.board.map(r => [...r]);
        for (const [dr, dc] of this.dragShape.cells) {
            tempBoard[row + dr][col + dc] = this.dragColor;
        }

        // Find rows and columns that would be full
        const clearRows = [];
        const clearCols = [];

        for (let r = 0; r < BOARD_SIZE; r++) {
            let full = true;
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (tempBoard[r][c] === null) { full = false; break; }
            }
            if (full) clearRows.push(r);
        }

        for (let c = 0; c < BOARD_SIZE; c++) {
            let full = true;
            for (let r = 0; r < BOARD_SIZE; r++) {
                if (tempBoard[r][c] === null) { full = false; break; }
            }
            if (full) clearCols.push(c);
        }

        // If any lines will clear, highlight ALL cells in those lines
        if (clearRows.length === 0 && clearCols.length === 0) return;

        const willClearSet = new Set();
        for (const r of clearRows) {
            for (let c = 0; c < BOARD_SIZE; c++) willClearSet.add(`${r},${c}`);
        }
        for (const c of clearCols) {
            for (let r = 0; r < BOARD_SIZE; r++) willClearSet.add(`${r},${c}`);
        }

        for (const key of willClearSet) {
            const [r, c] = key.split(',').map(Number);
            const cell = this.cells[r][c];
            cell.classList.add('preview-will-clear');
            // Set currentColor for the glow based on the cell's actual or preview color
            const cellColor = this.board[r][c] || this.dragColor;
            cell.style.color = cellColor;
            this.lastWillClearCells.push(cell);
        }
    }

    clearPreview() {
        for (const cell of this.lastPreviewCells) {
            cell.classList.remove('preview-valid', 'preview-invalid');
        }
        this.lastPreviewCells = [];

        for (const cell of this.lastWillClearCells) {
            cell.classList.remove('preview-will-clear');
            cell.style.color = '';
        }
        this.lastWillClearCells = [];
    }

    // --- Line clearing ---
    checkAndClearLines() {
        const rowsToClear = [];
        const colsToClear = [];

        for (let r = 0; r < BOARD_SIZE; r++) {
            let full = true;
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.board[r][c] === null) { full = false; break; }
            }
            if (full) rowsToClear.push(r);
        }

        for (let c = 0; c < BOARD_SIZE; c++) {
            let full = true;
            for (let r = 0; r < BOARD_SIZE; r++) {
                if (this.board[r][c] === null) { full = false; break; }
            }
            if (full) colsToClear.push(c);
        }

        const totalLines = rowsToClear.length + colsToClear.length;
        if (totalLines === 0) {
            this.streak = 0; // reset streak if no lines cleared in this turn
            return;
        }

        if (totalLines >= 2) {
            soundEffects.play('combo');
            triggerVibration(50);
        } else {
            soundEffects.play('clear');
            triggerVibration(30);
        }

        const toClear = new Set();
        for (const r of rowsToClear) {
            for (let c = 0; c < BOARD_SIZE; c++) toClear.add(`${r},${c}`);
        }
        for (const c of colsToClear) {
            for (let r = 0; r < BOARD_SIZE; r++) toClear.add(`${r},${c}`);
        }

        // Board flash
        this.boardWrapper.classList.add('line-flash');
        setTimeout(() => this.boardWrapper.classList.remove('line-flash'), 300);

        // Animate clearing
        for (const key of toClear) {
            const [r, c] = key.split(',').map(Number);
            this.cells[r][c].classList.add('clearing');
        }

        // Clear logic immediately so game-over and valid placement detection are instantly correct
        for (const key of toClear) {
            const [r, c] = key.split(',').map(Number);
            this.board[r][c] = null;
        }

        // Streak counting
        this.streak++;

        // Score: base line points + combo bonus + streak bonus
        const linePoints = toClear.size;
        const comboMultiplier = totalLines;
        const basePoints = linePoints * comboMultiplier;

        let totalPoints = basePoints;
        if (this.streak > 1) {
            const streakMultiplier = 1 + (this.streak - 1) * 0.5;
            totalPoints = Math.floor(basePoints * streakMultiplier);
            
            // Show streak text popup
            setTimeout(() => {
                this.showStreakText(this.streak);
            }, 250);
        }

        this.addScore(totalPoints);

        if (totalLines >= 2) {
            this.showComboText(totalLines);
        }

        this.showScorePopup(`+${totalPoints}`);

        // Actually clear visuals after animation
        setTimeout(() => {
            for (const key of toClear) {
                const [r, c] = key.split(',').map(Number);
                this.cells[r][c].classList.remove('filled', 'clearing');
                this.cells[r][c].style.background = '';
            }
        }, 450);
    }

    // --- Score ---
    addScore(points) {
        this.score += points;
        this.updateScoreDisplay();
        this.checkThemeThresholds();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('blockblast_highscore', this.highScore.toString());
            this.highScoreValueEl.textContent = this.highScore;
        }
    }

    updateScoreDisplay() {
        this.scoreValueEl.textContent = this.score;
        this.scoreValueEl.classList.remove('pop');
        void this.scoreValueEl.offsetWidth;
        this.scoreValueEl.classList.add('pop');
    }

    showScorePopup(text) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = text;
        const boardRect = this.gameBoardEl.getBoundingClientRect();
        popup.style.left = `${boardRect.left + boardRect.width / 2}px`;
        popup.style.top = `${boardRect.top + boardRect.height / 2}px`;
        popup.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }

    showComboText(lines) {
        const texts = ['', '', 'DOUBLE! 🔥', 'TRIPLE! 💥', 'QUAD! ⚡', 'MEGA! 🌟'];
        const text = texts[Math.min(lines, texts.length - 1)] || `${lines}x COMBO! 🌟`;

        const el = document.createElement('div');
        el.className = 'combo-text';
        el.textContent = text;
        const boardRect = this.gameBoardEl.getBoundingClientRect();
        el.style.left = `${boardRect.left + boardRect.width / 2}px`;
        el.style.top = `${boardRect.top + boardRect.height / 3}px`;
        el.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }

    showStreakText(streak) {
        const el = document.createElement('div');
        el.className = 'streak-text';
        el.textContent = `SERİ x${streak}! 🔥`;
        const boardRect = this.gameBoardEl.getBoundingClientRect();
        el.style.left = `${boardRect.left + boardRect.width / 2}px`;
        el.style.top = `${boardRect.top + boardRect.height * 0.6}px`;
        el.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }

    // --- Themes ---
    checkThemeThresholds() {
        let newTheme = 'default';
        if (this.score >= 1000) {
            newTheme = 'cosmic';
        } else if (this.score >= 500) {
            newTheme = 'sunset';
        } else if (this.score >= 250) {
            newTheme = 'cyberpunk';
        }

        if (this.currentTheme !== newTheme) {
            this.setTheme(newTheme, true);
        }
    }

    setTheme(themeName, showNotification = true) {
        this.currentTheme = themeName;
        document.body.classList.remove('theme-cyberpunk', 'theme-sunset', 'theme-cosmic');
        
        let displayTitle = '';
        let flashColor = '';
        if (themeName === 'cyberpunk') {
            document.body.classList.add('theme-cyberpunk');
            displayTitle = "CYBERPUNK TEMA! 🌆";
            flashColor = 'rgba(255, 0, 127, 0.4)';
            if (window.bgParticleSystem) {
                window.bgParticleSystem.setThemeColors(300, 340);
            }
        } else if (themeName === 'sunset') {
            document.body.classList.add('theme-sunset');
            displayTitle = "SUNSET TEMA! 🌅";
            flashColor = 'rgba(255, 145, 0, 0.4)';
            if (window.bgParticleSystem) {
                window.bgParticleSystem.setThemeColors(15, 45);
            }
        } else if (themeName === 'cosmic') {
            document.body.classList.add('theme-cosmic');
            displayTitle = "COSMIC TEMA! 🌌";
            flashColor = 'rgba(0, 230, 118, 0.4)';
            if (window.bgParticleSystem) {
                window.bgParticleSystem.setThemeColors(160, 260);
            }
        } else {
            // Default
            displayTitle = "CLASSIC TEMA! 🌌";
            flashColor = 'rgba(255, 255, 255, 0.25)';
            if (window.bgParticleSystem) {
                window.bgParticleSystem.setThemeColors(null);
            }
        }

        if (showNotification) {
            this.flashScreen(flashColor);
            this.showThemeNotification(displayTitle);
            soundEffects.play('combo'); // play sound on theme transition
        }
    }

    flashScreen(color) {
        const oldFlash = document.querySelector('.screen-flash');
        if (oldFlash) oldFlash.remove();

        const el = document.createElement('div');
        el.className = 'screen-flash';
        el.style.backgroundColor = color;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 400);
    }

    showThemeNotification(text) {
        // Clear any existing notifications
        const oldNotify = document.querySelector('.theme-notification');
        if (oldNotify) oldNotify.remove();

        const el = document.createElement('div');
        el.className = 'theme-notification';
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1800);
    }

    // --- Game Over detection ---
    checkGameOver() {
        let anyPlaceable = false;
        let activePiecesCount = 0;

        for (let i = 0; i < 3; i++) {
            const piece = this.pieces[i];
            if (!piece) continue;
            activePiecesCount++;
            if (this.canPlaceAnywhere(piece.shape)) {
                anyPlaceable = true;
            }
        }

        if (activePiecesCount > 0 && !anyPlaceable) {
            // Highlight unplaceable pieces with shake and red glow
            for (let i = 0; i < 3; i++) {
                const piece = this.pieces[i];
                if (!piece) continue;
                if (!this.canPlaceAnywhere(piece.shape)) {
                    const slot = document.getElementById(`pieceSlot${i}`);
                    if (slot) {
                        slot.classList.add('slot-unplaceable');
                    }
                }
            }
            // Wait 2 seconds before showing game over screen so player sees what failed
            setTimeout(() => this.gameOver(), 2000);
        }
    }

    canPlaceAnywhere(shape) {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.canPlace(r, c, shape)) return true;
            }
        }
        return false;
    }

    gameOver() {
        soundEffects.play('gameover');
        triggerVibration(100);
        this.gameOverScoreEl.textContent = this.score;
        this.gameOverBestEl.textContent = this.highScore;
        this.gameOverOverlay.classList.remove('hidden');
    }

    // --- Button handlers ---
    setupButtons() {
        document.getElementById('playBtn').addEventListener('click', () => {
            soundEffects.play('click');
            this.showGame();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            soundEffects.play('click');
            this.startGame();
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            soundEffects.play('click');
            this.showIntro();
        });

        document.getElementById('gameBackBtn').addEventListener('click', () => {
            soundEffects.play('click');
            this.showIntro();
        });
    }

    showGame() {
        this.introScreen.classList.add('fade-out');
        setTimeout(() => {
            this.introScreen.classList.add('hidden');
            this.introScreen.classList.remove('fade-out');
            this.gameScreen.classList.remove('hidden');
            this.startGame();
        }, 400);
    }

    showIntro() {
        this.gameScreen.classList.add('hidden');
        this.gameOverOverlay.classList.add('hidden');
        this.introScreen.classList.remove('hidden');
    }
}


// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Background effects
    new ParticleBackground(document.getElementById('bgCanvas'));
    new FloatingBlocksManager(document.getElementById('floatingBlocks'));

    // Intro preview board
    new PreviewBoardAnimation(document.getElementById('previewBoard'));

    // Modal
    new ModalManager();

    // Game engine
    new BlockBlastGame();

    // Prevent context menu on game elements
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.play-btn, .link-btn, .piece-slot, .game-cell, .game-board')) {
            e.preventDefault();
        }
    });
});
