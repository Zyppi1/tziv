/* TZIV Test – teoretické aj praktické úlohy.
 * Statická stránka bez backendu. Všetko vyhodnocovanie beží lokálne v prehliadači.
 */

document.addEventListener('DOMContentLoaded', () => {
  const TOPICS = [
    ['ram', 'RAM'],
    ['abacus', 'Počítadlový stroj'],
    ['turing', 'Turingov stroj'],
    ['automata', 'Automaty'],
    ['grammar', 'Gramatiky'],
    ['proofs', 'Dôkazy'],
    ['complexity', 'Zložitosti'],
    ['crypto', 'Šifrovanie a kódovanie'],
    ['theory', 'Teória tried jazykov']
  ];

  const $ = (id) => document.getElementById(id);
  const seedInput = $('test-seed');
  const countInput = $('test-count');
  const modeInput = $('test-mode');
  const presetInput = $('test-preset');
  const difficultyInput = $('test-difficulty');
  const topicsDiv = $('test-topics');
  const generateBtn = $('generate-test');
  const evaluateAllBtn = $('evaluate-all');
  const showAllBtn = $('show-all-solutions');
  const summary = $('test-summary');
  const container = $('test-container');

  let currentTasks = [];

  TOPICS.forEach(([value, label]) => {
    const item = document.createElement('label');
    item.className = 'topic-chip';
    item.innerHTML = `<input type="checkbox" value="${value}" checked> ${escapeHtml(label)}`;
    topicsDiv.appendChild(item);
  });

  generateBtn.addEventListener('click', generateTest);
  evaluateAllBtn.addEventListener('click', () => currentTasks.forEach(t => evaluateTask(t.id)));
  showAllBtn.addEventListener('click', () => {
    currentTasks.forEach(t => {
      const sol = document.querySelector(`[data-solution-for="${cssEscape(t.id)}"]`);
      if (sol) sol.classList.remove('hidden');
    });
  });


  const TASK_BANK = [
  {
    "id": "mc-dfa-tuple",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "easy",
    "type": "mc",
    "title": "DKA – formálny zápis",
    "prompt": "Ktorý zápis je správna definícia deterministického konečného automatu?",
    "options": [
      "A = (K, Σ, δ, q0, F), δ : K × Σ → K",
      "A = (K, Σ, Γ, δ, q0, Z0, F)",
      "G = (N, T, P, S)",
      "M = (K, Σ, Γ, δ, q0, F), páska nekonečná"
    ],
    "answer": 0,
    "solution": "DKA je pätica s prechodom δ : K × Σ → K.",
    "points": 1
  },
  {
    "id": "mc-nfa-transition",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "easy",
    "type": "mc",
    "title": "NKA – prechodová funkcia",
    "prompt": "Aký tvar má prechodová funkcia NKA bez ε-prechodov?",
    "options": [
      "δ : K × Σ → K",
      "δ : K × Σ → 2^K",
      "δ : K × Γ → K",
      "δ : Σ × K → Γ"
    ],
    "answer": 1,
    "solution": "NKA môže mať viac cieľových stavov, preto δ vracia množinu stavov.",
    "points": 1
  },
  {
    "id": "mc-enfa-transition",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "easy",
    "type": "mc",
    "title": "ε-NKA",
    "prompt": "Čo je ε-prechod?",
    "options": [
      "prechod, ktorý spotrebuje ľubovoľný symbol",
      "prechod bez spotrebovania vstupného symbolu",
      "prechod iba do finálneho stavu",
      "prechod, ktorý vymaže zásobník"
    ],
    "answer": 1,
    "solution": "ε-prechod mení stav bez čítania znaku zo vstupu.",
    "points": 1
  },
  {
    "id": "mc-eclosure",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "medium",
    "type": "mc",
    "title": "ε-uzáver",
    "prompt": "ε-uzáver stavu q je:",
    "options": [
      "množina stavov dosiahnuteľných zo q iba ε-prechodmi vrátane q",
      "množina všetkých finálnych stavov",
      "množina všetkých slov nad abecedou",
      "stav po prečítaní posledného symbolu"
    ],
    "answer": 0,
    "solution": "ε-uzáver obsahuje q a všetky stavy dosiahnuteľné cez ε-prechody.",
    "points": 1
  },
  {
    "id": "mc-determinism-fa",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "easy",
    "type": "mc",
    "title": "Deterministickosť automatu",
    "prompt": "Automat má prechod q0 a -> q1,q2. Je deterministický?",
    "options": [
      "áno",
      "nie",
      "áno, ak q1 je finálny",
      "nedá sa rozhodnúť"
    ],
    "answer": 1,
    "solution": "Pre rovnaký stav a symbol sú dva ciele, preto nie je deterministický.",
    "points": 1
  },
  {
    "id": "mc-complete-dfa",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "medium",
    "type": "mc",
    "title": "Úplný DKA",
    "prompt": "Úplný DKA musí mať:",
    "options": [
      "pre každý stav a každý symbol práve jeden prechod",
      "aspoň jeden ε-prechod",
      "všetky stavy finálne",
      "žiadny cyklus"
    ],
    "answer": 0,
    "solution": "Úplnosť znamená definovaný prechod pre každú dvojicu stav-symbol.",
    "points": 1
  },
  {
    "id": "mc-pda-tuple",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "easy",
    "type": "mc",
    "title": "PDA – formálny zápis",
    "prompt": "Ktorý zápis zodpovedá zásobníkovému automatu?",
    "options": [
      "(K, Σ, δ, q0, F)",
      "(K, Σ, Γ, δ, q0, Z0, F)",
      "(N, T, P, S)",
      "(Q, Γ, δ, q0, B, F)"
    ],
    "answer": 1,
    "solution": "PDA potrebuje vstupnú abecedu, zásobníkovú abecedu a počiatočný symbol zásobníka.",
    "points": 1
  },
  {
    "id": "mc-pda-acceptance",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "medium",
    "type": "mc",
    "title": "Akceptovanie PDA",
    "prompt": "Ktoré dva spôsoby akceptovania PDA sa štandardne porovnávajú?",
    "options": [
      "finálnym stavom a prázdnym zásobníkom",
      "najkratšou cestou a najdlhšou cestou",
      "regulárnym výrazom a gramatikou",
      "ľavým a pravým prechodom"
    ],
    "answer": 0,
    "solution": "PDA sa často definuje akceptovaním finálnym stavom alebo prázdnym zásobníkom.",
    "points": 1
  },
  {
    "id": "mc-dpda-npda",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "medium",
    "type": "mc",
    "title": "DPDA a NPDA",
    "prompt": "Aký je vzťah medzi jazykmi DPDA a NPDA?",
    "options": [
      "L(DPDA) = L(NPDA)",
      "L(DPDA) je vlastná podtrieda L(NPDA)",
      "L(NPDA) je vlastná podtrieda L(DPDA)",
      "sú neporovnateľné"
    ],
    "answer": 1,
    "solution": "DPDA je obmedzenejší než NPDA.",
    "points": 1
  },
  {
    "id": "mc-lba-language",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "medium",
    "type": "mc",
    "title": "LBA",
    "prompt": "Lineárne ohraničený automat rozpoznáva najmä:",
    "options": [
      "regulárne jazyky",
      "bezkontextové jazyky",
      "kontextové jazyky",
      "iba konečné jazyky"
    ],
    "answer": 2,
    "solution": "LBA zodpovedá kontextovým jazykom.",
    "points": 1
  },
  {
    "id": "mc-tm-tuple",
    "mode": "theory",
    "topic": "turing",
    "difficulty": "easy",
    "type": "mc",
    "title": "TS – formálny zápis",
    "prompt": "Turingov stroj v prezentáciách zapisujeme ako:",
    "options": [
      "(K, Σ, Γ, δ, q0, F)",
      "(N, T, P, S)",
      "(K, Σ, δ, q0, F)",
      "(R0, R1, P, I)"
    ],
    "answer": 0,
    "solution": "TS má stavy, vstupnú a pracovnú abecedu, prechodovú funkciu, štart a finálne stavy.",
    "points": 1
  },
  {
    "id": "mc-tm-dir",
    "mode": "theory",
    "topic": "turing",
    "difficulty": "easy",
    "type": "mc",
    "title": "Pohyb hlavy TS",
    "prompt": "Symbol R v prechode TS znamená:",
    "options": [
      "pohyb hlavy doprava",
      "pohyb hlavy doľava",
      "reset stroja",
      "náhodný krok"
    ],
    "answer": 0,
    "solution": "R je pohyb doprava.",
    "points": 1
  },
  {
    "id": "mc-tm-blank",
    "mode": "theory",
    "topic": "turing",
    "difficulty": "easy",
    "type": "mc",
    "title": "Prázdny symbol",
    "prompt": "V simulátore používame ako prázdny symbol pásky:",
    "options": [
      "#",
      "ε",
      "_",
      "0"
    ],
    "answer": 2,
    "solution": "Prázdny symbol je _.",
    "points": 1
  },
  {
    "id": "mc-halting",
    "mode": "theory",
    "topic": "turing",
    "difficulty": "medium",
    "type": "mc",
    "title": "Problém zastavenia",
    "prompt": "Všeobecný problém zastavenia TS je:",
    "options": [
      "rozhodnuteľný",
      "nerozhodnuteľný",
      "regulárny",
      "bezkontextový"
    ],
    "answer": 1,
    "solution": "Halting problem je klasicky nerozhodnuteľný.",
    "points": 1
  },
  {
    "id": "mc-pcp",
    "mode": "theory",
    "topic": "turing",
    "difficulty": "medium",
    "type": "mc",
    "title": "PCP",
    "prompt": "Postov korešpondenčný problém je známy tým, že je:",
    "options": [
      "triviálny",
      "regulárny",
      "nerozhodnuteľný",
      "vždy konečný"
    ],
    "answer": 2,
    "solution": "PCP je štandardný nerozhodnuteľný problém.",
    "points": 1
  },
  {
    "id": "mc-rice",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "hard",
    "type": "mc",
    "title": "Riceova veta",
    "prompt": "Riceova veta hovorí o:",
    "options": [
      "netriviálnych vlastnostiach RE jazykov",
      "počte stavov DKA",
      "dĺžke zásobníka",
      "šifrovaní"
    ],
    "answer": 0,
    "solution": "Riceova veta tvrdí nerozhodnuteľnosť netriviálnych sémantických vlastností RE jazykov.",
    "points": 1
  },
  {
    "id": "mc-regular-grammar-form",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "easy",
    "type": "mc",
    "title": "Regulárna gramatika",
    "prompt": "Pravolineárne regulárne pravidlo má tvar napr.:",
    "options": [
      "A -> aB",
      "AB -> a",
      "A -> aSb",
      "aA -> Aa"
    ],
    "answer": 0,
    "solution": "Pravolineárne pravidlá majú terminál a prípadne neterminál vpravo.",
    "points": 1
  },
  {
    "id": "mc-left-linear",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "easy",
    "type": "mc",
    "title": "Ľavolineárna gramatika",
    "prompt": "Ľavolineárne pravidlo je napr.:",
    "options": [
      "A -> Ba",
      "A -> aB",
      "AB -> a",
      "A -> aSb"
    ],
    "answer": 0,
    "solution": "Pri ľavolineárnom tvare je neterminál pred terminálom.",
    "points": 1
  },
  {
    "id": "mc-cfg-left",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "easy",
    "type": "mc",
    "title": "Bezkontextová gramatika",
    "prompt": "Bezkontextové pravidlo má na ľavej strane:",
    "options": [
      "presne jeden neterminál",
      "ľubovoľné slovo terminálov",
      "dva neterminály",
      "iba terminály"
    ],
    "answer": 0,
    "solution": "CFG má ľavú stranu jeden neterminál.",
    "points": 1
  },
  {
    "id": "mc-context-sensitive",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "mc",
    "title": "Kontextová gramatika",
    "prompt": "Pre kontextovú gramatiku typicky platí:",
    "options": [
      "pravidlá neskracujú: |u| ≤ |v|",
      "každé pravidlo má tvar A -> aB",
      "ľavá strana je vždy terminál",
      "neobsahuje neterminály"
    ],
    "answer": 0,
    "solution": "Kontextové pravidlá neskracujú okrem špeciálnej výnimky S -> ε.",
    "points": 1
  },
  {
    "id": "mc-type0",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "mc",
    "title": "Frázová gramatika",
    "prompt": "Frázová gramatika typu 0:",
    "options": [
      "je najvšeobecnejšia",
      "je slabšia ako regulárna",
      "má iba pravidlá A -> a",
      "nemá žiadne neterminály"
    ],
    "answer": 0,
    "solution": "Typ 0 je najvšeobecnejšia trieda gramatík.",
    "points": 1
  },
  {
    "id": "mc-cnf",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "mc",
    "title": "Chomského normálny tvar",
    "prompt": "CNF používa pravidlá:",
    "options": [
      "A -> BC alebo A -> a",
      "A -> aα",
      "A -> aB iba",
      "AB -> BA iba"
    ],
    "answer": 0,
    "solution": "Chomského normálny tvar má A -> BC alebo A -> a, prípadne S -> ε.",
    "points": 1
  },
  {
    "id": "mc-gnf",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "mc",
    "title": "Greibachovej normálny tvar",
    "prompt": "GNF pravidlo začína:",
    "options": [
      "terminálom",
      "dvoma neterminálmi",
      "prázdnym slovom vždy",
      "kontextom zľava aj sprava"
    ],
    "answer": 0,
    "solution": "V GNF má pravidlo tvar A -> aα.",
    "points": 1
  },
  {
    "id": "mc-hierarchy",
    "mode": "theory",
    "topic": "theory",
    "difficulty": "easy",
    "type": "mc",
    "title": "Chomského hierarchia",
    "prompt": "Správne poradie tried je:",
    "options": [
      "R ⊆ LCF ⊆ LCS ⊆ LRE",
      "LRE ⊆ LCS ⊆ LCF ⊆ R",
      "LCF ⊆ R ⊆ LRE",
      "R = LCF = LCS"
    ],
    "answer": 0,
    "solution": "Regulárne sú podtriedou bezkontextových, tie kontextových, tie RE.",
    "points": 1
  },
  {
    "id": "mc-regular-complement",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "mc",
    "title": "Komplement regulárneho jazyka",
    "prompt": "Ako dokážeme uzáver regulárnych jazykov na komplement?",
    "options": [
      "v úplnom DKA vymeníme finálne a nefinálne stavy",
      "pridáme zásobník",
      "použijeme PCP",
      "zakážeme ε"
    ],
    "answer": 0,
    "solution": "Pre úplný DKA stačí doplnok množiny finálnych stavov.",
    "points": 1
  },
  {
    "id": "mc-regular-union",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "mc",
    "title": "Zjednotenie regulárnych jazykov",
    "prompt": "Pri súčinovej konštrukcii pre L1 ∪ L2 sú finálne stavy:",
    "options": [
      "F1 × F2",
      "(F1 × K2) ∪ (K1 × F2)",
      "K1 × K2 bez F1",
      "iba počiatočný stav"
    ],
    "answer": 1,
    "solution": "Pre zjednotenie stačí, aby akceptovala aspoň jedna zložka.",
    "points": 1
  },
  {
    "id": "mc-regular-intersection",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "mc",
    "title": "Prienik regulárnych jazykov",
    "prompt": "Pri súčinovej konštrukcii pre L1 ∩ L2 sú finálne stavy:",
    "options": [
      "F1 × F2",
      "F1 × K2",
      "K1 × F2",
      "prázdna množina vždy"
    ],
    "answer": 0,
    "solution": "Pre prienik musia akceptovať obe zložky.",
    "points": 1
  },
  {
    "id": "mc-cfg-union",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "easy",
    "type": "mc",
    "title": "LCF a zjednotenie",
    "prompt": "Trieda bezkontextových jazykov je uzavretá na:",
    "options": [
      "zjednotenie",
      "komplement vždy",
      "prienik vždy",
      "rozdiel vždy"
    ],
    "answer": 0,
    "solution": "LCF je uzavretá na zjednotenie.",
    "points": 1
  },
  {
    "id": "mc-cfg-intersection",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "mc",
    "title": "LCF a prienik",
    "prompt": "Trieda bezkontextových jazykov vo všeobecnosti nie je uzavretá na:",
    "options": [
      "zjednotenie",
      "zreťazenie",
      "Kleeneho hviezdu",
      "prienik"
    ],
    "answer": 3,
    "solution": "Bezkontextové jazyky nie sú vo všeobecnosti uzavreté na prienik.",
    "points": 1
  },
  {
    "id": "mc-lre-union",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "mc",
    "title": "LRE a zjednotenie",
    "prompt": "LRE je uzavretá na zjednotenie, lebo:",
    "options": [
      "simulujeme rozpoznávače paralelne a akceptujeme, keď jeden akceptuje",
      "vymeníme finálne stavy",
      "vymažeme zásobník",
      "jazyk je konečný"
    ],
    "answer": 0,
    "solution": "Dovetailing dvoch rozpoznávačov dá rozpoznávač zjednotenia.",
    "points": 1
  },
  {
    "id": "mc-lre-complement",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "mc",
    "title": "LRE a komplement",
    "prompt": "LRE je vo všeobecnosti uzavretá na komplement?",
    "options": [
      "áno",
      "nie",
      "iba pre regulárne abecedy",
      "iba ak je jazyk nekonečný"
    ],
    "answer": 1,
    "solution": "LRE nie je všeobecne uzavretá na komplement.",
    "points": 1
  },
  {
    "id": "mc-recursive-complement",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "mc",
    "title": "Rekurzívne jazyky",
    "prompt": "Rekurzívne/rozhodnuteľné jazyky sú uzavreté na komplement, pretože:",
    "options": [
      "rozhodovač vždy zastaví a odpoveď možno otočiť",
      "NKA má ε-prechody",
      "PDA má zásobník",
      "každý jazyk je konečný"
    ],
    "answer": 0,
    "solution": "Ak rozhodovač vždy zastaví, stačí zmeniť áno na nie a naopak.",
    "points": 1
  },
  {
    "id": "mc-p-subset-pspace",
    "mode": "theory",
    "topic": "complexity",
    "difficulty": "medium",
    "type": "mc",
    "title": "PTIME a PSPACE",
    "prompt": "Platí:",
    "options": [
      "PTIME ⊆ PSPACE",
      "PSPACE ⊆ PTIME je známe",
      "PTIME a PSPACE sú disjunktné",
      "PTIME neobsahuje žiadne jazyky"
    ],
    "answer": 0,
    "solution": "Polynomiálny čas použije najviac polynomiálny priestor.",
    "points": 1
  },
  {
    "id": "mc-ram-accumulator",
    "mode": "theory",
    "topic": "ram",
    "difficulty": "easy",
    "type": "mc",
    "title": "RAM akumulátor",
    "prompt": "V RAM modeli je akumulátor typicky register:",
    "options": [
      "R0",
      "R1",
      "R2",
      "posledný register"
    ],
    "answer": 0,
    "solution": "R0 je akumulátor.",
    "points": 1
  },
  {
    "id": "mc-ram-unit-time",
    "mode": "theory",
    "topic": "complexity",
    "difficulty": "easy",
    "type": "mc",
    "title": "Jednotkový čas RAM",
    "prompt": "Jednotková časová zložitosť riadku je:",
    "options": [
      "počet vykonaní inštrukcie",
      "veľkosť najväčšieho registra",
      "počet všetkých registrov v počítači",
      "počet komentárov"
    ],
    "answer": 0,
    "solution": "V jednotkovej miere každé vykonanie inštrukcie stojí 1.",
    "points": 1
  },
  {
    "id": "mc-ram-jump-test",
    "mode": "theory",
    "topic": "complexity",
    "difficulty": "medium",
    "type": "mc",
    "title": "Test cyklu na začiatku",
    "prompt": "Ak test cyklu stojí na začiatku a telo sa vykoná n-krát, test sa vykoná:",
    "options": [
      "n-krát",
      "n+1-krát",
      "1-krát",
      "2n-krát"
    ],
    "answer": 1,
    "solution": "Na začiatku sa testuje aj posledný neúspešný pokus.",
    "points": 1
  },
  {
    "id": "mc-ram-log-space",
    "mode": "theory",
    "topic": "complexity",
    "difficulty": "medium",
    "type": "mc",
    "title": "Logaritmický priestor RAM",
    "prompt": "Logaritmický priestor sčíta:",
    "options": [
      "bitové dĺžky najväčších hodnôt v použitých registroch",
      "iba počet riadkov programu",
      "iba počet vstupov",
      "iba počet návestí"
    ],
    "answer": 0,
    "solution": "Priestor závisí od maxima uloženého v registroch.",
    "points": 1
  },
  {
    "id": "mc-ram-store-cost",
    "mode": "theory",
    "topic": "complexity",
    "difficulty": "hard",
    "type": "mc",
    "title": "Logaritmická cena STORE",
    "prompt": "Cena STORE i podľa zadania závisí od:",
    "options": [
      "l(c(0)) + l(i)",
      "iba od l(i)",
      "iba od počtu návestí",
      "od výstupnej pásky"
    ],
    "answer": 0,
    "solution": "STORE i platí za obsah akumulátora a index registra.",
    "points": 1
  },
  {
    "id": "mc-abacus-instructions",
    "mode": "theory",
    "topic": "abacus",
    "difficulty": "easy",
    "type": "mc",
    "title": "Abacus príkazy",
    "prompt": "Základné príkazy počítadlového stroja sú:",
    "options": [
      "ak a sk",
      "LOAD a STORE",
      "READ a WRITE",
      "L a R"
    ],
    "answer": 0,
    "solution": "Počítadlový stroj používa inkrementáciu a dekrementáciu registrov.",
    "points": 1
  },
  {
    "id": "mc-abacus-loop",
    "mode": "theory",
    "topic": "abacus",
    "difficulty": "easy",
    "type": "mc",
    "title": "Abacus cyklus",
    "prompt": "Zápis (M)k znamená:",
    "options": [
      "opakuj M, kým Rk nie je nulový",
      "vykonaj M presne k-krát",
      "vymaž register k",
      "skoč na riadok k"
    ],
    "answer": 0,
    "solution": "Cyklus sa opakuje podľa nenulovosti registra Rk.",
    "points": 1
  },
  {
    "id": "mc-abacus-s",
    "mode": "theory",
    "topic": "abacus",
    "difficulty": "easy",
    "type": "mc",
    "title": "Dekrementácia",
    "prompt": "Príkaz s3 urobí:",
    "options": [
      "zníži R3 o 1, ak je väčší ako 0",
      "zvýši R3 o 1",
      "vypíše R3",
      "zastaví program"
    ],
    "answer": 0,
    "solution": "s_k je dekrementácia registra.",
    "points": 1
  },
  {
    "id": "mc-regex-star",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "easy",
    "type": "mc",
    "title": "Kleeneho hviezda",
    "prompt": "Výraz a* znamená:",
    "options": [
      "0 alebo viac opakovaní a",
      "presne jedno a",
      "aspoň jedno a",
      "reverz slova a"
    ],
    "answer": 0,
    "solution": "Hviezda povoľuje aj ε.",
    "points": 1
  },
  {
    "id": "mc-regex-plus",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "easy",
    "type": "mc",
    "title": "Kladná iterácia",
    "prompt": "Výraz a+ znamená:",
    "options": [
      "aspoň jedno a",
      "0 alebo viac a",
      "presne dve a",
      "iba ε"
    ],
    "answer": 0,
    "solution": "Plus znamená jedno alebo viac opakovaní.",
    "points": 1
  },
  {
    "id": "mc-regex-power",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "easy",
    "type": "mc",
    "title": "Mocnina jazyka",
    "prompt": "Ak L = {ab}, potom L^2 je:",
    "options": [
      "{abab}",
      "{ab, ab}",
      "{aabb}",
      "{ε, ab}"
    ],
    "answer": 0,
    "solution": "L^2 = L·L = {abab}.",
    "points": 1
  },
  {
    "id": "mc-reversal",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "easy",
    "type": "mc",
    "title": "Reverz slova",
    "prompt": "Reverz slova abba je:",
    "options": [
      "abba",
      "aabb",
      "baba",
      "baab"
    ],
    "answer": 0,
    "solution": "abba je palindrom, jeho reverz je rovnaký.",
    "points": 1
  },
  {
    "id": "mc-count-symbol",
    "mode": "theory",
    "topic": "automata",
    "difficulty": "easy",
    "type": "mc",
    "title": "Počet symbolov",
    "prompt": "Zápis #a(w) označuje:",
    "options": [
      "počet výskytov a v slove w",
      "počet všetkých slov v jazyku",
      "ASCII kód a",
      "počet stavov automatu"
    ],
    "answer": 0,
    "solution": "#a(w) je počet symbolov a v slove.",
    "points": 1
  },
  {
    "id": "mc-language-anbn",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "mc",
    "title": "Jazyk a^n b^n",
    "prompt": "Jazyk {a^n b^n | n ≥ 0} je:",
    "options": [
      "regulárny",
      "bezkontextový, nie regulárny",
      "kontextový, nie bezkontextový",
      "nie je rekurzívne vyčísliteľný"
    ],
    "answer": 1,
    "solution": "Generuje ho napr. S -> aSb | ε, ale nie je regulárny.",
    "points": 1
  },
  {
    "id": "mc-language-pal",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "mc",
    "title": "Palindrómy",
    "prompt": "Jazyk palindrómov nad {a,b} je typicky:",
    "options": [
      "bezkontextový",
      "regulárny vždy",
      "nie je rozhodnuteľný",
      "iba konečný"
    ],
    "answer": 0,
    "solution": "Palindrómy vie generovať CFG S -> aSa | bSb | a | b | ε.",
    "points": 1
  },
  {
    "id": "mc-automaton-to-grammar",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "mc",
    "title": "Automat → gramatika",
    "prompt": "Prechod q0 --a--> q1 sa v pravolineárnej gramatike zapíše ako:",
    "options": [
      "Q0 -> aQ1",
      "Q1 -> aQ0",
      "Q0 -> Q1aQ0",
      "a -> Q0Q1"
    ],
    "answer": 0,
    "solution": "Prechod sa prepíše na pravidlo Q0 -> aQ1.",
    "points": 1
  },
  {
    "id": "mc-grammar-to-automaton",
    "mode": "theory",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "mc",
    "title": "Gramatika → automat",
    "prompt": "Pravidlo A -> aB dáva v automate prechod:",
    "options": [
      "A --a--> B",
      "B --a--> A",
      "A --B--> a",
      "a --A--> B"
    ],
    "answer": 0,
    "solution": "Terminál je značka hrany, neterminál cieľový stav.",
    "points": 1
  },
  {
    "id": "mc-vigenere",
    "mode": "theory",
    "topic": "crypto",
    "difficulty": "easy",
    "type": "mc",
    "title": "Vigenèrova šifra",
    "prompt": "Vigenèrova šifra používa:",
    "options": [
      "opakovaný kľúč a posuny písmen",
      "zásobník",
      "Turingovu pásku",
      "iba jeden pevný posun vždy"
    ],
    "answer": 0,
    "solution": "Vigenère opakuje kľúč a podľa neho posúva písmená.",
    "points": 1
  },
  {
    "id": "mc-caesar",
    "mode": "theory",
    "topic": "crypto",
    "difficulty": "easy",
    "type": "mc",
    "title": "Cézarova šifra",
    "prompt": "Cézarova šifra je:",
    "options": [
      "posunová substitučná šifra",
      "zásobníkový automat",
      "bezkontextová gramatika",
      "hashovacia funkcia"
    ],
    "answer": 0,
    "solution": "Cézar posúva každé písmeno o rovnakú hodnotu.",
    "points": 1
  },
  {
    "id": "mc-vernam",
    "mode": "theory",
    "topic": "crypto",
    "difficulty": "medium",
    "type": "mc",
    "title": "Vernamova šifra",
    "prompt": "Vernamova šifra kombinuje bitový text a kľúč pomocou:",
    "options": [
      "XOR",
      "AND vždy",
      "sčítania v desiatkovej sústave",
      "delenia modulo 3"
    ],
    "answer": 0,
    "solution": "Vernam používa XOR.",
    "points": 1
  },
  {
    "id": "mc-huffman",
    "mode": "theory",
    "topic": "crypto",
    "difficulty": "medium",
    "type": "mc",
    "title": "Huffmanovo kódovanie",
    "prompt": "Huffmanovo kódovanie vytvára:",
    "options": [
      "prefixový kód podľa frekvencií",
      "Turingov stroj",
      "NKA s ε-prechodmi",
      "lineárne ohraničený automat"
    ],
    "answer": 0,
    "solution": "Huffman vytvára efektívny prefixový kód.",
    "points": 1
  },
  {
    "id": "mc-church",
    "mode": "theory",
    "topic": "turing",
    "difficulty": "medium",
    "type": "mc",
    "title": "Churchova–Turingova téza",
    "prompt": "Churchova–Turingova téza tvrdí, že:",
    "options": [
      "intuitívne algoritmicky vypočítateľné funkcie sú Turingovsky vypočítateľné",
      "každý jazyk je regulárny",
      "P = NP je dokázané",
      "každý NKA je zásobníkový automat"
    ],
    "answer": 0,
    "solution": "Téza spája intuitívny pojem algoritmu s TS.",
    "points": 1
  },
  {
    "id": "mc-universal-tm",
    "mode": "theory",
    "topic": "turing",
    "difficulty": "medium",
    "type": "mc",
    "title": "Univerzálny TS",
    "prompt": "Univerzálny Turingov stroj vie:",
    "options": [
      "simulovať iný TS zo zakódovaného popisu",
      "akceptovať iba regulárne jazyky",
      "pracovať bez pásky",
      "rozhodnúť každý problém"
    ],
    "answer": 0,
    "solution": "Univerzálny TS simuluje stroj z jeho kódu a vstupu.",
    "points": 1
  },
  {
    "id": "mc-ram-am-equiv",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "mc",
    "title": "RAM a AM",
    "prompt": "RAM a počítadlový stroj AM sú z hľadiska vypočítateľnosti:",
    "options": [
      "ekvivalentné",
      "neporovnateľné",
      "RAM je slabší než konečný automat",
      "AM nevie simulovať cykly"
    ],
    "answer": 0,
    "solution": "Modely sa vedia navzájom simulovať.",
    "points": 1
  },
  {
    "id": "mc-ts-ram-equiv",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "mc",
    "title": "RAM a TS",
    "prompt": "RAM a Turingov stroj:",
    "options": [
      "majú rovnakú výpočtovú silu",
      "nemajú nič spoločné",
      "RAM vie iba regulárne jazyky",
      "TS nevie počítať aritmetiku"
    ],
    "answer": 0,
    "solution": "Oba modely sú výpočtovo ekvivalentné.",
    "points": 1
  },
  {
    "id": "prg-ram-add",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "easy",
    "type": "ram-code",
    "title": "RAM: sčítanie",
    "prompt": "Napíš RAM program, ktorý načíta a, b a vypíše a+b.",
    "tests": [
      {
        "input": "2 3",
        "output": "5"
      },
      {
        "input": "0 7",
        "output": "7"
      },
      {
        "input": "10 4",
        "output": "14"
      }
    ],
    "starter": "# TODO: načítaj dve čísla a vypíš súčet",
    "solution": "READ 1\nREAD 2\nLOAD 1\nADD 2\nWRITE 0\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-sub",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "easy",
    "type": "ram-code",
    "title": "RAM: orezané odčítanie",
    "prompt": "Načítaj a,b a vypíš max(a-b,0).",
    "tests": [
      {
        "input": "7 2",
        "output": "5"
      },
      {
        "input": "2 7",
        "output": "0"
      },
      {
        "input": "5 5",
        "output": "0"
      }
    ],
    "starter": "# TODO",
    "solution": "READ 1\nREAD 2\nLOAD 1\nSUB 2\nWRITE 0\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-double",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "easy",
    "type": "ram-code",
    "title": "RAM: dvojnásobok",
    "prompt": "Načítaj n a vypíš 2n.",
    "tests": [
      {
        "input": "3",
        "output": "6"
      },
      {
        "input": "0",
        "output": "0"
      },
      {
        "input": "9",
        "output": "18"
      }
    ],
    "starter": "# TODO",
    "solution": "READ 1\nLOAD 1\nADD 1\nWRITE 0\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-triple",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "easy",
    "type": "ram-code",
    "title": "RAM: trojnásobok",
    "prompt": "Načítaj n a vypíš 3n.",
    "tests": [
      {
        "input": "3",
        "output": "9"
      },
      {
        "input": "1",
        "output": "3"
      },
      {
        "input": "0",
        "output": "0"
      }
    ],
    "starter": "# TODO",
    "solution": "READ 1\nLOAD 1\nADD 1\nADD 1\nWRITE 0\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-mul",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "medium",
    "type": "ram-code",
    "title": "RAM: násobenie cyklom",
    "prompt": "Načítaj a,b a vypíš a·b. Nepouži MUL/MULT, použi opakovanú sumu.",
    "tests": [
      {
        "input": "2 3",
        "output": "6"
      },
      {
        "input": "4 5",
        "output": "20"
      },
      {
        "input": "0 8",
        "output": "0"
      }
    ],
    "starter": "# TODO: R3 bude výsledok",
    "solution": "READ 1\nREAD 2\nLOAD =0\nSTORE 3\nloop:\nLOAD 2\nJZERO end\nLOAD 3\nADD 1\nSTORE 3\nLOAD 2\nSUB =1\nSTORE 2\nJUMP loop\nend:\nWRITE 3\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-factorial",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "hard",
    "type": "ram-code",
    "title": "RAM: faktoriál",
    "prompt": "Načítaj n a vypíš n!. Môžeš použiť MUL alebo MULT.",
    "tests": [
      {
        "input": "0",
        "output": "1"
      },
      {
        "input": "1",
        "output": "1"
      },
      {
        "input": "5",
        "output": "120"
      }
    ],
    "starter": "# TODO",
    "solution": "READ 1\nLOAD =1\nSTORE 2\nloop:\nLOAD 1\nJZERO end\nLOAD 2\nMUL 1\nSTORE 2\nLOAD 1\nSUB =1\nSTORE 1\nJUMP loop\nend:\nWRITE 2\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-power",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "hard",
    "type": "ram-code",
    "title": "RAM: mocnina",
    "prompt": "Načítaj a,b a vypíš a^b. Môžeš použiť MUL.",
    "tests": [
      {
        "input": "2 3",
        "output": "8"
      },
      {
        "input": "5 0",
        "output": "1"
      },
      {
        "input": "3 4",
        "output": "81"
      }
    ],
    "starter": "# TODO",
    "solution": "READ 1\nREAD 2\nLOAD =1\nSTORE 3\nloop:\nLOAD 2\nJZERO end\nLOAD 3\nMUL 1\nSTORE 3\nLOAD 2\nSUB =1\nSTORE 2\nJUMP loop\nend:\nWRITE 3\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-max",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "medium",
    "type": "ram-code",
    "title": "RAM: maximum",
    "prompt": "Načítaj a,b a vypíš max(a,b).",
    "tests": [
      {
        "input": "2 7",
        "output": "7"
      },
      {
        "input": "9 3",
        "output": "9"
      },
      {
        "input": "4 4",
        "output": "4"
      }
    ],
    "starter": "# TODO",
    "solution": "READ 1\nREAD 2\nLOAD 1\nSUB 2\nJGTZ first\nLOAD 2\nWRITE 0\nHALT\nfirst:\nLOAD 1\nWRITE 0\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-min",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "medium",
    "type": "ram-code",
    "title": "RAM: minimum",
    "prompt": "Načítaj a,b a vypíš min(a,b).",
    "tests": [
      {
        "input": "2 7",
        "output": "2"
      },
      {
        "input": "9 3",
        "output": "3"
      },
      {
        "input": "4 4",
        "output": "4"
      }
    ],
    "starter": "# TODO",
    "solution": "READ 1\nREAD 2\nLOAD 1\nSUB 2\nJGTZ second\nLOAD 1\nWRITE 0\nHALT\nsecond:\nLOAD 2\nWRITE 0\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-iszero",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "easy",
    "type": "ram-code",
    "title": "RAM: test nuly",
    "prompt": "Načítaj n. Ak n=0 vypíš 1, inak vypíš 0.",
    "tests": [
      {
        "input": "0",
        "output": "1"
      },
      {
        "input": "5",
        "output": "0"
      },
      {
        "input": "1",
        "output": "0"
      }
    ],
    "starter": "# TODO",
    "solution": "READ 1\nLOAD 1\nJZERO yes\nLOAD =0\nWRITE 0\nHALT\nyes:\nLOAD =1\nWRITE 0\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-sum-to-n",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "medium",
    "type": "ram-code",
    "title": "RAM: súčet 1..n",
    "prompt": "Načítaj n a vypíš 1+2+...+n.",
    "tests": [
      {
        "input": "0",
        "output": "0"
      },
      {
        "input": "1",
        "output": "1"
      },
      {
        "input": "5",
        "output": "15"
      }
    ],
    "starter": "# TODO",
    "solution": "READ 1\nLOAD =0\nSTORE 2\nloop:\nLOAD 1\nJZERO end\nLOAD 2\nADD 1\nSTORE 2\nLOAD 1\nSUB =1\nSTORE 1\nJUMP loop\nend:\nWRITE 2\nHALT",
    "points": 4
  },
  {
    "id": "prg-ram-absdiff",
    "mode": "practical",
    "topic": "ram",
    "difficulty": "medium",
    "type": "ram-code",
    "title": "RAM: absolútny rozdiel",
    "prompt": "Načítaj a,b a vypíš |a-b|.",
    "tests": [
      {
        "input": "7 2",
        "output": "5"
      },
      {
        "input": "2 7",
        "output": "5"
      },
      {
        "input": "4 4",
        "output": "0"
      }
    ],
    "starter": "# TODO",
    "solution": "READ 1\nREAD 2\nLOAD 1\nSUB 2\nSTORE 3\nLOAD 2\nSUB 1\nSTORE 4\nLOAD 3\nADD 4\nWRITE 0\nHALT",
    "points": 4
  },
  {
    "id": "prg-abacus-zero",
    "mode": "practical",
    "topic": "abacus",
    "difficulty": "easy",
    "type": "abacus-code",
    "title": "Abacus: vynuluj R1",
    "prompt": "Napíš program, ktorý nastaví R1 na 0.",
    "tests": [
      {
        "regs": [
          3
        ],
        "expect": {
          "1": 0
        }
      },
      {
        "regs": [
          0
        ],
        "expect": {
          "1": 0
        }
      }
    ],
    "starter": "",
    "solution": "(s1)1",
    "points": 4
  },
  {
    "id": "prg-abacus-move12",
    "mode": "practical",
    "topic": "abacus",
    "difficulty": "easy",
    "type": "abacus-code",
    "title": "Abacus: presun R1 do R2",
    "prompt": "Presuň hodnotu R1 do R2. Po skončení R1=0 a R2 sa zväčší o pôvodné R1.",
    "tests": [
      {
        "regs": [
          3,
          0
        ],
        "expect": {
          "1": 0,
          "2": 3
        }
      },
      {
        "regs": [
          5,
          2
        ],
        "expect": {
          "1": 0,
          "2": 7
        }
      }
    ],
    "starter": "",
    "solution": "(s1 a2)1",
    "points": 4
  },
  {
    "id": "prg-abacus-double",
    "mode": "practical",
    "topic": "abacus",
    "difficulty": "easy",
    "type": "abacus-code",
    "title": "Abacus: dvojnásobok",
    "prompt": "Presuň 2·R1 do R2. Po skončení R1=0.",
    "tests": [
      {
        "regs": [
          3,
          0
        ],
        "expect": {
          "1": 0,
          "2": 6
        }
      },
      {
        "regs": [
          4,
          1
        ],
        "expect": {
          "1": 0,
          "2": 9
        }
      }
    ],
    "starter": "",
    "solution": "(s1 a2 a2)1",
    "points": 4
  },
  {
    "id": "prg-abacus-triple",
    "mode": "practical",
    "topic": "abacus",
    "difficulty": "easy",
    "type": "abacus-code",
    "title": "Abacus: trojnásobok",
    "prompt": "Presuň 3·R1 do R2. Po skončení R1=0.",
    "tests": [
      {
        "regs": [
          2,
          0
        ],
        "expect": {
          "1": 0,
          "2": 6
        }
      },
      {
        "regs": [
          3,
          1
        ],
        "expect": {
          "1": 0,
          "2": 10
        }
      }
    ],
    "starter": "",
    "solution": "(s1 a2 a2 a2)1",
    "points": 4
  },
  {
    "id": "prg-abacus-add13",
    "mode": "practical",
    "topic": "abacus",
    "difficulty": "medium",
    "type": "abacus-code",
    "title": "Abacus: sčítanie do R3",
    "prompt": "Spočítaj R1+R2 do R3. R1 a R2 môžu byť na konci nulové.",
    "tests": [
      {
        "regs": [
          2,
          3,
          0
        ],
        "expect": {
          "1": 0,
          "2": 0,
          "3": 5
        }
      },
      {
        "regs": [
          4,
          1,
          7
        ],
        "expect": {
          "1": 0,
          "2": 0,
          "3": 12
        }
      }
    ],
    "starter": "",
    "solution": "(s1 a3)1 (s2 a3)2",
    "points": 4
  },
  {
    "id": "prg-abacus-copy-preserve",
    "mode": "practical",
    "topic": "abacus",
    "difficulty": "medium",
    "type": "abacus-code",
    "title": "Abacus: kopírovanie so zachovaním",
    "prompt": "Skopíruj R1 do R2 tak, aby sa R1 zachoval. Použi pomocný R3. Predpokladaj R2=0,R3=0.",
    "tests": [
      {
        "regs": [
          3,
          0,
          0
        ],
        "expect": {
          "1": 3,
          "2": 3,
          "3": 0
        }
      },
      {
        "regs": [
          5,
          0,
          0
        ],
        "expect": {
          "1": 5,
          "2": 5,
          "3": 0
        }
      }
    ],
    "starter": "",
    "solution": "(s1 a2 a3)1 (s3 a1)3",
    "points": 4
  },
  {
    "id": "prg-abacus-add-preserve",
    "mode": "practical",
    "topic": "abacus",
    "difficulty": "medium",
    "type": "abacus-code",
    "title": "Abacus: pripočítaj R1 k R2 so zachovaním",
    "prompt": "Pripočítaj hodnotu R1 do R2, ale R1 zachovaj. Použi R3.",
    "tests": [
      {
        "regs": [
          3,
          4,
          0
        ],
        "expect": {
          "1": 3,
          "2": 7,
          "3": 0
        }
      },
      {
        "regs": [
          2,
          0,
          0
        ],
        "expect": {
          "1": 2,
          "2": 2,
          "3": 0
        }
      }
    ],
    "starter": "",
    "solution": "(s1 a2 a3)1 (s3 a1)3",
    "points": 4
  },
  {
    "id": "prg-abacus-swap",
    "mode": "practical",
    "topic": "abacus",
    "difficulty": "hard",
    "type": "abacus-code",
    "title": "Abacus: výmena R1 a R2",
    "prompt": "Vymeň hodnoty R1 a R2 pomocou pomocných registrov R3,R4.",
    "tests": [
      {
        "regs": [
          2,
          5,
          0,
          0
        ],
        "expect": {
          "1": 5,
          "2": 2,
          "3": 0,
          "4": 0
        }
      },
      {
        "regs": [
          7,
          1,
          0,
          0
        ],
        "expect": {
          "1": 1,
          "2": 7,
          "3": 0,
          "4": 0
        }
      }
    ],
    "starter": "",
    "solution": "(s1 a3)1 (s2 a4)2 (s3 a2)3 (s4 a1)4",
    "points": 4
  },
  {
    "id": "prg-abacus-multiply",
    "mode": "practical",
    "topic": "abacus",
    "difficulty": "hard",
    "type": "abacus-code",
    "title": "Abacus: násobenie",
    "prompt": "Vypočítaj R1·R2 do R3. Použi R4 ako pomocný register. Hodnotí sa R3.",
    "tests": [
      {
        "regs": [
          2,
          3,
          0,
          0
        ],
        "expect": {
          "3": 6
        }
      },
      {
        "regs": [
          4,
          2,
          0,
          0
        ],
        "expect": {
          "3": 8
        }
      }
    ],
    "starter": "",
    "solution": "(s2 (s1 a3 a4)1 (s4 a1)4)2",
    "points": 4
  },
  {
    "id": "prg-abacus-increment-both",
    "mode": "practical",
    "topic": "abacus",
    "difficulty": "easy",
    "type": "abacus-code",
    "title": "Abacus: zvýš dva registre",
    "prompt": "Zvýš R1 aj R2 o 1.",
    "tests": [
      {
        "regs": [
          0,
          0
        ],
        "expect": {
          "1": 1,
          "2": 1
        }
      },
      {
        "regs": [
          4,
          7
        ],
        "expect": {
          "1": 5,
          "2": 8
        }
      }
    ],
    "starter": "",
    "solution": "a1 a2",
    "points": 4
  },
  {
    "id": "prg-tm-flip-binary",
    "mode": "practical",
    "topic": "turing",
    "difficulty": "medium",
    "type": "tm-code",
    "title": "TS: preklop bity",
    "prompt": "Napíš TS, ktorý zmení všetky 0 na 1 a všetky 1 na 0.",
    "tests": [
      {
        "input": "0101",
        "output": "1010"
      },
      {
        "input": "111",
        "output": "000"
      },
      {
        "input": "",
        "output": ""
      }
    ],
    "starter": "",
    "solution": "q0 0 -> q0 1 R\nq0 1 -> q0 0 R\nq0 _ -> qf _ N",
    "points": 4
  },
  {
    "id": "prg-tm-a-to-b",
    "mode": "practical",
    "topic": "turing",
    "difficulty": "easy",
    "type": "tm-code",
    "title": "TS: a na b",
    "prompt": "Zmeň všetky a na b. Symboly b nechaj ako b.",
    "tests": [
      {
        "input": "aaa",
        "output": "bbb"
      },
      {
        "input": "abaa",
        "output": "bbbb"
      },
      {
        "input": "",
        "output": ""
      }
    ],
    "starter": "",
    "solution": "q0 a -> q0 b R\nq0 b -> q0 b R\nq0 _ -> qf _ N",
    "points": 4
  },
  {
    "id": "prg-tm-append1",
    "mode": "practical",
    "topic": "turing",
    "difficulty": "easy",
    "type": "tm-code",
    "title": "TS: unárne +1",
    "prompt": "Pre unárny vstup dopíš na koniec jednu 1.",
    "tests": [
      {
        "input": "1",
        "output": "11"
      },
      {
        "input": "111",
        "output": "1111"
      },
      {
        "input": "",
        "output": "1"
      }
    ],
    "starter": "",
    "solution": "q0 1 -> q0 1 R\nq0 _ -> qf 1 N",
    "points": 4
  },
  {
    "id": "prg-tm-erase-ones",
    "mode": "practical",
    "topic": "turing",
    "difficulty": "easy",
    "type": "tm-code",
    "title": "TS: vymaž jednotky",
    "prompt": "Vymaž všetky symboly 1.",
    "tests": [
      {
        "input": "111",
        "output": ""
      },
      {
        "input": "1",
        "output": ""
      },
      {
        "input": "",
        "output": ""
      }
    ],
    "starter": "",
    "solution": "q0 1 -> q0 _ R\nq0 _ -> qf _ N",
    "points": 4
  },
  {
    "id": "prg-tm-delete-first",
    "mode": "practical",
    "topic": "turing",
    "difficulty": "medium",
    "type": "tm-code",
    "title": "TS: vymaž prvý symbol",
    "prompt": "Vymaž prvý symbol 1 z unárneho slova.",
    "tests": [
      {
        "input": "111",
        "output": "11"
      },
      {
        "input": "1",
        "output": ""
      },
      {
        "input": "",
        "output": ""
      }
    ],
    "starter": "",
    "solution": "q0 1 -> qf _ N\nq0 _ -> qf _ N",
    "points": 4
  },
  {
    "id": "prg-tm-append0",
    "mode": "practical",
    "topic": "turing",
    "difficulty": "easy",
    "type": "tm-code",
    "title": "TS: dopíš 0",
    "prompt": "Prejdi na koniec vstupu nad {0,1} a dopíš 0.",
    "tests": [
      {
        "input": "1",
        "output": "10"
      },
      {
        "input": "101",
        "output": "1010"
      },
      {
        "input": "",
        "output": "0"
      }
    ],
    "starter": "",
    "solution": "q0 0 -> q0 0 R\nq0 1 -> q0 1 R\nq0 _ -> qf 0 N",
    "points": 4
  },
  {
    "id": "prg-tm-append-hash",
    "mode": "practical",
    "topic": "turing",
    "difficulty": "medium",
    "type": "tm-code",
    "title": "TS: oddeľovač",
    "prompt": "Prejdi na koniec vstupu nad {a,b} a dopíš #.",
    "tests": [
      {
        "input": "ab",
        "output": "ab#"
      },
      {
        "input": "",
        "output": "#"
      },
      {
        "input": "bba",
        "output": "bba#"
      }
    ],
    "starter": "",
    "solution": "q0 a -> q0 a R\nq0 b -> q0 b R\nq0 _ -> qf # N",
    "points": 4
  },
  {
    "id": "prg-tm-all-to-a",
    "mode": "practical",
    "topic": "turing",
    "difficulty": "easy",
    "type": "tm-code",
    "title": "TS: všetko na a",
    "prompt": "Zmeň každý symbol a alebo b na a.",
    "tests": [
      {
        "input": "bbb",
        "output": "aaa"
      },
      {
        "input": "aba",
        "output": "aaa"
      },
      {
        "input": "",
        "output": ""
      }
    ],
    "starter": "",
    "solution": "q0 a -> q0 a R\nq0 b -> q0 a R\nq0 _ -> qf _ N",
    "points": 4
  },
  {
    "id": "prg-tm-mark-first",
    "mode": "practical",
    "topic": "turing",
    "difficulty": "medium",
    "type": "tm-code",
    "title": "TS: označ prvý znak",
    "prompt": "Ak prvý symbol je a alebo b, zmeň ho na X a zastav.",
    "tests": [
      {
        "input": "abc",
        "output": "Xbc"
      },
      {
        "input": "bba",
        "output": "Xba"
      },
      {
        "input": "",
        "output": ""
      }
    ],
    "starter": "",
    "solution": "q0 a -> qf X N\nq0 b -> qf X N\nq0 _ -> qf _ N",
    "points": 4
  },
  {
    "id": "prg-tm-remove-leading-zero",
    "mode": "practical",
    "topic": "turing",
    "difficulty": "medium",
    "type": "tm-code",
    "title": "TS: odstráň úvodnú nulu",
    "prompt": "Ak slovo začína 0, vymaž túto prvú 0; inak nechaj vstup tak.",
    "tests": [
      {
        "input": "011",
        "output": "11"
      },
      {
        "input": "0",
        "output": ""
      },
      {
        "input": "111",
        "output": "111"
      }
    ],
    "starter": "",
    "solution": "q0 0 -> qf _ N\nq0 1 -> qf 1 N\nq0 _ -> qf _ N",
    "points": 4
  },
  {
    "id": "prg-fa-even-a",
    "mode": "practical",
    "topic": "automata",
    "difficulty": "easy",
    "type": "automaton-build",
    "title": "Automat: párny počet a",
    "prompt": "Zostroj automat nad {a,b}, ktorý akceptuje slová s párnym počtom a.",
    "alphabet": [
      "a",
      "b"
    ],
    "accepted": [
      "",
      "b",
      "aa",
      "aba",
      "abba"
    ],
    "rejected": [
      "a",
      "ab",
      "ba",
      "aaa"
    ],
    "starter": "",
    "finalStarter": "q0",
    "solution": "q0 a -> q1\nq0 b -> q0\nq1 a -> q0\nq1 b -> q1\nFinálny stav: q0",
    "points": 4
  },
  {
    "id": "prg-fa-odd-b",
    "mode": "practical",
    "topic": "automata",
    "difficulty": "easy",
    "type": "automaton-build",
    "title": "Automat: nepárny počet b",
    "prompt": "Zostroj automat nad {a,b}, ktorý akceptuje slová s nepárnym počtom b.",
    "alphabet": [
      "a",
      "b"
    ],
    "accepted": [
      "b",
      "ab",
      "ba",
      "bbb"
    ],
    "rejected": [
      "",
      "a",
      "bb",
      "abba"
    ],
    "starter": "",
    "finalStarter": "q1",
    "solution": "q0 b -> q1\nq0 a -> q0\nq1 b -> q0\nq1 a -> q1\nFinálny stav: q1",
    "points": 4
  },
  {
    "id": "prg-fa-ends-a",
    "mode": "practical",
    "topic": "automata",
    "difficulty": "easy",
    "type": "automaton-build",
    "title": "Automat: končí na a",
    "prompt": "Zostroj automat nad {a,b}, ktorý akceptuje slová končiace na a.",
    "alphabet": [
      "a",
      "b"
    ],
    "accepted": [
      "a",
      "ba",
      "aba",
      "aa"
    ],
    "rejected": [
      "",
      "b",
      "ab",
      "abb"
    ],
    "starter": "",
    "finalStarter": "q1",
    "solution": "q0 a -> q1\nq0 b -> q0\nq1 a -> q1\nq1 b -> q0\nFinálny stav: q1",
    "points": 4
  },
  {
    "id": "prg-fa-contains-ab",
    "mode": "practical",
    "topic": "automata",
    "difficulty": "medium",
    "type": "automaton-build",
    "title": "Automat: obsahuje ab",
    "prompt": "Zostroj automat nad {a,b}, ktorý akceptuje slová obsahujúce podslovo ab.",
    "alphabet": [
      "a",
      "b"
    ],
    "accepted": [
      "ab",
      "aab",
      "baba",
      "abb"
    ],
    "rejected": [
      "",
      "a",
      "b",
      "ba",
      "bbb"
    ],
    "starter": "",
    "finalStarter": "q2",
    "solution": "q0 a -> q1\nq0 b -> q0\nq1 a -> q1\nq1 b -> q2\nq2 a -> q2\nq2 b -> q2\nFinálny stav: q2",
    "points": 4
  },
  {
    "id": "prg-fa-starts-a",
    "mode": "practical",
    "topic": "automata",
    "difficulty": "easy",
    "type": "automaton-build",
    "title": "Automat: začína na a",
    "prompt": "Zostroj automat nad {a,b}, ktorý akceptuje neprázdne slová začínajúce na a.",
    "alphabet": [
      "a",
      "b"
    ],
    "accepted": [
      "a",
      "ab",
      "aa",
      "abba"
    ],
    "rejected": [
      "",
      "b",
      "ba",
      "bbb"
    ],
    "starter": "",
    "finalStarter": "q1",
    "solution": "q0 a -> q1\nq0 b -> q2\nq1 a -> q1\nq1 b -> q1\nq2 a -> q2\nq2 b -> q2\nFinálny stav: q1",
    "points": 4
  },
  {
    "id": "prg-fa-length-even",
    "mode": "practical",
    "topic": "automata",
    "difficulty": "medium",
    "type": "automaton-build",
    "title": "Automat: párna dĺžka",
    "prompt": "Zostroj automat nad {a,b}, ktorý akceptuje slová párnej dĺžky.",
    "alphabet": [
      "a",
      "b"
    ],
    "accepted": [
      "",
      "aa",
      "ab",
      "ba",
      "bbbb"
    ],
    "rejected": [
      "a",
      "b",
      "aaa",
      "abb"
    ],
    "starter": "",
    "finalStarter": "q0",
    "solution": "q0 a -> q1\nq0 b -> q1\nq1 a -> q0\nq1 b -> q0\nFinálny stav: q0",
    "points": 4
  },
  {
    "id": "prg-fa-exactly-one-a",
    "mode": "practical",
    "topic": "automata",
    "difficulty": "medium",
    "type": "automaton-build",
    "title": "Automat: presne jedno a",
    "prompt": "Zostroj automat nad {a,b}, ktorý akceptuje slová s presne jedným a.",
    "alphabet": [
      "a",
      "b"
    ],
    "accepted": [
      "a",
      "ab",
      "ba",
      "bbbabb"
    ],
    "rejected": [
      "",
      "b",
      "aa",
      "aba",
      "aab"
    ],
    "starter": "",
    "finalStarter": "q1",
    "solution": "q0 a -> q1\nq0 b -> q0\nq1 a -> q2\nq1 b -> q1\nq2 a -> q2\nq2 b -> q2\nFinálny stav: q1",
    "points": 4
  },
  {
    "id": "prg-fa-at-least-one-a",
    "mode": "practical",
    "topic": "automata",
    "difficulty": "easy",
    "type": "automaton-build",
    "title": "Automat: aspoň jedno a",
    "prompt": "Zostroj automat nad {a,b}, ktorý akceptuje slová s aspoň jedným a.",
    "alphabet": [
      "a",
      "b"
    ],
    "accepted": [
      "a",
      "ba",
      "ab",
      "bbbabb"
    ],
    "rejected": [
      "",
      "b",
      "bb",
      "bbbb"
    ],
    "starter": "",
    "finalStarter": "q1",
    "solution": "q0 a -> q1\nq0 b -> q0\nq1 a -> q1\nq1 b -> q1\nFinálny stav: q1",
    "points": 4
  },
  {
    "id": "prg-fa-no-aa",
    "mode": "practical",
    "topic": "automata",
    "difficulty": "hard",
    "type": "automaton-build",
    "title": "Automat: bez podslova aa",
    "prompt": "Zostroj automat nad {a,b}, ktorý akceptuje slová, ktoré neobsahujú podslovo aa.",
    "alphabet": [
      "a",
      "b"
    ],
    "accepted": [
      "",
      "a",
      "b",
      "aba",
      "baba"
    ],
    "rejected": [
      "aa",
      "aab",
      "baa",
      "baab"
    ],
    "starter": "",
    "finalStarter": "q0 q1",
    "solution": "q0 a -> q1\nq0 b -> q0\nq1 a -> q2\nq1 b -> q0\nq2 a -> q2\nq2 b -> q2\nFinálne stavy: q0 q1",
    "points": 4
  },
  {
    "id": "prg-fa-div3-a",
    "mode": "practical",
    "topic": "automata",
    "difficulty": "hard",
    "type": "automaton-build",
    "title": "Automat: počet a deliteľný 3",
    "prompt": "Zostroj automat nad {a,b}, ktorý akceptuje slová, kde #a(w) je deliteľné 3.",
    "alphabet": [
      "a",
      "b"
    ],
    "accepted": [
      "",
      "b",
      "aaa",
      "abaa",
      "aaabbb"
    ],
    "rejected": [
      "a",
      "aa",
      "ab",
      "aab"
    ],
    "starter": "",
    "finalStarter": "q0",
    "solution": "q0 a -> q1\nq0 b -> q0\nq1 a -> q2\nq1 b -> q1\nq2 a -> q0\nq2 b -> q2\nFinálny stav: q0",
    "points": 4
  },
  {
    "id": "prg-gram-a-star",
    "mode": "practical",
    "topic": "grammar",
    "difficulty": "easy",
    "type": "grammar-build",
    "title": "Gramatika: a*",
    "prompt": "Napíš gramatiku pre jazyk a*. Epsilon píš ako 3 alebo ε.",
    "accepted": [
      "",
      "a",
      "aa",
      "aaa"
    ],
    "rejected": [
      "b",
      "ab",
      "ba"
    ],
    "maxLen": 6,
    "starter": "",
    "solution": "S -> aS | 3",
    "points": 4
  },
  {
    "id": "prg-gram-ab-star",
    "mode": "practical",
    "topic": "grammar",
    "difficulty": "easy",
    "type": "grammar-build",
    "title": "Gramatika: (ab)*",
    "prompt": "Napíš gramatiku pre jazyk (ab)*.",
    "accepted": [
      "",
      "ab",
      "abab",
      "ababab"
    ],
    "rejected": [
      "a",
      "b",
      "aba",
      "abb"
    ],
    "maxLen": 6,
    "starter": "",
    "solution": "S -> abS | 3",
    "points": 4
  },
  {
    "id": "prg-gram-a-plus",
    "mode": "practical",
    "topic": "grammar",
    "difficulty": "easy",
    "type": "grammar-build",
    "title": "Gramatika: a+",
    "prompt": "Napíš gramatiku pre jazyk a+.",
    "accepted": [
      "a",
      "aa",
      "aaa"
    ],
    "rejected": [
      "",
      "b",
      "ab"
    ],
    "maxLen": 6,
    "starter": "",
    "solution": "S -> aS | a",
    "points": 4
  },
  {
    "id": "prg-gram-a-star-b-star",
    "mode": "practical",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "grammar-build",
    "title": "Gramatika: a*b*",
    "prompt": "Napíš gramatiku pre jazyk a*b*.",
    "accepted": [
      "",
      "a",
      "b",
      "aaabbb",
      "aaa"
    ],
    "rejected": [
      "ba",
      "aba",
      "baba"
    ],
    "maxLen": 6,
    "starter": "",
    "solution": "S -> aS | B\nB -> bB | 3",
    "points": 4
  },
  {
    "id": "prg-gram-anbn",
    "mode": "practical",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "grammar-build",
    "title": "Gramatika: a^n b^n",
    "prompt": "Napíš gramatiku pre {a^n b^n | n ≥ 0}.",
    "accepted": [
      "",
      "ab",
      "aabb",
      "aaabbb"
    ],
    "rejected": [
      "a",
      "b",
      "abb",
      "aab",
      "abab"
    ],
    "maxLen": 6,
    "starter": "",
    "solution": "S -> aSb | 3",
    "points": 4
  },
  {
    "id": "prg-gram-pal",
    "mode": "practical",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "grammar-build",
    "title": "Gramatika: palindrómy",
    "prompt": "Napíš gramatiku pre palindrómy nad {a,b}.",
    "accepted": [
      "",
      "a",
      "b",
      "aa",
      "aba",
      "abba"
    ],
    "rejected": [
      "ab",
      "aab",
      "abb"
    ],
    "maxLen": 6,
    "starter": "",
    "solution": "S -> aSa | bSb | a | b | 3",
    "points": 4
  },
  {
    "id": "prg-gram-ending-a",
    "mode": "practical",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "grammar-build",
    "title": "Gramatika: slová končiace na a",
    "prompt": "Napíš gramatiku nad {a,b} pre neprázdne slová končiace na a.",
    "accepted": [
      "a",
      "ba",
      "aba",
      "bba"
    ],
    "rejected": [
      "",
      "b",
      "ab",
      "abb"
    ],
    "maxLen": 6,
    "starter": "",
    "solution": "S -> a | aS | bS",
    "points": 4
  },
  {
    "id": "prg-gram-at-least-one-a",
    "mode": "practical",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "grammar-build",
    "title": "Gramatika: aspoň jedno a",
    "prompt": "Napíš gramatiku nad {a,b} pre slová s aspoň jedným a.",
    "accepted": [
      "a",
      "ba",
      "ab",
      "bbbabb"
    ],
    "rejected": [
      "",
      "b",
      "bb",
      "bbbb"
    ],
    "maxLen": 6,
    "starter": "",
    "solution": "S -> bS | aA\nA -> aA | bA | 3",
    "points": 4
  },
  {
    "id": "prg-gram-bca",
    "mode": "practical",
    "topic": "grammar",
    "difficulty": "medium",
    "type": "grammar-build",
    "title": "Gramatika: b*c*a*",
    "prompt": "Napíš gramatiku pre jazyk b*c*a*.",
    "accepted": [
      "",
      "b",
      "c",
      "a",
      "bbccaa"
    ],
    "rejected": [
      "ab",
      "acb",
      "cba",
      "bac"
    ],
    "maxLen": 6,
    "starter": "",
    "solution": "S -> bS | C\nC -> cC | A\nA -> aA | 3",
    "points": 4
  },
  {
    "id": "prg-gram-anbmc",
    "mode": "practical",
    "topic": "grammar",
    "difficulty": "hard",
    "type": "grammar-build",
    "title": "Gramatika: a^n b^m c",
    "prompt": "Napíš gramatiku pre jazyk {a^n b^m c | n,m ≥ 0}.",
    "accepted": [
      "c",
      "ac",
      "bc",
      "aaabbc"
    ],
    "rejected": [
      "",
      "a",
      "b",
      "ca",
      "abcabc"
    ],
    "maxLen": 6,
    "starter": "",
    "solution": "S -> aS | B\nB -> bB | c",
    "points": 4
  },
  {
    "id": "proof-nfa-dfa",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "open",
    "title": "Dôkaz: NKA → DKA",
    "prompt": "Načrtni dôkaz, že každý NKA možno previesť na DKA.",
    "solution": "Použi podmnožinovú konštrukciu: stavy DKA sú podmnožiny stavov NKA, počiatočný stav je množina obsahujúca q0 prípadne ε-uzáver, prechod berie zjednotenie cieľov a finálne sú tie množiny, ktoré obsahujú aspoň jeden pôvodný finálny stav.",
    "points": 4
  },
  {
    "id": "proof-regular-complement",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "easy",
    "type": "open",
    "title": "Dôkaz: regulárne jazyky a komplement",
    "prompt": "Dokáž, že regulárne jazyky sú uzavreté na komplement.",
    "solution": "Vezmi úplný DKA pre L. Zmeň množinu finálnych stavov F na K\\F. Každé slovo skončí v práve jednom stave, preto nový automat akceptuje presne slová mimo L.",
    "points": 4
  },
  {
    "id": "proof-regular-union",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "open",
    "title": "Dôkaz: regulárne jazyky a zjednotenie",
    "prompt": "Dokáž uzáver regulárnych jazykov na zjednotenie.",
    "solution": "Pre DKA A1,A2 zostroj súčinový automat so stavmi K1×K2, počiatočným stavom (q1,q2), prechodom po zložkách a finálnymi stavmi (F1×K2) ∪ (K1×F2).",
    "points": 4
  },
  {
    "id": "proof-regular-intersection",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "open",
    "title": "Dôkaz: regulárne jazyky a prienik",
    "prompt": "Dokáž uzáver regulárnych jazykov na prienik.",
    "solution": "Použi súčinový automat. Finálne stavy budú F1×F2, teda akceptuje sa iba vtedy, keď akceptujú oba pôvodné automaty.",
    "points": 4
  },
  {
    "id": "proof-cfg-union",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "easy",
    "type": "open",
    "title": "Dôkaz: LCF a zjednotenie",
    "prompt": "Dokáž, že bezkontextové jazyky sú uzavreté na zjednotenie.",
    "solution": "Pre gramatiky G1,G2 pridaj nový štart S a pravidlá S -> S1 | S2. Zvyšné pravidlá ponechaj oddelené premenovaním neterminálov.",
    "points": 4
  },
  {
    "id": "proof-cfg-concat",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "open",
    "title": "Dôkaz: LCF a zreťazenie",
    "prompt": "Dokáž, že LCF je uzavretá na zreťazenie.",
    "solution": "Pre G1,G2 pridaj nový štart S -> S1 S2. Potom každé odvodenie najprv vyrobí slovo z L1 a potom slovo z L2.",
    "points": 4
  },
  {
    "id": "proof-cfg-star",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "open",
    "title": "Dôkaz: LCF a Kleeneho hviezda",
    "prompt": "Dokáž, že LCF je uzavretá na Kleeneho hviezdu.",
    "solution": "Pre gramatiku G so štartom S1 pridaj nový štart S a pravidlá S -> S1 S | ε. To generuje ľubovoľný konečný počet slov z L.",
    "points": 4
  },
  {
    "id": "proof-cfg-not-intersection",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "hard",
    "type": "open",
    "title": "Dôkaz: LCF nie je uzavretá na prienik",
    "prompt": "Načrtni dôkaz, že LCF nie je vo všeobecnosti uzavretá na prienik.",
    "solution": "Použi jazyky L1={a^i b^i c^j} a L2={a^i b^j c^j}. Oba sú bezkontextové, ale ich prienik je {a^n b^n c^n}, ktorý nie je bezkontextový.",
    "points": 4
  },
  {
    "id": "proof-pumping-regular",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "open",
    "title": "Pumpovacia lema pre regulárne jazyky",
    "prompt": "Načrtni použitie pumpovacej lemy na dôkaz, že {a^n b^n | n ≥ 0} nie je regulárny.",
    "solution": "Predpokladaj regularitu a zober pumpovaciu dĺžku p. Slovo a^p b^p sa rozdelí xyz s |xy|≤p a |y|>0, takže y obsahuje iba a. Pumpovaním y sa zmení počet a, ale počet b ostane p, spor.",
    "points": 4
  },
  {
    "id": "proof-pumping-cfg",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "hard",
    "type": "open",
    "title": "Pumpovacia lema pre LCF",
    "prompt": "Načrtni dôkaz, že {a^n b^n c^n | n ≥ 0} nie je bezkontextový.",
    "solution": "Použi pumpovaciu lemu pre bezkontextové jazyky. V slove a^p b^p c^p sa pumpované časti v a,b,c blokoch nedokážu zmeniť všetky tri počty rovnako, takže po pumpovaní vznikne slovo mimo jazyka.",
    "points": 4
  },
  {
    "id": "proof-lre-union",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "open",
    "title": "Dôkaz: LRE a zjednotenie",
    "prompt": "Dokáž, že LRE je uzavretá na zjednotenie.",
    "solution": "Simuluj dva rozpoznávače paralelne. Ak ktorýkoľvek akceptuje, nový stroj akceptuje. Ak slovo patrí do zjednotenia, jeden rozpoznávač raz akceptuje.",
    "points": 4
  },
  {
    "id": "proof-lre-intersection",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "open",
    "title": "Dôkaz: LRE a prienik",
    "prompt": "Dokáž, že LRE je uzavretá na prienik.",
    "solution": "Simuluj oba rozpoznávače paralelne a akceptuj až vtedy, keď akceptovali oba. Pre slovo v prieniku sa to raz stane; mimo prieniku aspoň jeden neakceptuje.",
    "points": 4
  },
  {
    "id": "proof-recursive-complement",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "open",
    "title": "Dôkaz: rozhodnuteľné jazyky a komplement",
    "prompt": "Dokáž, že rozhodnuteľné jazyky sú uzavreté na komplement.",
    "solution": "Rozhodovač pre L vždy zastaví. Nový rozhodovač spustí pôvodný a otočí odpoveď akceptovať/odmietnuť.",
    "points": 4
  },
  {
    "id": "proof-halting",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "hard",
    "type": "open",
    "title": "Dôkaz: problém zastavenia",
    "prompt": "Načrtni diagonalizačný dôkaz nerozhodnuteľnosti problému zastavenia.",
    "solution": "Predpokladaj rozhodovač HALT(M,w). Zostroj stroj D, ktorý na vstupe M použije HALT(M,M) a správa sa opačne: ak M zastaví, D cyklí; ak nezastaví, D zastaví. Spustenie D(D) dá spor.",
    "points": 4
  },
  {
    "id": "proof-rice",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "hard",
    "type": "open",
    "title": "Riceova veta",
    "prompt": "Načrtni dôkaz Riceovej vety.",
    "solution": "Predpokladaj rozhodovač netriviálnej vlastnosti jazykov TS. Vyber jazyk s vlastnosťou a bez vlastnosti. Z instance halting problému skonštruuj stroj, ktorého jazyk je jeden alebo druhý podľa zastavenia. Rozhodovač vlastnosti by rozhodoval halting, spor.",
    "points": 4
  },
  {
    "id": "proof-cfg-pda",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "medium",
    "type": "open",
    "title": "Dôkaz: CFG → PDA",
    "prompt": "Načrtni konštrukciu PDA z bezkontextovej gramatiky.",
    "solution": "PDA začne so štartovým neterminálom na zásobníku. Neterminál na vrchu nahradí pravou stranou vybraného pravidla. Terminál na vrchu porovná so vstupom a spotrebuje. Ak sa vstup a zásobník vyčerpajú, akceptuje.",
    "points": 4
  },
  {
    "id": "proof-pda-cfg",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "hard",
    "type": "open",
    "title": "Dôkaz: PDA → CFG",
    "prompt": "Načrtni ideu konštrukcie gramatiky zo zásobníkového automatu.",
    "solution": "Neterminály opisujú výpočty, ktoré prejdú medzi stavmi a odstránia určitý symbol zo zásobníka. Pravidlá gramatiky simulujú prechody PDA a skladanie výpočtov.",
    "points": 4
  },
  {
    "id": "proof-lba-csg",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "hard",
    "type": "open",
    "title": "Dôkaz: kontextová gramatika a LBA",
    "prompt": "Načrtni, prečo kontextové jazyky zodpovedajú lineárne ohraničeným automatom.",
    "solution": "Kontextová gramatika neskracuje vetné formy, preto pri hľadaní derivácie slova dĺžky n stačí priestor lineárne ohraničený n. LBA môže skúšať derivácie v tomto priestore.",
    "points": 4
  },
  {
    "id": "proof-ram-am",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "hard",
    "type": "open",
    "title": "Dôkaz: RAM ⇒ AM",
    "prompt": "Načrtni simuláciu RAM stroja počítadlovým strojom AM.",
    "solution": "Registre RAM reprezentuj registrami AM. Každú RAM inštrukciu rozlož na makrá z inkrementácie, dekrementácie a cyklov. LOAD/STORE sú kopírovania, ADD/SUB opakované zmeny, skoky sa realizujú testami registrov.",
    "points": 4
  },
  {
    "id": "proof-am-ts",
    "mode": "theory",
    "topic": "proofs",
    "difficulty": "hard",
    "type": "open",
    "title": "Dôkaz: AM ⇒ TS",
    "prompt": "Načrtni simuláciu počítadlového stroja Turingovým strojom.",
    "solution": "TS zapíše registre ako bloky na páske. Pomocou procedúr vyhľadá register, otestuje nulovosť a upraví hodnotu. Inkrementácie, dekrementácie, zloženie a cykly sa simulujú krokmi nad touto reprezentáciou.",
    "points": 4
  },
  {
    "id": "fill-vigenere-simple",
    "mode": "theory",
    "topic": "crypto",
    "difficulty": "medium",
    "type": "fill",
    "title": "Vigenère krátky príklad",
    "prompt": "Pri abecede a=0 zašifruj text aa kľúčom bc. Výsledok je ____.",
    "answers": [
      "bc"
    ],
    "solution": "a posunuté o b dá b, a posunuté o c dá c.",
    "points": 1
  },
  {
    "id": "fill-vernam-xor",
    "mode": "theory",
    "topic": "crypto",
    "difficulty": "easy",
    "type": "fill",
    "title": "XOR príklad",
    "prompt": "Vypočítaj 1010 XOR 1100 = ____.",
    "answers": [
      "0110"
    ],
    "solution": "XOR po bitoch: 1^1=0, 0^1=1, 1^0=1, 0^0=0.",
    "points": 1
  }
];

  const EXAM_PRESETS = {
  "ot2025": [
    "mc-dfa-tuple",
    "mc-nfa-transition",
    "proof-regular-union",
    "proof-lre-intersection",
    "proof-ram-am",
    "prg-gram-bca",
    "prg-ram-mul",
    "mc-vigenere",
    "mc-ram-unit-time",
    "prg-fa-contains-ab",
    "proof-halting"
  ],
  "rt2025": [
    "mc-enfa-transition",
    "proof-cfg-not-intersection",
    "mc-cnf",
    "mc-p-subset-pspace",
    "prg-gram-anbn",
    "prg-ram-factorial",
    "mc-vernam",
    "proof-recursive-complement",
    "prg-fa-even-a",
    "proof-lba-csg"
  ],
  "sim2025": [
    "mc-hierarchy",
    "mc-pda-tuple",
    "mc-lba-language",
    "proof-nfa-dfa",
    "proof-cfg-star",
    "prg-ram-power",
    "prg-abacus-multiply",
    "prg-tm-flip-binary",
    "prg-fa-div3-a",
    "prg-gram-pal",
    "mc-ram-jump-test",
    "fill-vernam-xor"
  ]
};

  function generateTest() {
    const preset = presetInput ? presetInput.value : 'random';
    const selectedTopics = selectedTopicValues();
    const mode = modeInput.value;
    const difficulty = difficultyInput.value;
    const count = clamp(Number(countInput.value) || 12, 1, 40);
    const seed = seedInput.value || 'tziv';
    const rng = seededRandom(seed);

    let tasks;
    if (preset !== 'random') {
      const ids = EXAM_PRESETS[preset] || EXAM_PRESETS.sim2025;
      const byId = new Map(TASK_BANK.map(t => [t.id, t]));
      tasks = ids.map(id => byId.get(id)).filter(Boolean);
      currentTasks = tasks;
      renderTasks(currentTasks);
      const points = currentTasks.reduce((s, t) => s + (t.points || 0), 0);
      summary.textContent = `Vygenerovaná predvoľba ${presetLabel(preset)}: ${currentTasks.length} úloh, spolu približne ${points} bodov. Seed sa pri pevnej predvoľbe používa iba pri náhodných doplnkových úlohách.`;
      return;
    }

    tasks = TASK_BANK.filter(t => selectedTopics.includes(t.topic));
    if (mode !== 'mixed') tasks = tasks.filter(t => t.mode === mode);
    if (difficulty !== 'all') tasks = tasks.filter(t => t.difficulty === difficulty);

    if (!tasks.length) {
      container.innerHTML = '<div class="card"><p class="error">Pre zvolené nastavenia nie sú dostupné žiadne úlohy.</p></div>';
      return;
    }

    const shuffled = shuffle(tasks.slice(), rng);
    currentTasks = shuffled.slice(0, Math.min(count, shuffled.length));
    renderTasks(currentTasks);

    const points = currentTasks.reduce((s, t) => s + (t.points || 0), 0);
    summary.textContent = `Vygenerované ${currentTasks.length} úloh zo ${tasks.length} dostupných. Orientačne ${points} bodov. Seed: ${seed}.`;
  }

  function presetLabel(value) {
    return {
      ot2025: 'OT 2025 štýl',
      rt2025: 'RT 2025 štýl',
      sim2025: 'Simulácia 2025'
    }[value] || 'náhodný test';
  }

  function selectedTopicValues() {
    return [...topicsDiv.querySelectorAll('input:checked')].map(cb => cb.value);
  }

  function renderTasks(tasks) {
    container.innerHTML = '';
    tasks.forEach((task, i) => {
      const article = document.createElement('article');
      article.className = 'card test-task';
      article.id = `task-${task.id}`;
      article.innerHTML = `
        <div class="proof-meta">
          <span class="badge">${i + 1}</span>
          <span class="badge secondary">${topicLabel(task.topic)}</span>
          <span class="badge">${task.mode === 'theory' ? 'teória' : 'praktická'}</span>
          <span class="badge">${difficultyLabel(task.difficulty)}</span>
          ${task.points ? `<span class="badge">${task.points} b</span>` : ''}
        </div>
        <h2>${escapeHtml(task.title)}</h2>
        ${task.image ? renderDiagram(task.image) : ''}
        <p class="task-prompt">${formatText(task.prompt)}</p>
        ${renderAnswerArea(task)}
        <div class="controls">
          <button type="button" data-eval="${task.id}">Vyhodnotiť túto úlohu</button>
          <button type="button" data-solution-toggle="${task.id}">Ukázať riešenie</button>
        </div>
        <div class="task-feedback" data-feedback-for="${task.id}"></div>
        <div class="solution-box hidden" data-solution-for="${task.id}">
          <strong>Vzorové riešenie:</strong>
          <pre>${escapeHtml(task.solution || 'Riešenie nie je zadané.')}</pre>
        </div>
      `;
      container.appendChild(article);
    });

    container.querySelectorAll('[data-eval]').forEach(btn => btn.addEventListener('click', () => evaluateTask(btn.dataset.eval)));
    container.querySelectorAll('[data-solution-toggle]').forEach(btn => btn.addEventListener('click', () => {
      const box = container.querySelector(`[data-solution-for="${cssEscape(btn.dataset.solutionToggle)}"]`);
      if (box) box.classList.toggle('hidden');
    }));
  }

  function renderAnswerArea(task) {
    const id = escapeAttr(task.id);
    if (task.type === 'mc' || task.type === 'image-mc') {
      return `<div class="answer-area">${task.options.map((o, idx) => `
        <label class="test-option">
          <input type="radio" name="answer-${id}" value="${idx}">
          <span>${formatText(o)}</span>
        </label>`).join('')}</div>`;
    }
    if (task.type === 'fill') {
      return `<input class="test-input" data-answer="${id}" type="text" placeholder="Doplň odpoveď">`;
    }
    if (task.type === 'open') {
      return `<textarea class="test-textarea" data-answer="${id}" placeholder="Napíš osnovu dôkazu alebo odpoveď. Táto úloha sa nehodnotí automaticky."></textarea>`;
    }
    if (task.type === 'ram-code') {
      return `
        <textarea class="test-code" data-answer="${id}" spellcheck="false">${escapeHtml(task.starter || '')}</textarea>
        ${renderTests(task.tests, 'Vstup', 'Očakávaný výstup')}`;
    }
    if (task.type === 'abacus-code') {
      return `
        <textarea class="test-code" data-answer="${id}" spellcheck="false">${escapeHtml(task.starter || '')}</textarea>
        <div class="testcase-box">${task.tests.map(t => `<div><code>Registre: ${escapeHtml(JSON.stringify(t.regs))}</code> → očakávané ${escapeHtml(JSON.stringify(t.expect))}</div>`).join('')}</div>`;
    }
    if (task.type === 'tm-code') {
      return `
        <textarea class="test-code" data-answer="${id}" spellcheck="false">${escapeHtml(task.starter || '')}</textarea>
        ${renderTests(task.tests, 'Vstupná páska', 'Očakávaná páska')}`;
    }
    if (task.type === 'automaton-build') {
      return `
        <label>Prechody automatu</label>
        <textarea class="test-code" data-answer="${id}" spellcheck="false">${escapeHtml(task.starter || '')}</textarea>
        <div class="test-grid small">
          <label>Počiatočný stav <input data-start="${id}" type="text" value="q0"></label>
          <label>Finálne stavy <input data-finals="${id}" type="text" value="${escapeAttr(task.finalStarter || '')}"></label>
        </div>
        <div class="testcase-box">
          <div>Majú byť akceptované: <code>${task.accepted.map(w => w || 'ε').join(', ')}</code></div>
          <div>Majú byť odmietnuté: <code>${task.rejected.map(w => w || 'ε').join(', ')}</code></div>
        </div>`;
    }
    if (task.type === 'grammar-build') {
      return `
        <textarea class="test-code" data-answer="${id}" spellcheck="false">${escapeHtml(task.starter || '')}</textarea>
        <div class="testcase-box">
          <div>Majú byť generované: <code>${task.accepted.map(w => w || 'ε').join(', ')}</code></div>
          <div>Nemajú byť generované: <code>${task.rejected.map(w => w || 'ε').join(', ')}</code></div>
        </div>`;
    }
    return `<textarea class="test-textarea" data-answer="${id}"></textarea>`;
  }

  function renderTests(tests, leftLabel, rightLabel) {
    return `<div class="testcase-box">
      <strong>Testovacia množina</strong>
      <table class="cost-table compact-table">
        <thead><tr><th>${leftLabel}</th><th>${rightLabel}</th></tr></thead>
        <tbody>${tests.map(t => `<tr><td><code>${escapeHtml(t.input)}</code></td><td><code>${escapeHtml(t.output)}</code></td></tr>`).join('')}</tbody>
      </table>
    </div>`;
  }

  function evaluateTask(id) {
    const task = currentTasks.find(t => t.id === id);
    if (!task) return;
    let result;
    try {
      if (task.type === 'mc' || task.type === 'image-mc') result = evalMC(task);
      else if (task.type === 'fill') result = evalFill(task);
      else if (task.type === 'open') result = { ok: true, neutral: true, message: 'Otvorená otázka sa nehodnotí automaticky. Porovnaj svoju odpoveď so vzorovou osnovou.' };
      else if (task.type === 'ram-code') result = evalRamTask(task);
      else if (task.type === 'abacus-code') result = evalAbacusTask(task);
      else if (task.type === 'tm-code') result = evalTMTask(task);
      else if (task.type === 'automaton-build') result = evalAutomatonTask(task);
      else if (task.type === 'grammar-build') result = evalGrammarTask(task);
      else result = { ok: false, message: 'Neznámy typ úlohy.' };
    } catch (e) {
      result = { ok: false, message: 'Chyba pri vyhodnotení: ' + e.message };
    }
    showFeedback(task.id, result);
  }

  function evalMC(task) {
    const selected = document.querySelector(`input[name="answer-${cssEscape(task.id)}"]:checked`);
    if (!selected) return { ok: false, message: 'Nie je označená žiadna odpoveď.' };
    const ok = Number(selected.value) === task.answer;
    return { ok, message: ok ? 'Správne.' : `Nesprávne. Správna možnosť: ${task.options[task.answer]}` };
  }

  function evalFill(task) {
    const input = document.querySelector(`[data-answer="${cssEscape(task.id)}"]`);
    const value = normalizeAnswer(input.value);
    const ok = task.answers.some(a => normalizeAnswer(a) === value);
    return { ok, message: ok ? 'Správne.' : `Nesprávne. Očakávané napr.: ${task.answers[0]}` };
  }

  function evalRamTask(task) {
    const code = getAnswer(task.id);
    const details = [];
    let ok = true;
    for (const test of task.tests) {
      const out = runRam(code, test.input);
      const got = out.outputs.join(' ').trim();
      const pass = got === test.output;
      if (!pass) ok = false;
      details.push(`${test.input || 'ε'} → ${got || '∅'} ${pass ? '✓' : `✗ (očakávané ${test.output})`}`);
    }
    return { ok, message: details.join('\n') };
  }

  function evalAbacusTask(task) {
    const code = getAnswer(task.id);
    const details = [];
    let ok = true;
    for (const test of task.tests) {
      const result = runAbacus(code, test.regs);
      const checks = Object.entries(test.expect).map(([reg, val]) => {
        const got = result.registers[reg] || 0;
        const pass = got === val;
        if (!pass) ok = false;
        return `R${reg}=${got}${pass ? '' : ` (očak. ${val})`}`;
      });
      details.push(`[${test.regs.join(', ')}] → ${checks.join(', ')} ${checks.every(x => !x.includes('očak.')) ? '✓' : '✗'}`);
    }
    return { ok, message: details.join('\n') };
  }

  function evalTMTask(task) {
    const code = getAnswer(task.id);
    const details = [];
    let ok = true;
    for (const test of task.tests) {
      const out = runTM(code, test.input, 'q0', ['qf']);
      const got = trimTape(out.tape);
      const pass = got === test.output;
      if (!pass) ok = false;
      details.push(`${test.input || 'ε'} → ${got || 'ε'} ${pass ? '✓' : `✗ (očakávané ${test.output || 'ε'})`}`);
    }
    return { ok, message: details.join('\n') };
  }

  function evalAutomatonTask(task) {
    const transitions = getAnswer(task.id);
    const start = document.querySelector(`[data-start="${cssEscape(task.id)}"]`)?.value.trim() || 'q0';
    const finals = (document.querySelector(`[data-finals="${cssEscape(task.id)}"]`)?.value || '').trim().split(/\s+/).filter(Boolean);
    const fa = parseFA(transitions, start, finals);
    let ok = true;
    const details = [];
    for (const w of task.accepted) {
      const pass = acceptsFA(fa, w);
      if (!pass) ok = false;
      details.push(`${w || 'ε'} má byť akceptované: ${pass ? '✓' : '✗'}`);
    }
    for (const w of task.rejected) {
      const pass = !acceptsFA(fa, w);
      if (!pass) ok = false;
      details.push(`${w || 'ε'} má byť odmietnuté: ${pass ? '✓' : '✗'}`);
    }
    return { ok, message: details.join('\n') };
  }

  function evalGrammarTask(task) {
    const grammar = parseGrammar(getAnswer(task.id));
    const generated = generateGrammarWords(grammar, task.maxLen || 6);
    let ok = true;
    const details = [];
    for (const w of task.accepted) {
      const pass = generated.has(w);
      if (!pass) ok = false;
      details.push(`${w || 'ε'} má byť generované: ${pass ? '✓' : '✗'}`);
    }
    for (const w of task.rejected) {
      const pass = !generated.has(w);
      if (!pass) ok = false;
      details.push(`${w || 'ε'} nemá byť generované: ${pass ? '✓' : '✗'}`);
    }
    return { ok, message: details.join('\n') };
  }

  function showFeedback(id, result) {
    const el = document.querySelector(`[data-feedback-for="${cssEscape(id)}"]`);
    if (!el) return;
    el.className = 'task-feedback ' + (result.neutral ? 'neutral' : (result.ok ? 'ok' : 'bad'));
    el.innerHTML = `<pre>${escapeHtml(result.message)}</pre>`;
  }

  function getAnswer(id) {
    return document.querySelector(`[data-answer="${cssEscape(id)}"]`)?.value || '';
  }

  /* ----------------------------- RAM runner ----------------------------- */
  function runRam(code, inputText) {
    const { instructions, labels } = parseRamProgram(code);
    const input = inputText.trim() ? inputText.trim().split(/\s+/).map(Number) : [];
    const regs = {};
    const outputs = [];
    let ip = 0, steps = 0;
    const get = (i) => regs[i] || 0;
    const set = (i, v) => { regs[i] = Math.max(0, Math.trunc(v || 0)); };
    const val = (op) => {
      op = String(op || '').trim();
      if (op.startsWith('=')) return Number(op.slice(1)) || 0;
      if (op.startsWith('*')) return get(get(Number(op.slice(1))));
      return get(Number(op));
    };
    while (ip >= 0 && ip < instructions.length && steps++ < 100000) {
      const [rawOp, ...rest] = instructions[ip].split(/\s+/);
      const op = rawOp.toUpperCase();
      const arg = rest.join(' ');
      switch (op) {
        case 'READ': set(Number(arg.replace('*','')), input.shift() || 0); ip++; break;
        case 'WRITE': outputs.push(String(val(arg))); ip++; break;
        case 'LOAD': set(0, val(arg)); ip++; break;
        case 'STORE': set(Number(arg.replace('*','')), get(0)); ip++; break;
        case 'ADD': set(0, get(0) + val(arg)); ip++; break;
        case 'SUB': set(0, Math.max(0, get(0) - val(arg))); ip++; break;
        case 'MULT':
        case 'MUL': set(0, get(0) * val(arg)); ip++; break;
        case 'DIV': set(0, val(arg) === 0 ? 0 : Math.floor(get(0) / val(arg))); ip++; break;
        case 'JUMP': ip = labels[arg]; break;
        case 'JZERO': ip = get(0) === 0 ? labels[arg] : ip + 1; break;
        case 'JGZERO':
        case 'JGTZ': ip = get(0) > 0 ? labels[arg] : ip + 1; break;
        case 'HALT': return { outputs, regs, halted: true };
        default: throw new Error('Neznáma RAM inštrukcia: ' + op);
      }
      if (ip === undefined) throw new Error('Neznáme návestie: ' + arg);
    }
    if (steps >= 100000) throw new Error('Program prekročil limit krokov.');
    return { outputs, regs, halted: true };
  }

  function parseRamProgram(code) {
    const instructions = [], labels = {};
    code.split(/\r?\n/).forEach(line => {
      line = line.replace(/#.*/, '').trim();
      if (!line) return;
      while (/^[A-Za-z_]\w*:/.test(line)) {
        const m = line.match(/^([A-Za-z_]\w*):\s*(.*)$/);
        labels[m[1]] = instructions.length;
        line = m[2].trim();
        if (!line) return;
      }
      instructions.push(line);
    });
    return { instructions, labels };
  }

  /* ----------------------------- Abacus runner ----------------------------- */
  function runAbacus(code, regsArr) {
    const tokens = parseAbacus(code);
    const registers = {};
    regsArr.forEach((v, i) => registers[i + 1] = Number(v) || 0);
    let steps = 0;
    function exec(tokens) {
      for (const token of tokens) {
        if (steps++ > 100000) throw new Error('Abacus program prekročil limit krokov.');
        if (token.type === 'a') registers[token.reg] = (registers[token.reg] || 0) + 1;
        else if (token.type === 's') registers[token.reg] = Math.max(0, (registers[token.reg] || 0) - 1);
        else if (token.type === 'loop') {
          while ((registers[token.reg] || 0) > 0) exec(token.body);
        }
      }
    }
    exec(tokens);
    return { registers };
  }

  function parseAbacus(program) {
    const s = program.replace(/\s+/g, '');
    let i = 0;
    function parseUntil(close) {
      const out = [];
      while (i < s.length && s[i] !== close) {
        const ch = s[i];
        if (ch === 'a' || ch === 's') {
          i++;
          let num = '';
          while (/[0-9]/.test(s[i])) num += s[i++];
          if (!num) throw new Error('Chýba číslo registra.');
          out.push({ type: ch, reg: Number(num) });
        } else if (ch === '(') {
          i++;
          const body = parseUntil(')');
          if (s[i] !== ')') throw new Error('Neuzavretá zátvorka.');
          i++;
          let num = '';
          while (/[0-9]/.test(s[i])) num += s[i++];
          if (!num) throw new Error('Za cyklom chýba číslo registra.');
          out.push({ type: 'loop', reg: Number(num), body });
        } else {
          throw new Error('Neznámy znak v abacuse: ' + ch);
        }
      }
      return out;
    }
    return parseUntil(null);
  }

  /* ----------------------------- Turing runner ----------------------------- */
  function runTM(code, input, start, finals) {
    const transitions = {};
    code.split(/\r?\n/).forEach(line => {
      line = line.replace(/#.*/, '').trim();
      if (!line) return;
      const m = line.match(/^(\S+)\s+(\S+)\s*->\s*(\S+)\s+(\S+)\s+([LRNS])$/i);
      if (!m) throw new Error('Zlý prechod TS: ' + line);
      transitions[`${m[1]}|${m[2]}`] = { to: m[3], write: m[4], dir: m[5].toUpperCase() };
    });
    const tape = [...input];
    let head = 0, state = start, steps = 0;
    while (!finals.includes(state) && steps++ < 50000) {
      const sym = tape[head] ?? '_';
      const tr = transitions[`${state}|${sym}`];
      if (!tr) break;
      tape[head] = tr.write;
      state = tr.to;
      if (tr.dir === 'R') head++;
      if (tr.dir === 'L') head--;
      if (head < 0) { tape.unshift('_'); head = 0; }
    }
    if (steps >= 50000) throw new Error('TS prekročil limit krokov.');
    return { tape, state };
  }

  function trimTape(tape) {
    let s = tape.join('');
    return s.replace(/^_+/, '').replace(/_+$/, '');
  }

  /* ----------------------------- Finite automata ----------------------------- */
  function parseFA(text, start, finals) {
    const transitions = {};
    const add = (from, sym, to) => {
      transitions[from] ||= {};
      transitions[from][sym] ||= [];
      transitions[from][sym].push(to);
    };
    text.split(/\r?\n/).forEach(line => {
      line = line.replace(/#.*/, '').trim();
      if (!line) return;
      const m = line.match(/^(\S+)\s+(\S+)\s*->\s*(.+)$/);
      if (!m) throw new Error('Zlý prechod automatu: ' + line);
      m[3].split(',').map(x => x.trim()).filter(Boolean).forEach(to => add(m[1], m[2] === '3' ? 'ε' : m[2], to));
    });
    return { start, finals, transitions };
  }

  function acceptsFA(fa, word) {
    let states = epsilonClosure(fa, new Set([fa.start]));
    for (const ch of word) {
      const next = new Set();
      states.forEach(s => (fa.transitions[s]?.[ch] || []).forEach(t => next.add(t)));
      states = epsilonClosure(fa, next);
    }
    return [...states].some(s => fa.finals.includes(s));
  }

  function epsilonClosure(fa, states) {
    const stack = [...states], seen = new Set(states);
    while (stack.length) {
      const s = stack.pop();
      (fa.transitions[s]?.['ε'] || []).forEach(t => {
        if (!seen.has(t)) { seen.add(t); stack.push(t); }
      });
    }
    return seen;
  }

  /* ----------------------------- Grammar generation ----------------------------- */
  function parseGrammar(text) {
    const rules = {};
    text.split(/\r?\n/).forEach(line => {
      line = line.replace(/#.*/, '').trim();
      if (!line) return;
      const i = line.indexOf('->');
      if (i < 0) throw new Error('Pravidlo musí obsahovať ->');
      const left = line.slice(0, i).trim();
      const rhs = line.slice(i + 2).split('|').map(x => x.trim()).filter(Boolean);
      rules[left] ||= [];
      rhs.forEach(r => rules[left].push(r === '3' ? '' : r.replace(/ε/g, '')));
    });
    return { start: 'S', rules };
  }

  function generateGrammarWords(g, maxLen) {
    const out = new Set();
    const queue = [g.start];
    const seen = new Set(queue);
    let safety = 0;
    while (queue.length && safety++ < 20000) {
      const cur = queue.shift();
      const terminalLen = cur.replace(/[A-Z]/g, '').length;
      if (terminalLen > maxLen) continue;
      const ntMatch = cur.match(/[A-Z]/);
      if (!ntMatch) {
        out.add(cur);
        continue;
      }
      const nt = ntMatch[0], idx = ntMatch.index;
      for (const rhs of (g.rules[nt] || [])) {
        const next = cur.slice(0, idx) + rhs + cur.slice(idx + 1);
        if (!seen.has(next) && next.length <= maxLen + 6) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return out;
  }

  /* ----------------------------- Render helpers ----------------------------- */
  function renderDiagram(name) {
    if (name === 'evenA') {
      return `<div class="diagram-question">
        <svg viewBox="0 0 420 160" class="test-diagram" aria-label="Automat párny počet a">
          <defs><marker id="arr-test" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"></path></marker></defs>
          <path d="M35 80 L85 80" class="test-edge"></path>
          <circle cx="120" cy="80" r="30" class="test-state"></circle>
          <circle cx="120" cy="80" r="23" class="test-state"></circle>
          <text x="120" y="86" text-anchor="middle">q0</text>
          <circle cx="300" cy="80" r="30" class="test-state"></circle>
          <text x="300" y="86" text-anchor="middle">q1</text>
          <path d="M150 65 C200 25 240 25 270 65" class="test-edge"></path>
          <text x="210" y="35" text-anchor="middle">a</text>
          <path d="M270 95 C240 135 200 135 150 95" class="test-edge"></path>
          <text x="210" y="132" text-anchor="middle">a</text>
          <path d="M103 52 C80 25 160 25 137 52" class="test-edge"></path>
          <text x="120" y="24" text-anchor="middle">b</text>
          <path d="M283 52 C260 25 340 25 317 52" class="test-edge"></path>
          <text x="300" y="24" text-anchor="middle">b</text>
        </svg>
      </div>`;
    }
    return '';
  }

  function formatText(s) {
    return escapeHtml(s)
      .replace(/\n/g, '<br>')
      .replace(/\^([0-9]+)/g, '<sup>$1</sup>')
      .replace(/q₀/g, 'q<sub>0</sub>');
  }

  function topicLabel(value) {
    return TOPICS.find(t => t[0] === value)?.[1] || value;
  }

  function difficultyLabel(value) {
    return { easy: 'ľahká', medium: 'stredná', hard: 'ťažká' }[value] || value;
  }

  function normalizeAnswer(s) {
    return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  }

  function seededRandom(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function() {
      h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
      return ((h >>> 0) / 4294967296);
    };
  }

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function escapeAttr(s) { return escapeHtml(s).replace(/`/g, '&#96;'); }
  function cssEscape(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }

  // Initial render after all task data is ready.
  generateTest();

});
