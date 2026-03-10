<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>E-Commerce Platform</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0a0a0f;
    --surface: #12121a;
    --card: #1a1a26;
    --border: #2a2a3d;
    --accent: #6c63ff;
    --accent2: #ff6584;
    --accent3: #43e97b;
    --text: #e8e8f0;
    --muted: #6b6b8a;
  }

- { margin: 0; padding: 0; box-sizing: border-box; }

body {
font-family: 'DM Mono', monospace;
background: var(--bg);
color: var(--text);
min-height: 100vh;
overflow-x: hidden;
}

/_ Animated grid background _/
body::before {
content: '';
position: fixed;
inset: 0;
background-image:
linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px),
linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px);
background-size: 48px 48px;
pointer-events: none;
z-index: 0;
}

/_ Floating orbs _/
.orb {
position: fixed;
border-radius: 50%;
filter: blur(80px);
opacity: 0.18;
pointer-events: none;
z-index: 0;
animation: drift 12s ease-in-out infinite alternate;
}
.orb1 { width: 500px; height: 500px; background: var(--accent); top: -150px; left: -100px; animation-duration: 14s; }
.orb2 { width: 350px; height: 350px; background: var(--accent2); bottom: 10%; right: -80px; animation-duration: 10s; animation-delay: -4s; }
.orb3 { width: 280px; height: 280px; background: var(--accent3); top: 50%; left: 40%; animation-duration: 18s; animation-delay: -7s; }

@keyframes drift {
from { transform: translate(0, 0) scale(1); }
to { transform: translate(30px, 40px) scale(1.05); }
}

.container {
max-width: 820px;
margin: 0 auto;
padding: 60px 24px 100px;
position: relative;
z-index: 1;
}

/_ ─── HERO ─── _/
.hero {
text-align: center;
padding: 60px 0 48px;
opacity: 0;
transform: translateY(30px);
animation: fadeUp 0.8s ease forwards;
}

.hero-icon {
font-size: 3.2rem;
display: inline-block;
animation: bounce 2.4s ease-in-out infinite;
margin-bottom: 20px;
}
@keyframes bounce {
0%,100% { transform: translateY(0); }
50% { transform: translateY(-10px); }
}

h1 {
font-family: 'Syne', sans-serif;
font-size: clamp(2.2rem, 6vw, 3.6rem);
font-weight: 800;
letter-spacing: -0.03em;
background: linear-gradient(135deg, #fff 30%, var(--accent) 70%, var(--accent2));
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
line-height: 1.1;
margin-bottom: 14px;
}

.tagline {
font-size: 0.95rem;
color: var(--muted);
letter-spacing: 0.04em;
max-width: 420px;
margin: 0 auto 28px;
line-height: 1.7;
}

/_ Badges _/
.badges {
display: flex;
gap: 10px;
justify-content: center;
flex-wrap: wrap;
margin-bottom: 8px;
}
.badge {
padding: 5px 14px;
border-radius: 99px;
font-size: 0.72rem;
font-weight: 500;
letter-spacing: 0.05em;
border: 1px solid;
animation: pulse-border 3s ease-in-out infinite;
}
.badge-ts { color: #60a5fa; border-color: #60a5fa44; background: #60a5fa0d; }
.badge-lic { color: #4ade80; border-color: #4ade8044; background: #4ade800d; }
.badge-ver { color: #c084fc; border-color: #c084fc44; background: #c084fc0d; }

@keyframes pulse-border {
0%,100% { box-shadow: 0 0 0 0 transparent; }
50% { box-shadow: 0 0 0 3px rgba(108,99,255,0.12); }
}

/_ ─── SECTION ─── _/
.section {
margin-top: 52px;
opacity: 0;
transform: translateY(24px);
animation: fadeUp 0.7s ease forwards;
}
.section:nth-child(2) { animation-delay: 0.15s; }
.section:nth-child(3) { animation-delay: 0.25s; }
.section:nth-child(4) { animation-delay: 0.35s; }
.section:nth-child(5) { animation-delay: 0.45s; }
.section:nth-child(6) { animation-delay: 0.55s; }

@keyframes fadeUp {
to { opacity: 1; transform: translateY(0); }
}

.section-label {
font-family: 'Syne', sans-serif;
font-size: 0.65rem;
letter-spacing: 0.18em;
text-transform: uppercase;
color: var(--accent);
margin-bottom: 16px;
display: flex;
align-items: center;
gap: 10px;
}
.section-label::after {
content: '';
flex: 1;
height: 1px;
background: linear-gradient(90deg, var(--border), transparent);
}

.section-title {
font-family: 'Syne', sans-serif;
font-size: 1.35rem;
font-weight: 700;
color: #fff;
margin-bottom: 20px;
}

/_ ─── FEATURE GRID ─── _/
.features {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
gap: 14px;
}

.feature-card {
background: var(--card);
border: 1px solid var(--border);
border-radius: 14px;
padding: 20px;
transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
cursor: default;
}
.feature-card:hover {
transform: translateY(-4px);
border-color: var(--accent);
box-shadow: 0 12px 40px rgba(108,99,255,0.15);
}
.feature-icon { font-size: 1.5rem; margin-bottom: 10px; display: block; }
.feature-title { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; color: #fff; margin-bottom: 5px; }
.feature-desc { font-size: 0.72rem; color: var(--muted); line-height: 1.6; }

/_ ─── TECH STACK ─── _/
.stack {
display: flex;
flex-wrap: wrap;
gap: 10px;
}
.stack-pill {
background: var(--card);
border: 1px solid var(--border);
border-radius: 10px;
padding: 10px 18px;
font-size: 0.78rem;
color: var(--text);
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s ease;
}
.stack-pill:hover {
border-color: var(--accent);
background: rgba(108,99,255,0.1);
transform: scale(1.04);
}
.stack-pill span { font-size: 1.1rem; }

/_ ─── CODE BLOCK ─── _/
.code-block {
background: var(--surface);
border: 1px solid var(--border);
border-radius: 14px;
overflow: hidden;
}
.code-header {
padding: 12px 18px;
border-bottom: 1px solid var(--border);
display: flex;
align-items: center;
gap: 8px;
}
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-r { background: #ff5f57; }
.dot-y { background: #febc2e; }
.dot-g { background: #28c840; }
.code-label { font-size: 0.7rem; color: var(--muted); margin-left: auto; letter-spacing: 0.1em; }
.code-body {
padding: 20px 22px;
font-size: 0.8rem;
line-height: 1.9;
color: #c9d1d9;
}
.code-body .cmd { color: #79c0ff; }
.code-body .cmt { color: #6b6b8a; }
.code-body .str { color: #a5d6ff; }

/_ ─── MODULE TREE ─── _/
.tree {
background: var(--surface);
border: 1px solid var(--border);
border-radius: 14px;
padding: 24px;
font-size: 0.78rem;
line-height: 2;
}
.tree .folder { color: #79c0ff; font-family: 'Syne', sans-serif; font-weight: 700; }
.tree .module { color: var(--accent2); }
.tree .desc { color: var(--muted); font-size: 0.7rem; }

/_ ─── API TABLE ─── _/
.api-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
.api-table th {
text-align: left;
color: var(--muted);
font-weight: 400;
font-size: 0.68rem;
letter-spacing: 0.1em;
text-transform: uppercase;
padding: 10px 14px;
border-bottom: 1px solid var(--border);
}
.api-table td { padding: 11px 14px; border-bottom: 1px solid rgba(42,42,61,0.5); }
.api-table tr:last-child td { border-bottom: none; }
.api-table tr:hover td { background: rgba(108,99,255,0.05); }

.method {
display: inline-block;
padding: 2px 9px;
border-radius: 6px;
font-size: 0.65rem;
font-weight: 700;
letter-spacing: 0.06em;
}
.GET { background: #1a4a2e; color: #4ade80; }
.POST { background: #1e3a5f; color: #60a5fa; }
.PUT { background: #3d2f0d; color: #fbbf24; }
.DELETE { background: #3d1515; color: #f87171; }

.endpoint { color: #c084fc; font-family: 'DM Mono', monospace; }

/_ ─── QUICK START ─── _/
.steps { display: flex; flex-direction: column; gap: 14px; }
.step {
display: flex;
gap: 18px;
align-items: flex-start;
background: var(--card);
border: 1px solid var(--border);
border-radius: 14px;
padding: 18px 20px;
transition: border-color 0.2s ease;
}
.step:hover { border-color: rgba(108,99,255,0.5); }
.step-num {
font-family: 'Syne', sans-serif;
font-size: 1.4rem;
font-weight: 800;
color: var(--accent);
opacity: 0.4;
min-width: 30px;
line-height: 1;
margin-top: 2px;
}
.step-content h4 { font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 4px; }
.step-content p { font-size: 0.75rem; color: var(--muted); line-height: 1.6; }
.step-content code {
background: rgba(108,99,255,0.12);
border: 1px solid rgba(108,99,255,0.25);
border-radius: 5px;
padding: 1px 7px;
font-size: 0.72rem;
color: #c084fc;
font-family: 'DM Mono', monospace;
}

/_ ─── FOOTER ─── _/
.footer {
text-align: center;
margin-top: 70px;
padding-top: 36px;
border-top: 1px solid var(--border);
font-size: 0.75rem;
color: var(--muted);
line-height: 2;
}
.footer a { color: var(--accent); text-decoration: none; }
.footer a:hover { text-decoration: underline; }
.star-cta {
display: inline-block;
margin-top: 16px;
padding: 10px 28px;
background: linear-gradient(135deg, var(--accent), var(--accent2));
border-radius: 99px;
font-family: 'Syne', sans-serif;
font-weight: 700;
font-size: 0.8rem;
color: #fff;
letter-spacing: 0.05em;
text-decoration: none;
transition: transform 0.2s ease, box-shadow 0.2s ease;
box-shadow: 0 4px 20px rgba(108,99,255,0.35);
}
.star-cta:hover {
transform: translateY(-2px);
box-shadow: 0 8px 30px rgba(108,99,255,0.5);
text-decoration: none;
}
</style>

</head>
<body>

<div class="orb orb1"></div>
<div class="orb orb2"></div>
<div class="orb orb3"></div>

<div class="container">

  <!-- HERO -->
  <div class="hero">
    <div class="hero-icon">🛒</div>
    <h1>E-Commerce Platform</h1>
    <p class="tagline">A modular, scalable backend built with TypeScript, Express & Prisma — ready to power your next online store.</p>
    <div class="badges">
      <span class="badge badge-ts">TypeScript 98%</span>
      <span class="badge badge-lic">Apache 2.0</span>
      <span class="badge badge-ver">Node v16+</span>
    </div>
  </div>

  <!-- FEATURES -->
  <div class="section">
    <div class="section-label">What's inside</div>
    <div class="section-title">Key Features</div>
    <div class="features">
      <div class="feature-card">
        <span class="feature-icon">🔐</span>
        <div class="feature-title">Auth & JWT</div>
        <div class="feature-desc">Secure login, registration, and token-based sessions.</div>
      </div>
      <div class="feature-card">
        <span class="feature-icon">🛍️</span>
        <div class="feature-title">Product Catalog</div>
        <div class="feature-desc">Full CRUD for products, categories, and inventory.</div>
      </div>
      <div class="feature-card">
        <span class="feature-icon">🛒</span>
        <div class="feature-title">Shopping Cart</div>
        <div class="feature-desc">Persistent cart with live session management.</div>
      </div>
      <div class="feature-card">
        <span class="feature-icon">📦</span>
        <div class="feature-title">Order Lifecycle</div>
        <div class="feature-desc">Full order creation, tracking, and management.</div>
      </div>
      <div class="feature-card">
        <span class="feature-icon">💳</span>
        <div class="feature-title">Payment Ready</div>
        <div class="feature-desc">Prepared for seamless payment gateway integration.</div>
      </div>
      <div class="feature-card">
        <span class="feature-icon">🔍</span>
        <div class="feature-title">Search & Filter</div>
        <div class="feature-desc">Advanced product discovery with efficient queries.</div>
      </div>
    </div>
  </div>

  <!-- TECH STACK -->
  <div class="section">
    <div class="section-label">Built with</div>
    <div class="section-title">Tech Stack</div>
    <div class="stack">
      <div class="stack-pill"><span>🟢</span> Node.js</div>
      <div class="stack-pill"><span>🔷</span> TypeScript</div>
      <div class="stack-pill"><span>⚡</span> Express.js</div>
      <div class="stack-pill"><span>🔺</span> Prisma ORM</div>
      <div class="stack-pill"><span>🐘</span> PostgreSQL / MySQL / SQLite</div>
      <div class="stack-pill"><span>🔑</span> JWT Auth</div>
    </div>
  </div>

  <!-- QUICK START -->
  <div class="section">
    <div class="section-label">Get going</div>
    <div class="section-title">Quick Start</div>
    <div class="steps">
      <div class="step">
        <div class="step-num">01</div>
        <div class="step-content">
          <h4>Clone & Install</h4>
          <p><code>git clone https://github.com/Mazen-Haytham/E-commerce.git</code> then run <code>npm install</code></p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">02</div>
        <div class="step-content">
          <h4>Configure Environment</h4>
          <p>Create a <code>.env</code> file with your <code>DATABASE_URL</code>, <code>JWT_SECRET</code>, and <code>PORT</code>.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">03</div>
        <div class="step-content">
          <h4>Setup Database</h4>
          <p>Run <code>npx prisma generate</code> then <code>npx prisma migrate dev</code> to initialise your DB.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">04</div>
        <div class="step-content">
          <h4>Launch 🚀</h4>
          <p>Run <code>npm run dev</code> — server starts on <code>http://localhost:3000</code></p>
        </div>
      </div>
    </div>
  </div>

  <!-- ENV VARS -->
  <div class="section">
    <div class="section-label">Configuration</div>
    <div class="section-title">Environment Variables</div>
    <div class="code-block">
      <div class="code-header">
        <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
        <span class="code-label">.env</span>
      </div>
      <div class="code-body">
        <span class="cmt"># Database</span><br>
        <span class="cmd">DATABASE_URL</span>=<span class="str">"postgresql://user:password@localhost:5432/ecommerce"</span><br><br>
        <span class="cmt"># Server</span><br>
        <span class="cmd">PORT</span>=<span class="str">3000</span><br>
        <span class="cmd">NODE_ENV</span>=<span class="str">development</span><br><br>
        <span class="cmt"># Auth</span><br>
        <span class="cmd">JWT_SECRET</span>=<span class="str">your_secret_key</span><br>
        <span class="cmd">JWT_EXPIRES_IN</span>=<span class="str">7d</span>
      </div>
    </div>
  </div>

  <!-- ARCHITECTURE -->
  <div class="section">
    <div class="section-label">Structure</div>
    <div class="section-title">Module Architecture</div>
    <div class="tree">
      <div><span class="folder">src/</span></div>
      <div>&nbsp;&nbsp;├── <span class="folder">modules/</span></div>
      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span class="module">auth/</span>&nbsp;&nbsp;&nbsp;<span class="desc">Authentication & JWT</span></div>
      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span class="module">users/</span>&nbsp;&nbsp;<span class="desc">User profiles & accounts</span></div>
      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span class="module">products/</span>&nbsp;<span class="desc">Product catalog & search</span></div>
      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span class="module">orders/</span>&nbsp;&nbsp;<span class="desc">Order lifecycle</span></div>
      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span class="module">cart/</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="desc">Shopping cart & sessions</span></div>
      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── <span class="module">payments/</span>&nbsp;<span class="desc">Payment processing</span></div>
      <div>&nbsp;&nbsp;├── <span class="folder">shared/</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="desc">Shared utilities & types</span></div>
      <div>&nbsp;&nbsp;└── <span class="folder">infrastructure/</span>&nbsp;<span class="desc">Cross-cutting concerns</span></div>
    </div>
  </div>

  <!-- API -->
  <div class="section">
    <div class="section-label">REST API</div>
    <div class="section-title">Endpoints  <span style="font-size:0.75rem;color:var(--muted);font-weight:400;">Base: /api/v1</span></div>
    <div class="code-block">
      <div class="code-header">
        <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
        <span class="code-label">Routes</span>
      </div>
      <table class="api-table" style="margin:0;">
        <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="method POST">POST</span></td><td class="endpoint">/auth/register</td><td>Register new user</td></tr>
          <tr><td><span class="method POST">POST</span></td><td class="endpoint">/auth/login</td><td>User login</td></tr>
          <tr><td><span class="method GET">GET</span></td><td class="endpoint">/auth/me</td><td>Current user</td></tr>
          <tr><td><span class="method GET">GET</span></td><td class="endpoint">/products</td><td>List all products</td></tr>
          <tr><td><span class="method POST">POST</span></td><td class="endpoint">/products</td><td>Create product</td></tr>
          <tr><td><span class="method PUT">PUT</span></td><td class="endpoint">/products/:id</td><td>Update product</td></tr>
          <tr><td><span class="method DELETE">DELETE</span></td><td class="endpoint">/products/:id</td><td>Delete product</td></tr>
          <tr><td><span class="method GET">GET</span></td><td class="endpoint">/orders</td><td>List all orders</td></tr>
          <tr><td><span class="method POST">POST</span></td><td class="endpoint">/orders</td><td>Create order</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div>Built by <a href="https://github.com/Mazen-Haytham">Mazen Haytham</a> &nbsp;·&nbsp; Apache 2.0 License</div>
    <div><a href="https://github.com/Mazen-Haytham/E-commerce" class="star-cta">⭐ Star on GitHub</a></div>
  </div>

</div>
</body>
</html>
