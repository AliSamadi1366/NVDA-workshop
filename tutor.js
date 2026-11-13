/* tutor.js — Creative one-to-one Socratic tutor for the chemistry workshop.
   Works entirely client-side (no new server endpoint needed).
   Integrates with existing socratic.js check questions.
   Adds a tutor personality, session memory, progress tracking, and
   contextual guidance for free-form questions using keyword matching.

   Include on any lesson page AFTER socratic.js:
     <script src="tutor.js" defer></script>
*/
(function () {
  "use strict";

  // ============================================================
  // TUTOR PERSONA
  // ============================================================
  const TUTOR = {
    name: "Dr. Chen",
    title: "Chemistry Tutor",
    avatar: "DC",
    openingLines: [
      "Welcome! Ready to wrestle with some chemistry?",
      "Good to see you. Where shall we start?",
      "Hello! I've got my molecular model kit ready. You?"
    ],
    encouragement: [
      "Nice — you're thinking like a chemist.",
      "That's the key insight right there.",
      "Exactly. Now let's push it a little further.",
      "You've got the right pieces. Let's assemble them."
    ],
    struggleSupport: [
      "This trips up almost everyone at first. Let's slow down.",
      "Good effort. The confusion tells me where to focus.",
      "Let's come at it from a different angle."
    ],
    // Topic-specific guidance for free-form questions
    topicGuidance: {
      "buffers-intro": {
        keywords: {
          "buffer": "A buffer is a mix of a weak acid and its conjugate base. Both must be present in decent amounts. Which part neutralizes added acid? Which neutralizes added base?",
          "conjugate": "Conjugate pairs differ by one H⁺. HA ⇌ H⁺ + A⁻. The acid (HA) gives H⁺; the base (A⁻) accepts H⁺. In a buffer, you need BOTH.",
          "weak acid": "A weak acid only partially dissociates. That's why it can coexist with its conjugate base — they don't fully react with each other.",
          "strong acid": "Strong acids (HCl, HNO₃, H₂SO₄) fully dissociate. They overwhelm water's tiny [H⁺]. A buffer works because the conjugate base (A⁻) soaks up those extra H⁺.",
          "strong base": "Strong bases (NaOH, KOH) fully dissociate to OH⁻. The weak acid (HA) in the buffer neutralizes OH⁻ → A⁻ + H₂O.",
          "ratio": "The ratio [A⁻]/[HA] controls the pH (Henderson–Hasselbalch). But the *absolute concentrations* control how much acid/base you can add before the buffer breaks — that's capacity.",
          "blood": "Blood uses carbonic acid/bicarbonate (H₂CO₃/HCO₃⁻) with pKₐ ≈ 6.1, plus phosphate and proteins. It keeps pH at 7.4 — impressive for a buffer system!",
          "pka": "pKₐ = –log Kₐ. It tells you the pH where [HA] = [A⁻]. A buffer works best within ±1 pH unit of its pKₐ."
        },
        followUp: "Want to try the check-your-understanding questions on this page? They give instant Socratic feedback."
      },
      "henderson-hasselbalch": {
        keywords: {
          "henderson": "pH = pKₐ + log([A⁻]/[HA]). It comes from rearranging Kₐ = [H⁺][A⁻]/[HA] and taking –log. The log ratio is why 10× concentration change = 1 pH unit.",
          "log": "log₁₀(ratio). If ratio = 1, log = 0 → pH = pKₐ. If ratio = 10, log = 1 → pH = pKₐ + 1. If ratio = 0.1, log = –1 → pH = pKₐ – 1.",
          "ratio": "[A⁻]/[HA] — conjugate base OVER weak acid. Flip it and you'll get the wrong sign!",
          "dilut": "Diluting 10× cuts both [HA] and [A⁻] by 10. The ratio stays the same, so pH doesn't change (as long as the approximation holds).",
          "pka": "pKₐ of acetic acid = 4.76. Phosphate (H₂PO₄⁻/HPO₄²⁻) = 7.21. Ammonium (NH₄⁺/NH₃) = 9.25. Carbonic acid = 6.1.",
          "design": "To design a buffer at target pH: ratio = 10^(pH – pKₐ). Pick a weak acid with pKₐ within ±1 of your target.",
          "ammonia": "NH₃/NH₄⁺ buffer: the weak acid is NH₄⁺ (pKₐ = 9.25), conjugate base is NH₃. Don't mix this up!",
          "approxim": "The equation assumes [HA] and [A⁻] ≈ initial concentrations. Works when both ≥ 0.01 M and pH within ±1 of pKₐ."
        },
        followUp: "Try the worked example — change the concentrations and see if you can predict the new pH."
      },
      "buffer-capacity": {
        keywords: {
          "capacit": "Buffer capacity (β) = how much strong acid/base per liter per pH unit change. High capacity = flat titration curve. Low capacity = steep.",
          "concentration": "Double the total concentration → double the capacity (at same ratio). More moles = more acid/base you can soak up.",
          "ratio": "Capacity is MAX at 1:1 ratio (pH = pKₐ). At 10:1 or 1:10, capacity drops to ~40%. At 100:1, only ~8%.",
          "deplet": "If you add enough acid to consume ALL the A⁻, the buffer is destroyed. Same for base consuming all HA.",
          "ionic": "Above ~0.5 M, activity coefficients deviate from 1. The simple equation gets less accurate — need activities, not concentrations.",
          "temperature": "pKₐ changes with temperature. Tris buffer shifts a lot (~–0.03 pH/°C). Phosphate is more stable.",
          "phosphate": "Phosphate precipitates Ca²⁺. Tris reacts with aldehydes. Always check buffer compatibility with your experiment!",
          "tris": "Tris (pKₐ 8.1 at 25°C) has large ΔpKₐ/ΔT. Good for biochemistry at controlled temp, bad if temperature varies."
        },
        followUp: "The check-your-understanding questions on this page test capacity intuition. Give them a try!"
      },
      "vsepr": {
        keywords: {
          "vsepr": "Valence Shell Electron Pair Repulsion. Electron domains (bonding + lone pairs) arrange to maximize separation. Count DOMAINS, not bonds!",
          "domain": "Single, double, triple bond = 1 domain each. Lone pair = 1 domain. Count them on the central atom.",
          "lone pair": "Lone pairs repel MORE than bonding pairs (localized on one nucleus). They compress bond angles: CH₄ 109.5° → NH₃ 107° → H₂O 104.5°.",
          "trigonal bipyramid": "5 domains. Lone pairs ALWAYS go equatorial (120° apart) to minimize 90° repulsions. Axial positions have three 90° neighbors; equatorial only two.",
          "octahedral": "6 domains, all 90°/180°. With 1 lone pair → square pyramidal. With 2 lone pairs → square planar (lone pairs opposite).",
          "linear": "2 domains → 180°. CO₂, BeCl₂, XeF₂ (3 lone pairs equatorial!).",
          "bent": "3 domains + 1 lone pair (~118°, SO₂). Or 4 domains + 2 lone pairs (~104.5°, H₂O).",
          "tetrahedral": "4 domains, 109.5°. 0 lone pairs = tetrahedral (CH₄). 1 = trigonal pyramidal (NH₃). 2 = bent (H₂O).",
          "polar": "Symmetrical shape + identical substituents = nonpolar (CO₂, CCl₄, SF₆). Asymmetry or different substituents = polar (H₂O, NH₃, CH₃Cl).",
          "xef2": "XeF₂: 5 domains (2 bonds, 3 lone pairs). All 3 lone pairs equatorial → 2 bonds axial → LINEAR molecular geometry."
        },
        followUp: "The VSEPR table on this page has all the geometries. Pick a molecule and walk me through the domain count!"
      }
    }
  };

  // ============================================================
  // SESSION STATE (sessionStorage)
  // ============================================================
  const STORAGE_KEY = "chemTutorSession";
  let session = loadSession();

  function loadSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      studentName: null,
      questionHistory: {}, // qid -> { attempts, verdicts[], lastVerdict }
      currentLesson: detectLesson(),
      startTime: Date.now(),
      totalInteractions: 0,
      streak: 0,
      tutorMessages: 0
    };
  }

  function saveSession() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  function detectLesson() {
    const path = window.location.pathname;
    if (path.includes("lesson1")) return "buffers-intro";
    if (path.includes("lesson2")) return "henderson-hasselbalch";
    if (path.includes("lesson3")) return "buffer-capacity";
    if (path.includes("lesson4")) return "vsepr";
    if (path.includes("index")) return "overview";
    return "unknown";
  }

  // ============================================================
  // TUTOR UI
  // ============================================================
  function injectTutorUI() {
    const wrapper = document.createElement("div");
    wrapper.id = "chem-tutor";
    wrapper.innerHTML = `
      <style>
        #chem-tutor {
          position: fixed; right: 1rem; bottom: 1rem; z-index: 1000;
          font: 14px/1.5 system-ui, -apple-system, Segoe UI, sans-serif;
        }
        #chem-tutor.minimized .tutor-panel { display: none; }
        .tutor-toggle {
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #0d6a65, #0a4d4a);
          color: white; border: none; cursor: pointer;
          box-shadow: 0 4px 16px rgba(13,106,101,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; transition: transform 0.2s;
        }
        .tutor-toggle:hover { transform: scale(1.05); }
        .tutor-toggle:focus-visible { outline: 3px solid #f2b705; outline-offset: 3px; }
        .tutor-panel {
          position: absolute; right: 0; bottom: 70px;
          width: 340px; max-height: 500px;
          background: white; border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          overflow: hidden; display: flex; flex-direction: column;
          border: 1px solid #e0e8e7;
        }
        @media (prefers-color-scheme: dark) {
          .tutor-panel { background: #172528; border-color: #27383e; }
          .tutor-header { background: #11282d; }
          .tutor-message.tutor { background: #0f191d; border-color: #27383e; }
          .tutor-message.student { background: #17353a; }
          .tutor-input input { background: #0f191d; border-color: #27383e; color: inherit; }
          .progress-bar { background: #27383e; }
          .lesson-badge { background: #11282d; }
          .tip-box { background: #11282d; border-color: #27383e; }
        }
        .tutor-header {
          padding: 1rem; background: #f6faf9;
          border-bottom: 1px solid #e0e8e7;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .tutor-avatar { width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #0d6a65, #0a4d4a);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 16px; }
        .tutor-info { flex: 1; }
        .tutor-name { font-weight: 700; color: #15242a; }
        .tutor-title { font-size: 12px; color: #55676e; }
        .tutor-close { background: none; border: none; color: #55676e; cursor: pointer; font-size: 18px; padding: 4px; }
        .tutor-close:hover { color: #15242a; }
        .tutor-chat { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .tutor-message {
          padding: 0.75rem 1rem; border-radius: 12px; max-width: 85%;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .tutor-message.tutor { align-self: flex-start; background: #f6faf9; border: 1px solid #e0e8e7; }
        .tutor-message.student { align-self: flex-end; background: #dcecea; color: #15242a; }
        .tutor-message.system { align-self: center; font-size: 12px; color: #55676e; background: transparent; padding: 0.25rem; font-style: italic; }
        .tutor-input { padding: 0.75rem 1rem; border-top: 1px solid #e0e8e7; display: flex; gap: 0.5rem; }
        .tutor-input input { flex: 1; padding: 0.6rem 0.8rem; border: 1px solid #c9d6d4; border-radius: 8px; font: inherit; }
        .tutor-input input:focus { outline: 2px solid #0d6a65; outline-offset: 1px; }
        .tutor-input button { padding: 0.6rem 1rem; background: #0d6a65; color: white; border: none; border-radius: 8px; font: inherit; font-weight: 600; cursor: pointer; }
        .tutor-input button:disabled { opacity: 0.5; cursor: not-allowed; }
        .progress-row { padding: 0.75rem 1rem; border-top: 1px solid #e0e8e7; background: #fafbfb; }
        .progress-bar { height: 6px; background: #e0e8e7; border-radius: 3px; overflow: hidden; margin-bottom: 0.5rem; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #0d6a65, #62c4ba); border-radius: 3px; transition: width 0.3s; }
        .progress-stats { display: flex; justify-content: space-between; font-size: 12px; color: #55676e; }
        .lesson-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 11px; font-weight: 600; color: #0d6a65; margin: 0.5rem 1rem 0; }
        .tip-box { padding: 0.75rem; border-radius: 8px; border: 1px solid #e0e8e7; font-size: 13px; color: #55676e; margin: 0.5rem 1rem; display: none; }
        .tip-box.visible { display: block; animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
        .suggestion-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.5rem 1rem; }
        .suggestion-chip { padding: 0.3rem 0.7rem; background: #eef7f6; border: 1px solid #c9d6d4; border-radius: 999px; font-size: 12px; color: #0d6a65; cursor: pointer; transition: background 0.2s; }
        .suggestion-chip:hover { background: #dcecea; }
        @media (prefers-color-scheme: dark) {
          .suggestion-chip { background: #11282d; border-color: #27383e; color: #62c4ba; }
          .suggestion-chip:hover { background: #1a3d42; }
        }
      </style>
      <button class="tutor-toggle" aria-label="Open tutor" title="${TUTOR.name} — Your Chemistry Tutor">${TUTOR.avatar}</button>
      <div class="tutor-panel" role="dialog" aria-label="Chemistry Tutor">
        <div class="tutor-header">
          <div class="tutor-avatar">${TUTOR.avatar}</div>
          <div class="tutor-info">
            <div class="tutor-name">${TUTOR.name}</div>
            <div class="tutor-title">${TUTOR.title}</div>
          </div>
          <button class="tutor-close" aria-label="Minimize tutor">×</button>
        </div>
        <div class="lesson-badge" id="tutor-lesson-badge">${formatLessonName(session.currentLesson)}</div>
        <div class="tutor-chat" id="tutor-chat" aria-live="polite"></div>
        <div class="suggestion-chips" id="tutor-suggestions" style="display:none;"></div>
        <div class="progress-row">
          <div class="progress-bar"><div class="progress-fill" id="tutor-progress" style="width: 0%"></div></div>
          <div class="progress-stats">
            <span id="tutor-stats-questions">0 questions</span>
            <span id="tutor-stats-streak">🔥 0</span>
          </div>
        </div>
        <div class="tip-box" id="tutor-tip-box"></div>
        <div class="tutor-input">
          <input type="text" id="tutor-input" placeholder="Ask me anything, or answer my question..." aria-label="Your message">
          <button id="tutor-send" disabled>Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function formatLessonName(lesson) {
    const names = {
      "buffers-intro": "Lesson 1: What Is a Buffer?",
      "henderson-hasselbalch": "Lesson 2: Henderson–Hasselbalch",
      "buffer-capacity": "Lesson 3: Buffer Capacity",
      "vsepr": "Lesson 4: Molecular Geometry (VSEPR)",
      "overview": "Course Overview"
    };
    return names[lesson] || lesson;
  }

  // ============================================================
  // TUTOR STATE & UI REFS
  // ============================================================
  let tutorEl, chatEl, inputEl, sendBtn, toggleBtn, closeBtn, progressFill, statsQuestions, statsStreak, tipBox, lessonBadge, suggestionsEl;

  function initTutor() {
    tutorEl = document.getElementById("chem-tutor");
    chatEl = document.getElementById("tutor-chat");
    inputEl = document.getElementById("tutor-input");
    sendBtn = document.getElementById("tutor-send");
    toggleBtn = tutorEl.querySelector(".tutor-toggle");
    closeBtn = tutorEl.querySelector(".tutor-close");
    progressFill = document.getElementById("tutor-progress");
    statsQuestions = document.getElementById("tutor-stats-questions");
    statsStreak = document.getElementById("tutor-stats-streak");
    tipBox = document.getElementById("tutor-tip-box");
    lessonBadge = document.getElementById("tutor-lesson-badge");
    suggestionsEl = document.getElementById("tutor-suggestions");

    toggleBtn.addEventListener("click", () => tutorEl.classList.toggle("minimized"));
    closeBtn.addEventListener("click", () => tutorEl.classList.add("minimized"));
    inputEl.addEventListener("input", () => sendBtn.disabled = !inputEl.value.trim());
    inputEl.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!sendBtn.disabled) sendMessage(); } });
    sendBtn.addEventListener("click", sendMessage);

    renderWelcome();
    updateProgress();
    showSuggestions();
  }

  function renderWelcome() {
    if (session.totalInteractions === 0) {
      addMessage("tutor", randomChoice(TUTOR.openingLines) + " What should I call you?");
    } else {
      const name = session.studentName ? ` ${session.studentName}` : "";
      addMessage("tutor", `Welcome back${name}! You've tackled ${Object.keys(session.questionHistory).length} questions so far. What's on your mind?`);
      showSuggestions();
    }
  }

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `tutor-message ${role}`;
    div.textContent = text;
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
    if (role === "tutor") session.tutorMessages++;
    return div;
  }

  function showTip(text) {
    tipBox.textContent = text;
    tipBox.classList.add("visible");
    setTimeout(() => tipBox.classList.remove("visible"), 10000);
  }

  function updateProgress() {
    const answered = Object.keys(session.questionHistory).length;
    const totalQuestions = document.querySelectorAll(".socratic[data-question]").length;
    const pct = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;
    progressFill.style.width = `${pct}%`;
    statsQuestions.textContent = `${answered}/${totalQuestions} questions`;
    statsStreak.textContent = `🔥 ${session.streak}`;
    lessonBadge.textContent = formatLessonName(session.currentLesson);
  }

  function recordQuestionAttempt(qid, verdict) {
    if (!session.questionHistory[qid]) {
      session.questionHistory[qid] = { attempts: 0, verdicts: [] };
    }
    const hist = session.questionHistory[qid];
    hist.attempts++;
    hist.verdicts.push({ verdict, time: Date.now() });
    hist.lastVerdict = verdict;

    if (verdict === "correct") {
      session.streak++;
    } else {
      session.streak = 0;
    }
    session.totalInteractions++;
    saveSession();
    updateProgress();
    showSuggestions();
  }

  // ============================================================
  // FREE-FORM QUESTION HANDLING (client-side keyword matching)
  // ============================================================
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    sendBtn.disabled = true;

    addMessage("student", text);
    session.totalInteractions++;

    // Capture name if not set
    if (!session.studentName && session.totalInteractions <= 2) {
      session.studentName = text;
      saveSession();
      addMessage("tutor", `Nice to meet you, ${text}! Let's dive into ${formatLessonName(session.currentLesson).toLowerCase()}. Ask me anything, or try the check-your-understanding questions on the page.`);
      showSuggestions();
      return;
    }

    // Generate tutor response based on lesson + keywords
    const response = generateTutorResponse(text);
    addMessage("tutor", response);
    showSuggestions();
  }

  function generateTutorResponse(question) {
    const lower = question.toLowerCase();
    const guidance = TUTOR.topicGuidance[session.currentLesson] || {};

    // Check for keyword matches
    for (const [keyword, response] of Object.entries(guidance.keywords || {})) {
      if (lower.includes(keyword)) {
        return response + "\n\n" + guidance.followUp;
      }
    }

    // General fallbacks
    const generalResponses = [
      "That's a great question. Let me think... The key idea in this lesson is **" + getLessonCoreIdea() + "**. What part feels fuzzy?",
      "Good question! In " + formatLessonName(session.currentLesson).toLowerCase() + ", the central concept is **" + getLessonCoreIdea() + "**. Want to walk through an example together?",
      "I like where your head's at. This connects to **" + getLessonCoreIdea() + "**. Try explaining it in your own words — I'll help fill gaps.",
      "That's exactly the kind of question that builds deep understanding. It ties to **" + getLessonCoreIdea() + "**. What's your current guess?"
    ];

    // If they seem stuck, offer more direct help
    const stuckSignals = ["don't understand", "confused", "stuck", "help", "explain", "what does", "how do", "why does", "lost"];
    if (stuckSignals.some(s => lower.includes(s))) {
      return randomChoice(TUTOR.struggleSupport) + " The heart of this lesson is **" + getLessonCoreIdea() + "**. " + guidance.followUp;
    }

    return randomChoice(generalResponses);
  }

  function getLessonCoreIdea() {
    const ideas = {
      "buffers-intro": "a weak acid + its conjugate base together neutralize added acid AND base",
      "henderson-hasselbalch": "pH = pKₐ + log([base]/[acid]) — the log ratio controls pH",
      "buffer-capacity": "capacity depends on BOTH total concentration AND how close the ratio is to 1:1",
      "vsepr": "count electron domains (not bonds!), place lone pairs to minimize repulsion, then name the shape",
      "overview": "buffers resist pH change; VSEPR predicts molecular shape from electron repulsion"
    };
    return ideas[session.currentLesson] || "the core concept on this page";
  }

  function showSuggestions() {
    const suggestions = getSuggestions();
    if (suggestions.length === 0) {
      suggestionsEl.style.display = "none";
      return;
    }
    suggestionsEl.innerHTML = suggestions.map(s => `<button class="suggestion-chip" data-suggestion="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("");
    suggestionsEl.style.display = "flex";
    suggestionsEl.querySelectorAll(".suggestion-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        inputEl.value = btn.dataset.suggestion;
        sendBtn.disabled = false;
        sendMessage();
      });
    });
  }

  function getSuggestions() {
    const base = [
      "Explain the main idea in one sentence",
      "Give me an analogy",
      "Walk me through a worked example",
      "What's the most common mistake here?"
    ];
    const lessonSpecific = {
      "buffers-intro": ["Why does the conjugate base matter?", "What happens if I only have weak acid?"],
      "henderson-hasselbalch": ["How do I pick the right pKₐ?", "What does the log ratio actually mean?"],
      "buffer-capacity": ["Why does 10:1 ratio have less capacity?", "How does dilution affect capacity?"],
      "vsepr": ["Why do lone pairs compress angles?", "How do I know where lone pairs go in trigonal bipyramidal?"]
    };
    return [...base, ...(lessonSpecific[session.currentLesson] || [])].slice(0, 6);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ============================================================
  // HOOK INTO SOCRATIC.JS
  // ============================================================
  function hookSocratic() {
    const check = setInterval(() => {
      const blocks = document.querySelectorAll(".socratic[data-question]");
      if (blocks.length && blocks[0].querySelector(".socratic-form")) {
        clearInterval(check);
        blocks.forEach(block => enhanceSocraticBlock(block));
      }
    }, 200);
  }

  function enhanceSocraticBlock(block) {
    const qid = block.getAttribute("data-question");
    const thread = block.querySelector(".socratic-thread");

    // Watch for tutor verdict messages from socratic.js
    const observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        if (mut.type === "childList") {
          for (const node of mut.addedNodes) {
            if (node.classList && node.classList.contains("socratic-msg") && node.classList.contains("tutor")) {
              const verdict = node.classList.contains("correct") ? "correct" :
                             node.classList.contains("partly") ? "partly" : "notyet";
              recordQuestionAttempt(qid, verdict);
              addTutorReaction(qid, verdict);
              observer.disconnect();
              return;
            }
          }
        }
      }
    });
    observer.observe(thread, { childList: true, subtree: true });
  }

  function addTutorReaction(qid, verdict) {
    const reactions = {
      correct: [
        "Excellent — you nailed the core idea. ",
        "That's exactly right. ",
        "Perfect. You're building solid intuition. "
      ],
      partly: [
        "Good start — you've got part of it. ",
        "You're on the right track. ",
        "Close! There's one more piece. "
      ],
      notyet: [
        "Not quite, but that's how learning works. ",
        "Good effort — let's unpick the misunderstanding. ",
        "This concept is tricky. Let's look at it differently. "
      ]
    };
    const followUps = {
      correct: "What would happen if we changed the concentration ratio?",
      partly: "Think about which component neutralizes what — what's missing?",
      notyet: "Want to talk through the mechanism step by step?"
    };

    const msg = randomChoice(reactions[verdict]) + followUps[verdict];
    addMessage("tutor", msg);
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        injectTutorUI();
        initTutor();
        hookSocratic();
      });
    } else {
      injectTutorUI();
      initTutor();
      hookSocratic();
    }
  }

  init();

})();