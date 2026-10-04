/* MCDO FIT — data: instelbare getallen, oefeningen, uitleg, dagen en achievements.
   Dit is het bestand om aan te passen als je oefeningen wilt toevoegen of wijzigen. */

/* =====================================================================
   INSTELBARE CONSTANTEN
   ===================================================================== */
const INACTIEF_DAGEN = 10;          // na zoveel dagen zonder sessie: teller naar volgend niveau terug op 0 (niveau zelf blijft)
const LEVEL_STAPPEN = [5,5,10,10,10]; // sessies nodig voor niveau 1→2, 2→3, 3→4, 4→5, 5→6
const MAX = 6;
const KEY = "mcdofit:v2";

/* =====================================================================
   CATEGORIEËN & OEFENINGEN
   Elke oefening: cat (categorie), n (naam), lv (6 niveaus).
   Een niveau is "reps" of {r, n?, note?, easy?} — n overschrijft de naam (bv. Split squats).
   Mobiliteit heeft sub: "open" (opwarmer) of "close" (afsluitstretch).
   ===================================================================== */
const CATS={
  benen:{label:"Benen",short:"Benen"},
  billen:{label:"Billen/heupen",short:"Billen"},
  core:{label:"Core",short:"Core"},
  bovenlijf:{label:"Bovenlijf",short:"Bovenlijf"},
  mobi:{label:"Mobiliteit/stretch",short:"Mobiliteit"},
};

const EX={
  /* ---- Benen ---- */
  squat:{cat:"benen",n:"Squats",lv:[{r:"8×",easy:"tot op een stoel zakken"},"10×",{r:"10×",note:"traag: 3 tellen zakken"},{r:"12×",note:"traag: 3 tellen zakken"},{n:"Split squats",r:"8× p/been",easy:"steun met een hand"},{n:"Split squats",r:"10× p/been"}]},
  lunge:{cat:"benen",n:"Reverse lunges",lv:[{r:"6× p/been",easy:"steun met een hand"},"8× p/been","10× p/been",{r:"10× p/been",note:"traag"},"12× p/been",{r:"12× p/been",note:"traag"}]},
  wallsit:{cat:"benen",n:"Wall sit",lv:[{r:"20 sec",easy:"minder diep zakken"},"25 sec","30 sec","40 sec","45 sec","50 sec"]},
  calf:{cat:"benen",n:"Calf raises",lv:["12×","15×",{r:"15×",note:"traag, 2 tellen boven"},{n:"Single-leg calf raises",r:"12× p/been"},{n:"Single-leg calf raises",r:"14× p/been"},{n:"Single-leg calf raises",r:"16× p/been"}]},
  stepup:{cat:"benen",n:"Step-ups",lv:[{r:"6× p/been",easy:"lage trede, steun aan de leuning"},"8× p/been","10× p/been",{r:"10× p/been",note:"traag: 3 tellen zakken"},"12× p/been",{r:"12× p/been",note:"hogere trede"}]},
  /* ---- Billen/heupen ---- */
  glute:{cat:"billen",n:"Glute bridge",lv:["10×","12×","14×",{n:"Single-leg glute bridge",r:"8× p/been"},{n:"Single-leg glute bridge",r:"10× p/been"},{n:"Single-leg glute bridge",r:"12× p/been"}]},
  kickback:{cat:"billen",n:"Glute kickbacks",lv:["10× p/been","12× p/been",{r:"12× p/been",note:"even vasthouden boven"},{r:"14× p/been",note:"even vasthouden boven"},"15× p/been",{r:"15× p/been",note:"2 tellen vasthouden"}]},
  clamshell:{cat:"billen",n:"Clamshells",lv:["10× p/kant","12× p/kant","15× p/kant",{r:"15× p/kant",note:"even vasthouden open"},"18× p/kant",{r:"20× p/kant",note:"even vasthouden open"}]},
  hydrant:{cat:"billen",n:"Fire hydrants",lv:["8× p/kant","10× p/kant","12× p/kant",{r:"12× p/kant",note:"even vasthouden boven"},"15× p/kant",{r:"15× p/kant",note:"2 tellen vasthouden"}]},
  legraise:{cat:"billen",n:"Zijwaarts beenheffen",lv:["10× p/kant","12× p/kant","14× p/kant","15× p/kant",{r:"15× p/kant",note:"traag"},{r:"18× p/kant",note:"traag"}]},
  /* ---- Core ---- */
  plank:{cat:"core",n:"Plank",lv:[{r:"15 sec",easy:"op je knieën"},{r:"20 sec",easy:"op je knieën"},"30 sec","40 sec","45 sec","50 sec"]},
  sideplank:{cat:"core",n:"Side plank",lv:[{r:"10 sec p/kant",easy:"op je onderste knie"},{r:"15 sec p/kant",easy:"op je onderste knie"},"20 sec p/kant","25 sec p/kant","30 sec p/kant","35 sec p/kant"]},
  deadbug:{cat:"core",n:"Dead bug",lv:["6× p/kant","8× p/kant","10× p/kant",{r:"10× p/kant",note:"traag"},{r:"12× p/kant",note:"traag"},{r:"14× p/kant",note:"traag"}]},
  birddog:{cat:"core",n:"Bird dog",lv:["6× p/kant","8× p/kant","10× p/kant",{r:"10× p/kant",note:"even vasthouden"},{r:"12× p/kant",note:"2 tellen vasthouden"},{r:"14× p/kant",note:"2 tellen vasthouden"}]},
  superman:{cat:"core",n:"Superman",lv:["8×","10×",{r:"10×",note:"2 tellen vasthouden"},{r:"12×",note:"2 tellen vasthouden"},{r:"12×",note:"3 tellen vasthouden"},{r:"14×",note:"3 tellen vasthouden"}]},
  /* ---- Bovenlijf ---- */
  push:{cat:"bovenlijf",n:"Push-ups",lv:[{n:"Wall push-ups",r:"8×"},{n:"Incline push-ups",r:"8×",easy:"hogere steun = makkelijker"},{n:"Incline push-ups",r:"10×"},{n:"Knee push-ups",r:"8×"},{n:"Knee push-ups",r:"10×"},{r:"8×",easy:"op je knieën, 12×"}]},
  dips:{cat:"bovenlijf",n:"Triceps-dips (stoel)",lv:[{r:"6×",easy:"knieën gebogen, voeten dichtbij"},"8×","10×",{r:"8×",note:"benen gestrekt"},{r:"10×",note:"benen gestrekt"},{r:"12×",note:"benen gestrekt"}]},
  ytw:{cat:"bovenlijf",n:"Y-T-W-heffen",lv:["4× per letter","5× per letter","6× per letter",{r:"6× per letter",note:"even vasthouden"},"8× per letter",{r:"8× per letter",note:"2 tellen vasthouden"}]},
  taps:{cat:"bovenlijf",n:"Shoulder taps",lv:[{r:"10× totaal",easy:"op je knieën"},{r:"12× totaal",easy:"op je knieën"},"12× totaal","16× totaal","20× totaal",{r:"20× totaal",note:"traag, heupen stil"}]},
  /* ---- Mobiliteit: openers ---- */
  catcow:{cat:"mobi",sub:"open",n:"Cat-cow",lv:["6×","8×","8×","8×","10×","10×"]},
  wgs:{cat:"mobi",sub:"open",n:"World's greatest stretch",lv:["4× p/kant","4× p/kant","5× p/kant","5× p/kant","6× p/kant","6× p/kant"]},
  shoulderroll:{cat:"mobi",sub:"open",n:"Arm circles & shoulder rolls",lv:["20 sec","20 sec","30 sec","30 sec","30 sec","30 sec"]},
  hipopener:{cat:"mobi",sub:"open",n:"Hip openers (knie-cirkels)",lv:["6× p/kant","6× p/kant","8× p/kant","8× p/kant","8× p/kant","8× p/kant"]},
  legswings:{cat:"mobi",sub:"open",n:"Beenzwaaien",lv:["10× p/been","10× p/been","12× p/been","12× p/been","12× p/been","12× p/been"]},
  /* ---- Mobiliteit: afsluiters ---- */
  hipflexor:{cat:"mobi",sub:"close",n:"Hip flexor stretch",lv:["30 sec p/kant","30 sec p/kant","30 sec p/kant","30 sec p/kant","40 sec p/kant","40 sec p/kant"]},
  hamstring:{cat:"mobi",sub:"close",n:"Hamstring stretch",lv:["30 sec p/kant","30 sec p/kant","30 sec p/kant","30 sec p/kant","40 sec p/kant","40 sec p/kant"]},
  quad:{cat:"mobi",sub:"close",n:"Quad stretch",lv:["30 sec p/kant","30 sec p/kant","30 sec p/kant","30 sec p/kant","40 sec p/kant","40 sec p/kant"]},
  chest:{cat:"mobi",sub:"close",n:"Borststretch",lv:["30 sec","30 sec","30 sec","30 sec","40 sec","40 sec"]},
  childs:{cat:"mobi",sub:"close",n:"Child's pose",lv:["30 sec","30 sec","30 sec","30 sec","40 sec","40 sec"]},
  spinaltwist:{cat:"mobi",sub:"close",n:"Liggende rugdraai",lv:["30 sec p/kant","30 sec p/kant","30 sec p/kant","30 sec p/kant","40 sec p/kant","40 sec p/kant"]},
};

const INFO={
  "Cat-cow":"Op handen en knieën. Wissel traag tussen holle rug (kijk omhoog) en bolle rug (kin naar de borst), mee op je adem. Losmaker voor de rug.",
  "Squats":"Voeten op heupbreedte. Zak alsof je op een stoel gaat zitten: heupen naar achter, knieën volgen de tenen, rug recht. Duw via je hielen weer omhoog.",
  "Split squats":"Sta in een schrede: één voet voor, één achter. Zak recht naar beneden tot de achterste knie bijna de grond raakt, duw via de voorste hiel omhoog. Reps per been. Steun eventueel met een hand.",
  "Reverse lunges":"Stap met één been naar achter en zak tot de achterste knie bijna de grond raakt. Duw via het voorste been terug naar stand. Reps per been. Steun eventueel met een hand.",
  "Step-ups":"Zet één voet volledig op een stevige trede of een laag bankje. Duw via die hiel omhoog tot je rechtop staat, breng het andere been bij en stap gecontroleerd terug. Reps per been. Steun eventueel aan de leuning.",
  "Wall push-ups":"Sta op armlengte van een muur, handen op schouderhoogte. Buig je armen om je borst naar de muur te laten zakken, duw terug. De makkelijkste push-up.",
  "Incline push-ups":"Handen op een verhoging (aanrecht, tafel, trap). Hoe hoger de steun, hoe makkelijker. Zak met je borst naar de rand, duw terug, lichaam recht.",
  "Knee push-ups":"Push-up steunend op je knieën i.p.v. je tenen. Handen iets breder dan schouders, lichaam recht van knie tot hoofd, zak en duw.",
  "Push-ups":"Volledige push-up op handen en tenen. Lichaam één rechte lijn, zak tot je borst bijna de grond raakt, duw terug. Span je buik aan.",
  "Triceps-dips (stoel)":"Zit op de rand van een stevige stoel (tegen de muur), handen naast je heupen. Schuif je zit van de stoel en zak door je ellebogen naar achter te buigen tot ongeveer 90°, duw terug. Gebogen knieën = makkelijker, gestrekte benen = zwaarder.",
  "Y-T-W-heffen":"Op je buik, voorhoofd op een handdoek. Til je armen een paar cm op en maak na elkaar een Y (schuin boven je hoofd), een T (zijwaarts) en een W (ellebogen bij je zij), schouderbladen samen. Traint bovenrug en schouders.",
  "Shoulder taps":"In hoge plank, handen onder je schouders. Tik met één hand je andere schouder aan zonder met je heupen te wiebelen, dan de andere hand. Voeten breder = stabieler, op je knieën = makkelijker.",
  "Glute bridge":"Op je rug, knieën gebogen, voeten plat. Duw je heupen omhoog tot schouder–heup–knie één lijn vormen door je billen aan te spannen. Gecontroleerd zakken.",
  "Single-leg glute bridge":"Glute bridge met één been gestrekt omhoog. Duw via de hiel van het steunende been je heup omhoog, bekken recht houden. Reps per been.",
  "Glute kickbacks":"Op handen en knieën. Duw één been naar achter-omhoog (voet naar het plafond), knie ~90°, tot je bil aanspant. Rustig terug. Reps per been.",
  "Clamshells":"Lig op je zij, knieën gebogen, hielen tegen elkaar. Open je bovenste knie als een schelp zonder je bekken naar achter te laten kantelen, traag terug. Reps per kant.",
  "Fire hydrants":"Op handen en knieën. Til één gebogen knie zijwaarts op tot heuphoogte, romp stil, traag terug. Reps per kant.",
  "Zijwaarts beenheffen":"Lig op je zij, onderste been licht gebogen, bovenste gestrekt. Til het bovenste been schuin omhoog met de tenen naar voor (niet naar boven), traag zakken. Reps per kant.",
  "Calf raises":"Duw je hielen zo hoog mogelijk omhoog tot je op je tenen staat, even vasthouden, traag zakken. Steun licht met een hand voor je evenwicht.",
  "Single-leg calf raises":"Calf raise op één been, het andere licht van de grond. Duw je hiel hoog op, traag zakken. Steun met een hand aan de muur. Reps per been.",
  "Wall sit":"Rug plat tegen de muur, zak tot je knieën ongeveer 90° zijn (alsof je op een onzichtbare stoel zit). Hou de tijd vast. Minder diep zakken = makkelijker.",
  "Bird dog":"Op handen en knieën. Strek tegelijk je ene arm naar voor en het tegenovergestelde been naar achter, in lijn met je rug. Even vasthouden, dan de andere kant.",
  "Dead bug":"Op je rug, armen recht omhoog, knieën in 90°. Laat traag je ene arm én het tegenovergestelde been zakken tot net boven de grond, terug, dan de andere kant. Onderrug tegen de vloer.",
  "Plank":"Steun op onderarmen en tenen, lichaam één rechte lijn van hoofd tot hielen. Span buik en billen aan, hol niet door. Op je knieën = makkelijker.",
  "Side plank":"Lig op je zij, steun op één onderarm, lichaam recht, heup omhoog. Hou de tijd vast, dan de andere kant. Op je onderste knie steunen = makkelijker.",
  "Superman":"Op je buik, armen naar voor gestrekt. Til tegelijk je armen, borst en benen een stukje van de grond, alsof je vliegt. Even vasthouden, rustig zakken. Traint de rugspieren.",
  "Hip flexor stretch":"Kniel op één knie, andere voet plat voor je. Knijp de bil van het achterste been aan en duw je heup zacht naar voor, romp rechtop. Rek vooraan de heup. Dan wisselen.",
  "Hamstring stretch":"Eén been gestrekt voor je, buig vanuit de heup naar voor met rechte rug tot je rek voelt achteraan het bovenbeen. Dan wisselen. Niet doorveren.",
  "Child's pose":"Kniel, zak met je zit naar je hielen en strek je armen naar voor op de grond. Laat rug en schouders ontspannen. Rustig ademen.",
  "World's greatest stretch":"Grote uitvalspas naar voor. Zet de hand aan de binnenkant van de voorste voet op de grond, draai dan de andere arm open naar het plafond. Terug, dan de andere kant. Volledige-lichaam-losmaker.",
  "Arm circles & shoulder rolls":"Sta rechtop. Maak rustige grote cirkels met je armen (voor- en achterwaarts) en rol je schouders los. Warmt schouders en bovenrug op.",
  "Hip openers (knie-cirkels)":"Op handen en knieën. Beweeg één knie in trage cirkels (open naar buiten, terug), dan de andere kant. Maakt de heupen los voor been-oefeningen.",
  "Beenzwaaien":"Steun met een hand aan de muur en zwaai één been rustig voor- en achterwaarts, dan zijwaarts. Dynamische opwarming voor heupen en benen. Dan het andere been.",
  "Quad stretch":"Sta rechtop, pak je enkel en trek je hiel naar je bil, knieën naast elkaar. Rek vooraan het dijbeen. Steun met een hand voor je evenwicht. Dan wisselen.",
  "Borststretch":"Vouw je handen achter je rug samen en til ze licht op terwijl je je borst opent en schouders naar achter brengt. Rekt borst en voorkant schouders.",
  "Liggende rugdraai":"Lig op je rug, armen gespreid. Laat je gebogen knieën traag naar één kant zakken terwijl je schouders op de grond blijven. Rek in onderrug en romp. Dan de andere kant."
};

/* =====================================================================
   DAGEN = CATEGORIE-SLOTS
   Elke dag: opener (mobiliteit) + slots + optionele oefening + afsluitstretch.
   De titel wordt automatisch afgeleid uit de slots, dus die klopt altijd.
   ===================================================================== */
const DAYS=[
  {tag:"A",slots:["benen","benen","billen","core","bovenlijf"],opt:"billen"},
  {tag:"B",slots:["bovenlijf","bovenlijf","core","core","billen"],opt:"benen"},
  {tag:"C",slots:["billen","billen","core","benen","bovenlijf"],opt:"core"},
  {tag:"D",slots:["benen","billen","core","bovenlijf"],opt:"bovenlijf"},
];

/* =====================================================================
   ACHIEVEMENTS
   ===================================================================== */
const ACH=[
  {id:"s1",kind:"total",n:1,em:"🌱",name:"Van start",sub:"1e sessie"},
  {id:"s7",kind:"total",n:7,em:"📅",name:"Eerste week rond",sub:"7 sessies"},
  {id:"s21",kind:"total",n:21,em:"💪",name:"Drie weken",sub:"21 sessies"},
  {id:"s50",kind:"total",n:50,em:"🏅",name:"Vaste waarde",sub:"50 sessies"},
  {id:"s100",kind:"total",n:100,em:"🏆",name:"Honderd",sub:"100 sessies"},
  {id:"k3",kind:"streak",n:3,em:"🔥",name:"Op dreef",sub:"3 op rij"},
  {id:"k7",kind:"streak",n:7,em:"🔥",name:"Week op rij",sub:"7 op rij"},
  {id:"k14",kind:"streak",n:14,em:"🔥",name:"Twee weken strak",sub:"14 op rij"},
  {id:"k30",kind:"streak",n:30,em:"⚡",name:"IJzeren discipline",sub:"30 op rij"},
  {id:"lvl",kind:"max",n:6,em:"⛰️",name:"Onderhoudsmodus",sub:"niveau 6 bereikt"},
];
