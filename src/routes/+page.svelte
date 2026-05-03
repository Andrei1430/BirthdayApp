<svelte:head>
	<title>🎉 You're Invited · May 16, 2026</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';

	// ── Types ──────────────────────────────────────────────────────────
	type Response = 'yes' | 'yes+1' | 'no';
	interface Participant {
		id: string;
		name: string;
		plusOneName: string | null;
		response: Response;
		timestamp: string;
	}

	// ── Countdown ──────────────────────────────────────────────────────
	const TARGET = new Date('2026-05-16T00:00:00');
	let days = $state('13');
	let hours = $state('00');
	let minutes = $state('00');
	let seconds = $state('00');
	let partyStarted = $state(false);

	function pad(n: number, len = 2) {
		return String(n).padStart(len, '0');
	}

	function tick() {
		const diff = TARGET.getTime() - Date.now();
		if (diff <= 0) {
			partyStarted = true;
			return;
		}
		const totalSecs = Math.floor(diff / 1000);
		const totalMins = Math.floor(totalSecs / 60);
		const totalHrs = Math.floor(totalMins / 60);
		const totalDays = Math.floor(totalHrs / 24);
		days = pad(totalDays);
		hours = pad(totalHrs % 24);
		minutes = pad(totalMins % 60);
		seconds = pad(totalSecs % 60);
	}

	// ── Nav / drawer ───────────────────────────────────────────────────
	let drawerOpen = $state(false);

	$effect(() => {
		document.body.style.overflow = drawerOpen ? 'hidden' : '';
	});

	// ── Participants ───────────────────────────────────────────────────
	let participants = $state<Participant[]>([]);

	async function loadParticipants() {
		try {
			const res = await fetch('/api/rsvp');
			participants = await res.json();
		} catch {
			/* noop */
		}
	}

	// ── Dialog ─────────────────────────────────────────────────────────
	let dialogOpen = $state(false);
	let dialogSuccess = $state(false);
	let currentResponse = $state<Response>('yes');
	let nameInput = $state('');
	let plusOneInput = $state('');
	let submitting = $state(false);

	const DIALOG_INFO: Record<Response, { emoji: string; title: string; sub: string; successMsg: string }> = {
		yes: {
			emoji: '🎉',
			title: "You're coming!",
			sub: "I can't wait to see you — fill in your name!",
			successMsg: 'See you there! 🎊'
		},
		'yes+1': {
			emoji: '🎉🎉',
			title: 'Double the fun!',
			sub: "Bringing someone along? Amazing — let me know who!",
			successMsg: 'Two tickets to paradise! 🎊'
		},
		no: {
			emoji: '😢',
			title: 'Oh no...',
			sub: "I'll miss you! At least let me know who won't be there.",
			successMsg: "I'll miss you 💔"
		}
	};

	function openDialog(r: Response) {
		currentResponse = r;
		nameInput = '';
		plusOneInput = '';
		dialogSuccess = false;
		dialogOpen = true;
	}

	function closeDialog() {
		if (submitting) return;
		dialogOpen = false;
	}

	async function submitRsvp(e: Event) {
		e.preventDefault();
		if (!nameInput.trim() || submitting) return;
		submitting = true;
		try {
			const res = await fetch('/api/rsvp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: nameInput,
					plusOneName: plusOneInput || null,
					response: currentResponse
				})
			});
			if (res.ok) {
				dialogSuccess = true;
				await loadParticipants();
				setTimeout(() => {
					dialogOpen = false;
					dialogSuccess = false;
				}, 2200);
			}
		} finally {
			submitting = false;
		}
	}

	// ── Particles canvas ───────────────────────────────────────────────
	let canvasEl: HTMLCanvasElement;

	onMount(() => {
		tick();
		const timer = setInterval(tick, 1000);
		loadParticipants();

		const canvas = canvasEl;
		const ctx = canvas.getContext('2d')!;
		let W = 0, H = 0, rafId: number;

		interface Dot { x:number;y:number;sz:number;spd:number;op:number;col:string;dr:number;tw:number;reset(i?:boolean):void;step():void;paint():void; }

		function makeDot(): Dot {
			const d: Dot = {
				x:0,y:0,sz:0,spd:0,op:0,col:'',dr:0,tw:0,
				reset(init=false){
					this.x=Math.random()*W; this.y=init?Math.random()*H:H+5;
					this.sz=Math.random()*1.8+0.35; this.spd=Math.random()*0.55+0.15;
					this.col=Math.random()>.5?'#FF653F':'#FFC85C';
					this.dr=(Math.random()-.5)*0.3; this.tw=Math.random()*Math.PI*2; this.op=0.4;
				},
				step(){
					this.y-=this.spd; this.x+=this.dr; this.tw+=0.035;
					this.op=0.18+Math.abs(Math.sin(this.tw))*0.55;
					if(this.y<-5) this.reset();
				},
				paint(){
					ctx.save(); ctx.globalAlpha=this.op; ctx.fillStyle=this.col;
					ctx.shadowBlur=this.sz*7; ctx.shadowColor=this.col;
					ctx.beginPath(); ctx.arc(this.x,this.y,this.sz,0,Math.PI*2); ctx.fill(); ctx.restore();
				}
			};
			return d;
		}

		const resize=()=>{ W=canvas.width=canvas.offsetWidth; H=canvas.height=canvas.offsetHeight; };
		resize();
		window.addEventListener('resize', resize);

		const dots=Array.from({length:100},()=>{ const d=makeDot(); d.reset(true); return d; });
		const loop=()=>{ ctx.clearRect(0,0,W,H); dots.forEach(d=>{d.step();d.paint();}); rafId=requestAnimationFrame(loop); };
		loop();

		const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in');}),{threshold:0.08});
		document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

		return ()=>{ clearInterval(timer); cancelAnimationFrame(rafId); window.removeEventListener('resize',resize); io.disconnect(); };
	});

	// ── Derived participants ───────────────────────────────────────────
	const attending = $derived(participants.filter(p => p.response !== 'no'));
	const notComing = $derived(participants.filter(p => p.response === 'no'));
	const seatCount = $derived(attending.reduce((acc, p) => acc + (p.response === 'yes+1' ? 2 : 1), 0));

	function initials(name: string) {
		return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
	}
</script>

<!-- ════════════════ TOP NAV ════════════════ -->
<nav class="topnav">
	<a href="#home" class="logo">🎂 Andrei</a>
	<ul class="nav-links">
		<li><a href="#home">Home</a></li>
		<li><a href="#countdown">Countdown</a></li>
		<li><a href="#rsvp">RSVP</a></li>
		<li><a href="#location">Location</a></li>
		<li><a href="#activities">Activities</a></li>
	</ul>
	<button class="ham" class:open={drawerOpen} onclick={() => (drawerOpen = !drawerOpen)} aria-label="Toggle menu">
		<span></span><span></span><span></span>
	</button>
</nav>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="overlay" class:show={drawerOpen} role="presentation" onclick={() => (drawerOpen = false)}></div>
<nav class="drawer" class:open={drawerOpen} aria-label="Mobile navigation">
	<a href="#home" onclick={() => (drawerOpen = false)}>Home</a>
	<a href="#countdown" onclick={() => (drawerOpen = false)}>Countdown</a>
	<a href="#rsvp" onclick={() => (drawerOpen = false)}>RSVP</a>
	<a href="#location" onclick={() => (drawerOpen = false)}>Location</a>
	<a href="#activities" onclick={() => (drawerOpen = false)}>Activities</a>
</nav>

<!-- ════════════════ HERO ════════════════ -->
<section id="home" class="hero">
	<canvas bind:this={canvasEl} class="ptcl"></canvas>
	<div class="orb o1"></div>
	<div class="orb o2"></div>
	<div class="orb o3"></div>

	<div class="hero-inner">
		<span class="badge">May 16 · 2026</span>
		<p class="htitle-pre">You Are Invited To</p>
		<h1 class="htitle">My Birthday!</h1>
		<p class="hsub">Join me for an unforgettable night</p>

		<div id="countdown" class="cd-wrap">
			<p class="cd-eyebrow">Time Until the Party</p>
			{#if partyStarted}
				<div class="party-msg">🎂 The Party Has Started!</div>
			{:else}
				<div class="cd-row">
					<div class="cd-unit">
						<div class="cd-card">
							{#key days}<span class="cdn">{days}</span>{/key}
						</div>
						<span class="cdl">Days</span>
					</div>
					<span class="cdsep">:</span>
					<div class="cd-unit">
						<div class="cd-card">
							{#key hours}<span class="cdn">{hours}</span>{/key}
						</div>
						<span class="cdl">Hours</span>
					</div>
					<span class="cdsep">:</span>
					<div class="cd-unit">
						<div class="cd-card">
							{#key minutes}<span class="cdn">{minutes}</span>{/key}
						</div>
						<span class="cdl">Mins</span>
					</div>
					<span class="cdsep">:</span>
					<div class="cd-unit">
						<div class="cd-card">
							{#key seconds}<span class="cdn">{seconds}</span>{/key}
						</div>
						<span class="cdl">Secs</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- ════════════════ RSVP ════════════════ -->
<section id="rsvp" class="rsvp-section">
	<div class="sec-orb rsvp-orb1"></div>
	<div class="sec-orb rsvp-orb2"></div>

	<header class="sec-head reveal">
		<span class="sec-tag">Don't Leave Me Hanging</span>
		<h2 class="sec-title">Will You Join Me?</h2>
		<div class="sec-rule"></div>
		<p class="sec-sub">Let me know so I can plan the perfect night!</p>
	</header>

	<div class="rsvp-cards reveal">
		<button class="rsvp-card rc-yes" onclick={() => openDialog('yes')}>
			<div class="rc-glow"></div>
			<span class="rc-emoji">🎉</span>
			<h3 class="rc-title">Count Me In!</h3>
			<p class="rc-desc">I'll definitely be there</p>
			<div class="rc-btn">I'm Coming →</div>
		</button>

		<button class="rsvp-card rc-yes1" onclick={() => openDialog('yes+1')}>
			<div class="rc-glow"></div>
			<span class="rc-emoji">🎉🎉</span>
			<h3 class="rc-title">Count Me In +1!</h3>
			<p class="rc-desc">Coming with a plus one</p>
			<div class="rc-btn">We're Coming →</div>
		</button>

		<button class="rsvp-card rc-no" onclick={() => openDialog('no')}>
			<div class="rc-glow rc-glow-no"></div>
			<span class="rc-emoji">💔</span>
			<h3 class="rc-title">No, I Hate You</h3>
			<p class="rc-desc">Can't make it (with regrets)</p>
			<div class="rc-btn rc-btn-no">Not Coming</div>
		</button>
	</div>
</section>

<!-- ════════════════ PARTICIPANTS ════════════════ -->
<section id="participants" class="guests-section">
	<div class="sec-orb guests-orb"></div>

	<header class="sec-head reveal">
		<span class="sec-tag">The Guest List</span>
		<h2 class="sec-title">Who's Coming</h2>
		<div class="sec-rule"></div>
	</header>

	{#if participants.length === 0}
		<div class="guests-empty reveal">
			<span class="guests-empty-icon">🎈</span>
			<p>Be the first to RSVP!</p>
		</div>
	{:else}
		<div class="guests-banner reveal">
			<span class="guests-count">🎉 {seatCount} {seatCount === 1 ? 'person' : 'people'} attending</span>
			{#if attending.length !== seatCount}
				<span class="guests-seats">· {attending.length} {attending.length === 1 ? 'group' : 'groups'}</span>
			{/if}
		</div>

		{#if attending.length > 0}
			<div class="guests-grid reveal">
				{#each attending as p, i}
					<div class="guest-card" style="animation-delay: {i * 60}ms">
						<div class="guest-avatar" style="background: hsl({(i * 47 + 20) % 360}, 60%, 45%)">
							{initials(p.name)}
						</div>
						<div class="guest-info">
							<span class="guest-name">{p.name}</span>
							{#if p.plusOneName}
								<span class="guest-plus">+ {p.plusOneName}</span>
							{/if}
						</div>
						<div class="guest-badge" class:badge-plus={p.response === 'yes+1'}>
							{p.response === 'yes+1' ? '🎉🎉 +1' : '🎉 Attending'}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		{#if notComing.length > 0}
			<div class="not-coming-wrap reveal">
				<p class="not-coming-label">💔 Unable to attend</p>
				<div class="not-coming-list">
					{#each notComing as p}
						<span class="not-coming-chip">{p.name}</span>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</section>

<!-- ════════════════ LOCATION ════════════════ -->
<section id="location" class="loc-section">
	<div class="sec-orb lo-orb"></div>
	<header class="sec-head reveal">
		<span class="sec-tag">Where to Find Me</span>
		<h2 class="sec-title">Location</h2>
		<div class="sec-rule"></div>
	</header>
	<div class="loc-card reveal">
		<div class="map-ph">
			<div class="map-grid"></div>
			<div class="map-glow"></div>
			<span class="map-pin">📍</span>
		</div>
		<div class="loc-body">
			<p class="loc-text">
				<strong>The exact location will be revealed soon!</strong><br />
				Stay tuned — I promise it'll be worth the wait.
			</p>
			<div class="loc-badge">📍 Location TBD — Stay tuned for the address!</div>
		</div>
	</div>
</section>

<!-- ════════════════ ACTIVITIES ════════════════ -->
<section id="activities" class="act-section">
	<div class="sec-orb act-orb"></div>
	<header class="sec-head reveal">
		<span class="sec-tag">What's in Store</span>
		<h2 class="sec-title">Activities</h2>
		<div class="sec-rule"></div>
	</header>
	<div class="act-grid">
		{#each [
			{ n: '01', icon: '🎲', title: 'Board Games', desc: 'Strategy, luck, and friendly competition' },
			{ n: '02', icon: '🍹', title: 'Drinking', desc: 'Craft cocktails and good vibes' },
			{ n: '03', icon: '🛁', title: 'Soaking', desc: 'Unwind in the jacuzzi under the stars' },
			{ n: '04', icon: '😂', title: 'Laughing', desc: 'Good friends, great stories, zero filters' }
		] as act, i}
			<div class="act-card reveal" style="transition-delay: {i * 100}ms">
				<span class="act-n">{act.n}</span>
				<span class="act-icon">{act.icon}</span>
				<h3 class="act-title">{act.title}</h3>
				<p class="act-desc">{act.desc}</p>
			</div>
		{/each}
	</div>
</section>

<!-- ════════════════ FOOTER ════════════════ -->
<footer>
	<p class="ft">Made with <span class="fheart">♥</span> for <span class="fname">Andrei</span>'s Birthday</p>
	<p class="fdate">May 16 · 2026</p>
</footer>

<!-- ════════════════ DIALOG ════════════════ -->
{#if dialogOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="dlg-overlay" role="presentation" onclick={closeDialog}>
		<div class="dlg-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
			{#if dialogSuccess}
				<div class="dlg-success">
					<span class="dlg-success-icon">✅</span>
					<p class="dlg-success-msg">{DIALOG_INFO[currentResponse].successMsg}</p>
				</div>
			{:else}
				<div class="dlg-header">
					<button class="dlg-close" onclick={closeDialog} aria-label="Close">✕</button>
					<span class="dlg-emoji">{DIALOG_INFO[currentResponse].emoji}</span>
					<h3 class="dlg-title">{DIALOG_INFO[currentResponse].title}</h3>
					<p class="dlg-sub">{DIALOG_INFO[currentResponse].sub}</p>
				</div>
				<form class="dlg-form" onsubmit={submitRsvp}>
					<div class="form-group">
						<label class="form-label" for="dlg-name">Your Name</label>
						<input
							id="dlg-name"
							class="form-input"
							type="text"
							bind:value={nameInput}
							placeholder="Enter your name"
							required
							autocomplete="given-name"
						/>
					</div>
					{#if currentResponse === 'yes+1'}
						<div class="form-group">
							<label class="form-label" for="dlg-plus">+1's Name <span class="form-optional">(optional)</span></label>
							<input
								id="dlg-plus"
								class="form-input"
								type="text"
								bind:value={plusOneInput}
								placeholder="Their name"
								autocomplete="off"
							/>
						</div>
					{/if}
					<div class="dlg-actions">
						<button type="button" class="btn-cancel" onclick={closeDialog}>Cancel</button>
						<button type="submit" class="btn-submit" class:loading={submitting} disabled={submitting}>
							{#if submitting}Sending...{:else}Confirm{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* ─── BASE ─── */
	:global(html) {
		scroll-behavior: smooth;
		scroll-padding-top: 72px;
		overflow-x: hidden;
	}
	:global(body) {
		background: #1e104e;
		color: #f5f0ff;
		font-family: 'Outfit', sans-serif;
		overflow-x: hidden;
		min-width: 320px;
	}

	/* ─── TOP NAV ─── */
	.topnav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 clamp(1rem, 4vw, 2rem);
		height: 68px;
		background: rgba(30, 16, 78, 0.75);
		backdrop-filter: blur(22px);
		-webkit-backdrop-filter: blur(22px);
		border-bottom: 1px solid rgba(255, 101, 63, 0.14);
		box-sizing: border-box;
		width: 100%;
	}
	.logo {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.7rem;
		letter-spacing: 0.08em;
		background: linear-gradient(135deg, #ff653f, #ffc85c);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-decoration: none;
		flex-shrink: 0;
	}
	.nav-links {
		display: flex;
		gap: 1.5rem;
		list-style: none;
	}
	.nav-links a {
		color: rgba(245, 240, 255, 0.72);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.86rem;
		letter-spacing: 0.04em;
		transition: color 0.25s;
	}
	.nav-links a:hover { color: #ffc85c; }

	.ham {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 6px;
		flex-shrink: 0;
	}
	.ham span {
		display: block;
		width: 23px;
		height: 2px;
		background: #f5f0ff;
		border-radius: 2px;
		transition: all 0.3s;
	}
	.ham.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
	.ham.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
	.ham.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

	/* ─── DRAWER ─── */
	.overlay {
		position: fixed; inset: 0; z-index: 198;
		background: rgba(0, 0, 0, 0.55);
		opacity: 0; pointer-events: none;
		transition: opacity 0.3s;
	}
	.overlay.show { opacity: 1; pointer-events: all; }
	.drawer {
		position: fixed; top: 0; right: -100%; height: 100vh;
		width: min(290px, 82vw); z-index: 199;
		background: rgba(20, 8, 55, 0.97);
		backdrop-filter: blur(30px);
		border-left: 1px solid rgba(255, 101, 63, 0.22);
		display: flex; flex-direction: column;
		justify-content: center; align-items: center;
		gap: 2.5rem;
		transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.drawer.open { right: 0; }
	.drawer a {
		color: #f5f0ff; text-decoration: none;
		font-size: 1.45rem; font-weight: 600;
		letter-spacing: 0.08em; transition: color 0.25s;
	}
	.drawer a:hover { color: #ffc85c; }

	/* ─── HERO ─── */
	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		padding: 6rem 1.25rem 5rem;
		box-sizing: border-box;
		width: 100%;
	}
	.ptcl {
		position: absolute; inset: 0;
		width: 100%; height: 100%;
		pointer-events: none; display: block;
	}
	.orb {
		position: absolute; border-radius: 50%;
		filter: blur(80px); pointer-events: none; opacity: 0.22;
	}
	.o1 { width: 500px; height: 500px; background: radial-gradient(circle, #ff653f, transparent 70%); top: -100px; right: -60px; }
	.o2 { width: 420px; height: 420px; background: radial-gradient(circle, #ffc85c, transparent 70%); bottom: -80px; left: -60px; }
	.o3 { width: 320px; height: 320px; background: radial-gradient(circle, #452e5a, transparent 70%); top: 40%; left: 20%; opacity: 0.38; }

	.hero-inner {
		position: relative; z-index: 1;
		text-align: center;
		max-width: 900px;
		width: 100%;
	}

	.badge {
		display: inline-block;
		padding: 0.35rem 1.15rem;
		border: 1px solid rgba(255, 200, 92, 0.38);
		border-radius: 50px;
		font-size: 0.78rem; letter-spacing: 0.2em; text-transform: uppercase;
		color: #ffc85c; margin-bottom: 1.2rem;
		animation: fu 0.75s ease both;
	}

	.htitle-pre {
		font-family: 'Outfit', sans-serif;
		font-size: clamp(1rem, 3vw, 1.5rem);
		font-weight: 300;
		color: rgba(245, 240, 255, 0.6);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		animation: fu 0.75s 0.1s ease both;
		margin-bottom: 0.2rem;
	}

	.htitle {
		font-family: 'Bebas Neue', sans-serif;
		font-size: clamp(3.5rem, 12vw, 9rem);
		line-height: 0.92; letter-spacing: 0.02em;
		background: linear-gradient(148deg, #ff653f 0%, #ffc85c 55%, #fff9ee 100%);
		-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
		filter: drop-shadow(0 0 48px rgba(255, 101, 63, 0.28));
		animation: fu 0.75s 0.18s ease both;
		margin-bottom: 0.9rem;
	}

	.hsub {
		font-size: clamp(0.88rem, 2.5vw, 1.2rem);
		color: rgba(245, 240, 255, 0.55);
		font-weight: 300; letter-spacing: 0.06em;
		animation: fu 0.75s 0.32s ease both;
		margin-bottom: 3.5rem;
	}

	/* ─── COUNTDOWN ─── */
	.cd-wrap { animation: fu 0.75s 0.48s ease both; }
	.cd-eyebrow {
		font-size: 0.68rem; letter-spacing: 0.22em; text-transform: uppercase;
		color: rgba(255, 200, 92, 0.5); margin-bottom: 1.4rem;
	}
	.cd-row {
		display: flex; align-items: center;
		justify-content: center;
		gap: clamp(0.3rem, 1.5vw, 1rem);
		flex-wrap: nowrap;
	}
	.cd-unit { text-align: center; }
	.cd-card {
		position: relative;
		width: clamp(62px, 14.5vw, 148px);
		height: clamp(62px, 14.5vw, 148px);
		background: rgba(69, 46, 90, 0.55);
		border: 1px solid rgba(255, 101, 63, 0.22);
		border-radius: 14px;
		display: flex; align-items: center; justify-content: center;
		overflow: hidden; backdrop-filter: blur(14px);
		animation: card-pulse 2.8s ease-in-out infinite;
	}
	.cd-card::before {
		content: ''; position: absolute; inset: 0;
		background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px);
		pointer-events: none;
	}
	.cd-card::after {
		content: ''; position: absolute; top: 0; left: 0; right: 0; height: 45%;
		background: linear-gradient(180deg, rgba(255,255,255,0.055), transparent);
		border-radius: 14px 14px 0 0; pointer-events: none;
	}
	.cdn {
		font-family: 'Bebas Neue', sans-serif;
		font-size: clamp(1.8rem, 5.5vw, 5rem);
		line-height: 1;
		background: linear-gradient(175deg, #ffc85c 10%, #ff653f 100%);
		-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
		filter: drop-shadow(0 0 14px rgba(255, 200, 92, 0.7));
		position: relative; z-index: 1;
		animation: numIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	.cdsep {
		font-family: 'Bebas Neue', sans-serif;
		font-size: clamp(1.5rem, 4vw, 4rem);
		color: #ff653f; opacity: 0.48; line-height: 1;
		margin-bottom: 1.8rem;
		animation: blink 1.2s ease-in-out infinite;
		flex-shrink: 0;
	}
	.cdl {
		display: block; margin-top: 0.6rem;
		font-size: clamp(0.5rem, 1.2vw, 0.68rem);
		letter-spacing: 0.2em; text-transform: uppercase;
		color: rgba(245, 240, 255, 0.38);
	}
	.party-msg {
		font-family: 'Bebas Neue', sans-serif;
		font-size: clamp(1.8rem, 5vw, 3.5rem);
		background: linear-gradient(135deg, #ff653f, #ffc85c);
		-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
	}

	/* ─── SECTION COMMON ─── */
	section {
		padding: 7rem 1.25rem;
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
		width: 100%;
	}
	.sec-head { text-align: center; margin-bottom: 3.5rem; }
	.sec-tag {
		display: block; font-size: 0.7rem; letter-spacing: 0.26em;
		text-transform: uppercase; color: #ff653f; margin-bottom: 0.9rem;
	}
	.sec-title {
		font-family: 'Bebas Neue', sans-serif;
		font-size: clamp(2.5rem, 7vw, 5rem);
		letter-spacing: 0.04em; color: #f5f0ff;
	}
	.sec-rule {
		width: 54px; height: 3px;
		background: linear-gradient(90deg, #ff653f, #ffc85c);
		margin: 1.3rem auto 0; border-radius: 2px;
	}
	.sec-sub {
		margin-top: 1rem; font-size: 0.95rem;
		color: rgba(245, 240, 255, 0.5); font-weight: 300;
	}
	.sec-orb {
		position: absolute; border-radius: 50%; pointer-events: none;
	}

	/* ─── RSVP ─── */
	.rsvp-section {
		background: linear-gradient(180deg, #1e104e 0%, rgba(69, 46, 90, 0.35) 50%, #1e104e 100%);
	}
	.rsvp-orb1 {
		width: 500px; height: 500px;
		background: radial-gradient(circle, rgba(255, 101, 63, 0.08), transparent 70%);
		top: -80px; left: -100px;
	}
	.rsvp-orb2 {
		width: 400px; height: 400px;
		background: radial-gradient(circle, rgba(255, 200, 92, 0.07), transparent 70%);
		bottom: -60px; right: -80px;
	}

	.rsvp-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
		max-width: 960px;
		margin: 0 auto;
	}

	.rsvp-card {
		position: relative;
		background: rgba(69, 46, 90, 0.35);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 101, 63, 0.15);
		border-radius: 22px;
		padding: 2.5rem 1.5rem 2rem;
		display: flex; flex-direction: column;
		align-items: center; text-align: center;
		gap: 0.75rem; overflow: hidden;
		cursor: pointer;
		transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s, border-color 0.35s;
		appearance: none; color: #f5f0ff;
	}
	.rsvp-card:hover {
		transform: translateY(-10px) scale(1.02);
		border-color: rgba(255, 101, 63, 0.45);
		box-shadow: 0 24px 60px rgba(0,0,0,0.35), 0 0 40px rgba(255, 101, 63, 0.12);
	}
	.rsvp-card:active { transform: translateY(-4px) scale(0.99); }

	.rc-glow {
		position: absolute; top: 0; left: 50%; transform: translateX(-50%);
		width: 140px; height: 140px; border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 101, 63, 0.22), transparent 70%);
		filter: blur(20px); pointer-events: none;
		transition: opacity 0.35s;
		opacity: 0;
	}
	.rc-glow-no {
		background: radial-gradient(circle, rgba(150, 80, 120, 0.25), transparent 70%);
	}
	.rsvp-card:hover .rc-glow { opacity: 1; }

	.rc-emoji {
		font-size: 3.2rem;
		filter: drop-shadow(0 0 14px rgba(255, 200, 92, 0.4));
		transition: filter 0.35s, transform 0.35s;
		display: block;
	}
	.rsvp-card:hover .rc-emoji {
		filter: drop-shadow(0 0 28px rgba(255, 200, 92, 0.7));
		transform: scale(1.15) rotate(-5deg);
	}

	.rc-title {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.5rem; letter-spacing: 0.04em; color: #f5f0ff;
	}
	.rc-desc {
		font-size: 0.84rem; color: rgba(245, 240, 255, 0.48); line-height: 1.5;
	}
	.rc-btn {
		margin-top: auto;
		padding: 0.55rem 1.4rem;
		background: linear-gradient(135deg, #ff653f, #ffc85c);
		border-radius: 50px;
		font-size: 0.82rem; font-weight: 600;
		letter-spacing: 0.06em; color: #1e104e;
		transition: box-shadow 0.3s, transform 0.3s;
	}
	.rsvp-card:hover .rc-btn {
		box-shadow: 0 6px 20px rgba(255, 101, 63, 0.4);
		transform: scale(1.04);
	}
	.rc-btn-no {
		background: rgba(180, 80, 120, 0.3);
		border: 1px solid rgba(180, 80, 120, 0.4);
		color: rgba(245, 200, 220, 0.8);
	}
	.rsvp-card:hover .rc-btn-no {
		box-shadow: 0 6px 20px rgba(150, 50, 90, 0.3);
	}

	/* ─── GUESTS / PARTICIPANTS ─── */
	.guests-section {
		background: linear-gradient(180deg, #1e104e 0%, rgba(40, 20, 70, 0.5) 50%, #1e104e 100%);
	}
	.guests-orb {
		width: 500px; height: 500px;
		background: radial-gradient(circle, rgba(255, 200, 92, 0.06), transparent 70%);
		top: 10%; left: 50%; transform: translateX(-50%);
	}

	.guests-empty {
		text-align: center; padding: 3rem 1rem;
		color: rgba(245, 240, 255, 0.4);
		font-size: 1rem; display: flex; flex-direction: column;
		align-items: center; gap: 0.75rem;
	}
	.guests-empty-icon { font-size: 3rem; }

	.guests-banner {
		text-align: center; margin-bottom: 2.5rem;
		padding: 0.9rem 2rem;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 101, 63, 0.1);
		border: 1px solid rgba(255, 101, 63, 0.24);
		border-radius: 50px;
		font-size: 0.95rem; font-weight: 500;
		width: fit-content;
		margin-left: auto; margin-right: auto;
		display: flex;
	}
	.guests-count { color: #ffc85c; }
	.guests-seats { color: rgba(245, 240, 255, 0.5); font-size: 0.85rem; }

	.guests-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
		gap: 1rem;
		max-width: 900px;
		margin: 0 auto;
	}

	.guest-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: rgba(69, 46, 90, 0.35);
		backdrop-filter: blur(18px);
		border: 1px solid rgba(255, 101, 63, 0.12);
		border-radius: 16px;
		padding: 1.1rem 1.25rem;
		animation: fu 0.6s ease both;
		transition: border-color 0.3s, box-shadow 0.3s;
	}
	.guest-card:hover {
		border-color: rgba(255, 101, 63, 0.28);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.guest-avatar {
		width: 44px; height: 44px; border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		font-size: 0.9rem; font-weight: 700; color: #fff;
		flex-shrink: 0; letter-spacing: 0.02em;
	}
	.guest-info {
		flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem;
	}
	.guest-name { font-weight: 600; font-size: 0.95rem; color: #f5f0ff; }
	.guest-plus { font-size: 0.8rem; color: #ffc85c; }
	.guest-badge {
		font-size: 0.72rem; letter-spacing: 0.05em;
		padding: 0.28rem 0.7rem;
		background: rgba(255, 101, 63, 0.15);
		border: 1px solid rgba(255, 101, 63, 0.25);
		border-radius: 50px; color: #ff653f;
		white-space: nowrap; flex-shrink: 0;
	}
	.badge-plus {
		background: rgba(255, 200, 92, 0.12);
		border-color: rgba(255, 200, 92, 0.25);
		color: #ffc85c;
	}

	.not-coming-wrap {
		max-width: 900px; margin: 2rem auto 0;
		padding: 1.25rem 1.5rem;
		background: rgba(69, 46, 90, 0.2);
		border: 1px solid rgba(150, 80, 120, 0.2);
		border-radius: 16px;
	}
	.not-coming-label {
		font-size: 0.8rem; letter-spacing: 0.1em;
		color: rgba(245, 200, 220, 0.55); margin-bottom: 0.75rem;
	}
	.not-coming-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.not-coming-chip {
		padding: 0.3rem 0.75rem;
		background: rgba(150, 80, 120, 0.15);
		border: 1px solid rgba(150, 80, 120, 0.25);
		border-radius: 50px; font-size: 0.82rem;
		color: rgba(245, 200, 220, 0.7);
	}

	/* ─── LOCATION ─── */
	.loc-section {
		background: linear-gradient(180deg, #1e104e, rgba(69, 46, 90, 0.28) 50%, #1e104e);
	}
	.lo-orb {
		width: 600px; height: 600px;
		background: radial-gradient(circle, rgba(255, 101, 63, 0.06), transparent 70%);
		top: 50%; left: 50%; transform: translate(-50%, -50%);
	}
	.loc-card {
		max-width: 680px; margin: 0 auto;
		background: rgba(69, 46, 90, 0.32);
		backdrop-filter: blur(22px);
		border: 1px solid rgba(255, 101, 63, 0.16);
		border-radius: 24px; overflow: hidden;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.38);
	}
	.map-ph {
		height: 220px;
		background: linear-gradient(135deg, rgba(69, 46, 90, 0.7), rgba(30, 16, 78, 0.92));
		position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;
	}
	.map-grid {
		position: absolute; inset: 0;
		background-image: linear-gradient(rgba(255,101,63,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,101,63,0.07) 1px, transparent 1px);
		background-size: 40px 40px;
	}
	.map-glow {
		position: absolute; width: 200px; height: 200px; border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 101, 63, 0.2), transparent 70%);
	}
	.map-pin {
		position: relative; z-index: 1; font-size: 3.2rem;
		filter: drop-shadow(0 0 28px rgba(255, 101, 63, 0.65));
		animation: pin-bob 2.8s ease-in-out infinite;
	}
	.loc-body { padding: 1.75rem 2rem; }
	.loc-text { font-size: 1rem; color: rgba(245,240,255,0.62); line-height: 1.75; }
	.loc-text strong { color: #ffc85c; }
	.loc-badge {
		display: inline-flex; align-items: center; gap: 0.4rem;
		margin-top: 1.1rem; padding: 0.4rem 1rem;
		background: rgba(255,101,63,0.1); border: 1px solid rgba(255,101,63,0.26);
		border-radius: 50px; font-size: 0.8rem; color: #ff653f;
	}

	/* ─── ACTIVITIES ─── */
	.act-orb {
		width: 480px; height: 480px;
		background: radial-gradient(circle, rgba(255,200,92,0.05), transparent 70%);
		top: 0; right: -60px;
	}
	.act-grid {
		display: grid; grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem; max-width: 840px; margin: 0 auto;
	}
	.act-card {
		background: rgba(69,46,90,0.3); backdrop-filter: blur(22px);
		border: 1px solid rgba(255,101,63,0.12); border-radius: 20px;
		padding: 2.25rem 1.75rem; position: relative; overflow: hidden;
		transition: transform 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s, border-color 0.4s;
		cursor: default;
	}
	.act-card::before {
		content: ''; position: absolute; inset: 0;
		background: linear-gradient(135deg, rgba(255,101,63,0.07), transparent 65%);
		opacity: 0; transition: opacity 0.4s;
	}
	.act-card:hover { transform: translateY(-8px); border-color: rgba(255,101,63,0.35); box-shadow: 0 18px 48px rgba(0,0,0,0.3), 0 0 32px rgba(255,101,63,0.09); }
	.act-card:hover::before { opacity: 1; }
	.act-n {
		position: absolute; top: 1rem; right: 1.3rem;
		font-family: 'Bebas Neue', sans-serif; font-size: 3.2rem;
		color: rgba(255,101,63,0.07); line-height: 1;
		pointer-events: none; transition: color 0.4s;
	}
	.act-card:hover .act-n { color: rgba(255,101,63,0.14); }
	.act-icon {
		font-size: 2.5rem; display: block; margin-bottom: 1rem;
		filter: drop-shadow(0 0 10px rgba(255,200,92,0.3));
		transition: filter 0.4s, transform 0.4s;
	}
	.act-card:hover .act-icon { filter: drop-shadow(0 0 22px rgba(255,200,92,0.65)); transform: scale(1.1); }
	.act-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.45rem; letter-spacing: 0.04em; color: #f5f0ff; margin-bottom: 0.4rem; }
	.act-desc { font-size: 0.85rem; color: rgba(245,240,255,0.48); line-height: 1.65; }

	/* ─── FOOTER ─── */
	footer {
		padding: 2.5rem 1.5rem; text-align: center;
		border-top: 1px solid rgba(255,101,63,0.1);
	}
	.ft { font-size: 0.88rem; color: rgba(245,240,255,0.36); letter-spacing: 0.04em; }
	.fheart { color: #ff653f; animation: hb 1.6s ease-in-out infinite; display: inline-block; }
	.fname { color: #ffc85c; }
	.fdate { font-family: 'Bebas Neue', sans-serif; font-size: 1.18rem; background: linear-gradient(135deg, #ff653f, #ffc85c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-top: 0.4rem; letter-spacing: 0.16em; }

	/* ─── DIALOG ─── */
	.dlg-overlay {
		position: fixed; inset: 0; z-index: 500;
		background: rgba(10, 5, 30, 0.7);
		backdrop-filter: blur(12px);
		display: flex; align-items: center; justify-content: center;
		padding: 1rem;
		animation: dlg-overlay-in 0.25s ease both;
	}
	.dlg-card {
		background: rgba(40, 20, 75, 0.9);
		backdrop-filter: blur(30px);
		border: 1px solid rgba(255, 101, 63, 0.28);
		border-radius: 28px;
		padding: 2.5rem 2rem;
		width: 100%; max-width: 440px;
		box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(255,101,63,0.08);
		animation: dlg-card-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
		position: relative;
	}
	.dlg-close {
		position: absolute; top: 1.1rem; right: 1.1rem;
		background: rgba(255,255,255,0.08); border: none;
		color: rgba(245,240,255,0.6); cursor: pointer;
		width: 32px; height: 32px; border-radius: 50%;
		font-size: 0.85rem; display: flex; align-items: center; justify-content: center;
		transition: background 0.2s, color 0.2s;
	}
	.dlg-close:hover { background: rgba(255,101,63,0.2); color: #ff653f; }

	.dlg-header { text-align: center; margin-bottom: 2rem; }
	.dlg-emoji {
		display: block; font-size: 3.5rem; margin-bottom: 0.75rem;
		filter: drop-shadow(0 0 20px rgba(255,200,92,0.5));
	}
	.dlg-title {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 2rem; letter-spacing: 0.04em; color: #f5f0ff;
		margin-bottom: 0.5rem;
	}
	.dlg-sub { font-size: 0.88rem; color: rgba(245,240,255,0.55); line-height: 1.5; }

	.dlg-form { display: flex; flex-direction: column; gap: 1.25rem; }
	.form-group { display: flex; flex-direction: column; gap: 0.45rem; }
	.form-label { font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; color: rgba(245,240,255,0.7); }
	.form-optional { font-weight: 300; color: rgba(245,240,255,0.4); }
	.form-input {
		background: rgba(69,46,90,0.5);
		border: 1px solid rgba(255,101,63,0.25);
		border-radius: 12px; padding: 0.85rem 1.1rem;
		color: #f5f0ff; font-size: 0.95rem;
		font-family: 'Outfit', sans-serif;
		width: 100%; transition: border-color 0.3s, box-shadow 0.3s;
	}
	.form-input::placeholder { color: rgba(245,240,255,0.28); }
	.form-input:focus {
		outline: none; border-color: #ff653f;
		box-shadow: 0 0 20px rgba(255,101,63,0.18);
	}

	.dlg-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
	.btn-cancel {
		flex: 0 0 auto; padding: 0.8rem 1.4rem;
		background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
		border-radius: 12px; color: rgba(245,240,255,0.6);
		font-size: 0.88rem; font-family: 'Outfit', sans-serif;
		cursor: pointer; transition: background 0.2s;
	}
	.btn-cancel:hover { background: rgba(255,255,255,0.12); }
	.btn-submit {
		flex: 1; padding: 0.85rem 1.4rem;
		background: linear-gradient(135deg, #ff653f, #ffc85c);
		border: none; border-radius: 12px;
		color: #1e104e; font-size: 0.95rem; font-weight: 700;
		font-family: 'Outfit', sans-serif; cursor: pointer;
		transition: box-shadow 0.3s, transform 0.2s, opacity 0.2s;
		letter-spacing: 0.04em;
	}
	.btn-submit:hover { box-shadow: 0 8px 24px rgba(255,101,63,0.4); transform: translateY(-1px); }
	.btn-submit:active { transform: translateY(0); }
	.btn-submit.loading { opacity: 0.7; cursor: not-allowed; }

	.dlg-success {
		text-align: center; padding: 2rem 1rem;
		display: flex; flex-direction: column; align-items: center; gap: 1rem;
		animation: dlg-card-in 0.3s ease both;
	}
	.dlg-success-icon { font-size: 3.5rem; }
	.dlg-success-msg {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 2rem; letter-spacing: 0.04em;
		background: linear-gradient(135deg, #ff653f, #ffc85c);
		-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
	}

	/* ─── SCROLL REVEAL ─── */
	.reveal {
		opacity: 0;
		transform: translateY(26px);
		transition: opacity 0.8s ease, transform 0.8s ease;
	}
	:global(.reveal.in) { opacity: 1; transform: translateY(0); }

	/* ─── KEYFRAMES ─── */
	@keyframes fu { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
	@keyframes numIn { from { opacity: 0; transform: translateY(-38%); } to { opacity: 1; transform: translateY(0); } }
	@keyframes card-pulse {
		0%, 100% { box-shadow: 0 0 18px rgba(255,101,63,0.1), inset 0 1px 0 rgba(255,255,255,0.06); }
		50% { box-shadow: 0 0 32px rgba(255,101,63,0.26), 0 0 55px rgba(255,200,92,0.07), inset 0 1px 0 rgba(255,255,255,0.06); }
	}
	@keyframes blink { 0%, 100% { opacity: 0.48; } 50% { opacity: 0.14; } }
	@keyframes pin-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
	@keyframes hb { 0%, 100% { transform: scale(1); } 35% { transform: scale(1.28); } 55% { transform: scale(0.92); } }
	@keyframes dlg-overlay-in { from { opacity: 0; } to { opacity: 1; } }
	@keyframes dlg-card-in { from { opacity: 0; transform: scale(0.88) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

	/* ─── RESPONSIVE ─── */
	@media (max-width: 768px) {
		.nav-links { display: none; }
		.ham { display: flex; }
		.rsvp-cards { grid-template-columns: 1fr; max-width: 400px; }
		.act-grid { grid-template-columns: 1fr; }
		.guests-grid { grid-template-columns: 1fr; }
		.loc-body { padding: 1.4rem; }
		section { padding: 5rem 1rem; }
		.dlg-card { padding: 2rem 1.5rem; border-radius: 22px; }
		.dlg-actions { flex-direction: column; }
		.btn-cancel { text-align: center; }
	}

	@media (max-width: 480px) {
		.cd-card {
			width: clamp(58px, 18vw, 80px);
			height: clamp(58px, 18vw, 80px);
			border-radius: 10px;
		}
		.cdn { font-size: clamp(1.5rem, 6vw, 2.2rem); }
		.cdsep { font-size: clamp(1.2rem, 4vw, 1.8rem); margin-bottom: 1.4rem; }
		.cdl { font-size: 0.48rem; letter-spacing: 0.15em; }
		.cd-row { gap: clamp(0.2rem, 1.5vw, 0.5rem); }
	}
</style>
