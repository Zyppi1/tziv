/*
 * Rozšírený kvíz s kategóriami, výberom počtu otázok a možnosťou predošlej
 * otázky, hintu a zobrazenia vzorovej odpovede. Otázky sú rozdelené
 * do okruhov (ram, abacus, turing, automata, grammar, proofs, complexity, general).
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM prvky
  const setupDiv = document.getElementById('quiz-setup');
  const categoryDiv = document.getElementById('quiz-categories');
  const countInput = document.getElementById('quiz-count');
  const startBtn = document.getElementById('quiz-start');
  const quizCard = document.getElementById('quiz-card');

  // Zoznam otázok s kategóriou a nápovedou
  const questions = [
    {
      category: 'automata',
      prompt: 'Definujte deterministický konečný automat (DFA) a vymenujte jeho komponenty.',
      answer: 'DFA je pätica (K, Σ, δ, q₀, F), kde K je konečná množina stavov, Σ vstupná abeceda, δ: K×Σ→K je prechodová funkcia, q₀∈K počiatočný stav a F⊆K množina akceptačných stavov.',
      hint: 'Pomyslite na stavy, abecedu, prechodovú funkciu, počiatočný a akceptačné stavy.'
    },
    {
      category: 'automata',
      prompt: 'Čo je zásobníkový automat (PDA) a ako využíva zásobník?',
      answer: 'Zásobníkový automat je rozšírenie konečného automatu o zásobník (LIFO). Okrem čítania symbolov z pásky môže na základe vstupu a vrcholu zásobníka meniť stav, zapisovať symboly na zásobník (push) alebo ich odoberať (pop), čím rozpoznáva bezkontextové jazyky.',
      hint: 'Spomeňte si na zásobník typu LIFO a operácie push/pop.'
    },
    {
      category: 'grammar',
      prompt: 'Rozlíšte regulárnu, bezkontextovú, kontextovú a frázovú gramatiku.',
      answer: 'Regulárna gramatika (typ 3) má pravidlá A→wB alebo A→w, bezkontextová (typ 2) pravidlá A→w, kontextová (typ 1) pravidlá u→v s |u|≤|v| a ľavá strana obsahuje neterminál, frázová (typ 0) nemá obmedzenia okrem prítomnosti neterminálu na ľavej strane.',
      hint: 'Zamyslite sa nad obmedzeniami pravidiel pre rôzne typy gramatík (Chomského hierarchia).' 
    },
    {
      category: 'turing',
      prompt: 'Stručne popíšte princíp práce Turingovho stroja.',
      answer: 'Turingov stroj má nekonečnú pásku, hlavu, ktorá číta a zapisuje symboly, a riadiacu jednotku so stavmi. Na základe prechodovej funkcie zapíše symbol, zmení stav a pohne sa doľava alebo doprava. Výpočet skončí v akceptačnom stave alebo pri absencii prechodu.',
      hint: 'Spomeňte si na pásku, hlavu a prechodovú funkciu (stav, symbol → nový stav, zápis, pohyb).' 
    },
    {
      category: 'ram',
      prompt: 'Navrhnite RAM program, ktorý vypočíta súčet dvoch čísel načítaných zo vstupu.',
      answer: 'Príklad: READ 1; READ 2; LOAD 1; ADD 2; WRITE 0; HALT. Najprv načíta čísla do registrov 1 a 2, potom načíta register 1 do akumulátora, pripočíta register 2 a zapíše výsledok.',
      hint: 'Použite inštrukcie READ, LOAD, ADD, WRITE a HALT.'
    },
    {
      category: 'abacus',
      prompt: 'Navrhnite počítadlový program, ktorý zdvojnásobí hodnotu v registri R1.',
      answer: 'Program: (s1 a2 a2)1. Cyklus (… )₁ sa vykonáva kým R1>0; v každej iterácii z R1 odoberie 1 (s1) a dvakrát inkrementuje R2 (a2 a2). Po skončení je R2=2·pôvodné R1 a R1=0.',
      hint: 'Využite cyklus, ktorý odpočítava R1 a dvakrát inkrementuje iný register.'
    },
    {
      category: 'automata',
      prompt: 'Navrhnite DFA, ktorý akceptuje binárne reťazce s párnym počtom jednotiek.',
      answer: 'Automat má 2 stavy: q_even (počiatočný, akceptačný) a q_odd. Pri čítaní symbolu 1 sa stav prepne (q_even→q_odd, q_odd→q_even), pri 0 zostáva v rovnakom stave.',
      hint: 'Budete potrebovať dva stavy a pravidlo „pri 1 prepni stav“.'
    },
    {
      category: 'proofs',
      prompt: 'Vymenujte uzáverové vlastnosti triedy kontextových jazykov.',
      answer: 'CS jazyky sú uzavreté na zjednotenie, zreťazenie, iteráciu (Kleeneho hviezdu), prienik, komplement, reverz a nevymazávajúce homomorfizmy.',
      hint: 'Myslite na operácie, ktoré používate pri kombinovaní jazykov.'
    },
    {
      category: 'grammar',
      prompt: 'Čo je Kleeneho hviezda a ako sa používa v gramatikách?',
      answer: 'Kleeneho hviezda L* označuje množinu všetkých konečných konkatenácií slov z jazyka L vrátane prázdneho slova. V gramatike sa to dá zabezpečiť pridaním pravidla S→SS | ε.',
      hint: 'Spomeňte si na operáciu, ktorá generuje ľubovoľný počet opakovaní jazyka.'
    },
    {
      category: 'turing',
      prompt: 'Aký je rozdiel medzi deterministickým a nedeterministickým Turingovým strojom?',
      answer: 'Deterministický TS má pre každý pár (stav, symbol) najviac jednu možnosť prechodu, zatiaľ čo nedeterministický TS môže mať viacero prechodov a výpočet prebieha vo vetveniach; jazyk akceptuje, ak existuje aspoň jedna akceptačná vetva.',
      hint: 'Zamerajte sa na počet prechodov definovaných pre dvojicu (stav, symbol).' 
    },
    {
      category: 'ram',
      prompt: 'Navrhnite RAM program, ktorý vynásobí dve čísla zadané na vstupe pomocou opakovanej sumy.',
      answer: 'Príklad: READ 1; READ 2; LOAD 0; STORE 3; LOAD 1; JZERO end; label: ADD 2; SUB =1; STORE 1; LOAD 3; ADD 0; STORE 3; LOAD 1; JZERO end; JUMP label; end: LOAD 3; WRITE 0; HALT. Do R3 akumulujeme výsledok, cyklus odpočítava R1 a vždy pripočíta hodnotu z R2 do R3.',
      hint: 'Potrebujete cyklus, ktorý odčíta prvé číslo a opakovane pripočíta druhé k výsledku.'
    },
    {
      category: 'turing',
      prompt: 'Opíšte postup, ako by ste zostrojili Turingov stroj na zistenie, či binárny reťazec obsahuje párny počet núl.',
      answer: 'Napríklad stroj s dvoma stavmi q_even (počiatočný, akceptačný) a q_odd. Páska sa spracúva zľava doprava: pri čítaní 0 sa stav prepne (q_even→q_odd, q_odd→q_even), pri čítaní 1 sa stav nemení. Po prečítaní prázdneho symbolu sa stroj zastaví a ak je stav q_even, reťazec má párny počet núl.',
      hint: 'Pri každej nule prepínajte medzi dvoma stavmi.'
    },
    {
      category: 'grammar',
      prompt: 'Uveďte postup konverzie regulárneho výrazu na gramatiku (typ 3).',
      answer: 'Regulárny výraz vieme konštruktívne previesť na ekvivalentný automat (napr. Thompsonova konštrukcia), z ktorého následne odvodíme regulárnu gramatiku. Pre každý stav vytvoríme neterminál a prechod s etiketou a vytvoríme pravidlo A→aB. Ak stav vedie do akceptačného stavu cez ε, pridáme pravidlo A→ε.',
      hint: 'Najprv si pomôžte automatom a potom z prechodov odvoďte pravidlá A→aB alebo A→ε.'
    },
    {
      category: 'complexity',
      prompt: 'Rozlíšte jednotkovú a logaritmickú zložitosť pre RAM a uveďte, kedy sa používa ktorá z nich.',
      answer: 'Jednotková zložitosť priraďuje každej vykonanej inštrukcii jednotkovú cenu 1 bez ohľadu na veľkosť operandov; vhodná je pri analýze algoritmov s malými alebo fixne veľkými číslami. Logaritmická zložitosť priraďuje cene inštrukcie log₂(n) podľa počtu bitov operandov alebo výsledku; lepšie vystihuje prácu s veľkými číslami, kde aritmetické operácie trvajú dlhšie.',
      hint: 'Rozdiel je v tom, či počítame fixnú cenu alebo závisí od veľkosti čísel.'
    },
    {
      category: 'abacus',
      prompt: 'Navrhnite počítadlový program, ktorý spočíta súčet hodnôt v registroch R1 a R2 a výsledok uloží do R3.',
      answer: 'Jedno riešenie: (s1 a3)1 (s2 a3)2. Prvý cyklus (… )₁ opakuje dekrement R1 (s1) a inkrement R3 (a3), kým je R1 > 0. Druhý cyklus (… )₂ robí to isté s registrom R2. Po skončení je R3 = R1 + R2 a R1 = R2 = 0.',
      hint: 'Použite dva cykly, každý pre jeden register, ktoré inkrementujú tretí.'
    },
    {
      category: 'ram',
      prompt: 'Navrhnite RAM program, ktorý vypočíta n² pre prirodzené číslo n zadané na vstupe (pomocou opakovaného sčítania).',
      answer: 'Príklad: READ 1; LOAD 1; STORE 2; LOAD =0; STORE 3; LOOP: LOAD 2; JZERO END; LOAD 3; ADD 1; STORE 3; LOAD 2; SUB =1; STORE 2; JUMP LOOP; END: LOAD 3; WRITE 0; HALT. Registro 1 obsahuje n, register 2 slúži ako čítač, v registri 3 akumulujeme výsledok. Cyklus sa vykoná n-krát a každým pripočítaním n do registra 3 vznikne n².',
      hint: 'Použite dva registre: jeden ako čítač, druhý ako akumulátor výsledku.'
    },
    {
      category: 'automata',
      prompt: 'Pre nasledujúci automat so stavmi q0 (počiatočný), q1 (akceptačný) a prechodmi: q0 na čítanie 0 zostáva v q0, q0 na čítanie 1 ide do q1, q1 na čítanie 0 ide späť do q1 a q1 na čítanie 1 ide do q0. Zapíšte prechody v tvare používanom v tejto aplikácii.',
      answer: 'q0 0 -> q0\nq0 1 -> q1\nq1 0 -> q1\nq1 1 -> q0. Začiatočný stav je q0 a akceptačný stav je q1.',
      hint: 'Spíšte každý prechod v tvare „stav symbol -> novýStav“.'
    },
    {
      category: 'ram',
      prompt: 'Urobte symbolickú analýzu jednotkovej zložitosti RAM programu, ktorý sčíta všetky čísla od 1 po n: READ 1; LOAD =0; STORE 2; LOOP: LOAD 1; JZERO END; LOAD 2; ADD 1; STORE 2; LOAD 1; SUB =1; STORE 1; JUMP LOOP; END: LOAD 2; WRITE 0; HALT. Koľkokrát sa vykonajú cyklické príkazy?',
      answer: 'V programe sa cyklus opakuje n-krát. Príkazy v cykle (LOAD 1; JZERO END; LOAD 2; ADD 1; STORE 2; LOAD 1; SUB =1; STORE 1; JUMP LOOP) sa vykonajú n+1, n+1, n, n, n, n, n, n, n+1 krát, pretože JZERO aj JUMP sa vykonávajú n+1-krát (overenie aj po skončení cyklu). Celkový jednotkový čas je 9n + 3.',
      hint: 'Pri počítaní cyklu nezabudnite, že podmienky JZERO a JUMP sa kontrolujú aj po skončení poslednej iterácie.'
    },
    {
      category: 'general',
      prompt: 'Ako by ste rozšírili kvíz tak, aby testoval schopnosť študenta navrhnúť vlastný automat alebo program? Uveďte konkrétny príklad otázky.',
      answer: 'Kvíz možno rozšíriť o kreatívne zadania, kde študent navrhne kompletný automat alebo program. Napríklad: „Navrhnite Turingov stroj, ktorý rozpozná jazyk { w#w | w ∈ {0,1}* }. Popíšte stavy a prechody.“ alebo „Navrhnite počítadlový program na násobenie dvoch registrov R1 a R2.“',
      hint: 'Zamerajte sa na otvorené úlohy, kde študent musí sám navrhnúť riešenie.'
    },
    {
      category: 'proofs',
      prompt: 'Vysvetlite Pumping lemma pre regulárne jazyky a ako sa používa na dôkaz nereguálnosti.',
      answer: 'Pumping lemma hovorí, že každý nekonečný regulárny jazyk má pumpovaciu dĺžku p, pre ktorú možno každé dostatočne dlhé slovo w rozdeliť na w=xyz, pričom |xy|≤p, |y|≥1 a pre všetky i≥0 platí xy^i z∈L. Ak vieme pre jazyk nájsť slovo, ktoré podmienky pumpovacieho lemmatu nespĺňa, jazyk nie je regulárny.',
      hint: 'Spomeňte si, že pumpovanie opisuje opakovanie časti slova.'
    },
    {
      category: 'proofs',
      prompt: 'Vysvetlite Pumping lemma pre bezkontextové jazyky a jeho využitie.',
      answer: 'Pumping lemma pre bezkontextové jazyky tvrdí, že existuje pumpovacia dĺžka p, že každé slovo w∈L dlhé aspoň p možno zapísať ako w=uvxyz s |vy|≥1, |vxy|≤p a pre všetky i≥0 uv^ixy^i z∈L. Ak nájdeme slovo, ktoré tieto podmienky nespĺňa, jazyk nie je bezkontextový.',
      hint: 'Rozkladá sa na päť častí u,v,x,y,z s pumpovaním v a y.'
    }
  ];

  let examQuestions = [];
  let examIndex = 0;
  let currentQuestion = null;

  function startExam() {
    const selectedCategories = Array.from(categoryDiv.querySelectorAll('input[type=checkbox]'))
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    let n = parseInt(countInput.value);
    if (isNaN(n) || n <= 0) n = 1;
    // vyber otázky podľa kategórií
    let pool = questions.filter(q => selectedCategories.includes(q.category));
    if (pool.length === 0) pool = questions.slice();
    // miešanie
    const shuffled = pool.sort(() => Math.random() - 0.5);
    examQuestions = shuffled.slice(0, Math.min(n, shuffled.length));
    examIndex = 0;
    setupDiv.style.display = 'none';
    quizCard.style.display = '';
    showExamQuestion();
  }

  function showExamQuestion() {
    if (!examQuestions || examQuestions.length === 0) return;
    currentQuestion = examQuestions[examIndex];
    quizCard.innerHTML = '';
    const qDiv = document.createElement('div');
    qDiv.className = 'quiz-question';
    qDiv.innerHTML = `<p><strong>Otázka ${examIndex + 1}/${examQuestions.length} (${currentQuestion.category.toUpperCase()}):</strong> ${currentQuestion.prompt}</p>`;
    const textarea = document.createElement('textarea');
    textarea.rows = 4;
    textarea.placeholder = 'Vaša odpoveď...';
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'quiz-controls';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Predošlá';
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Ďalšia';
    const hintBtn = document.createElement('button');
    hintBtn.textContent = 'Hint';
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Odoslať';
    const feedback = document.createElement('div');
    feedback.className = 'quiz-feedback';
    hintBtn.addEventListener('click', () => {
      feedback.innerHTML = `<p><strong>Hint:</strong> ${currentQuestion.hint || 'Bez nápovedy.'}</p>`;
    });
    submitBtn.addEventListener('click', () => {
      feedback.innerHTML = `<p><strong>Vzorová odpoveď:</strong> ${currentQuestion.answer}</p>`;
    });
    prevBtn.addEventListener('click', () => {
      if (examIndex > 0) {
        examIndex--;
        showExamQuestion();
      }
    });
    nextBtn.addEventListener('click', () => {
      if (examIndex < examQuestions.length - 1) {
        examIndex++;
        showExamQuestion();
      }
    });
    // disable prev/next when out of bounds
    prevBtn.disabled = examIndex === 0;
    nextBtn.disabled = examIndex === examQuestions.length - 1;
    buttonsDiv.appendChild(prevBtn);
    buttonsDiv.appendChild(nextBtn);
    buttonsDiv.appendChild(hintBtn);
    buttonsDiv.appendChild(submitBtn);
    qDiv.appendChild(textarea);
    qDiv.appendChild(buttonsDiv);
    qDiv.appendChild(feedback);
    quizCard.appendChild(qDiv);
  }

  startBtn.addEventListener('click', startExam);
});