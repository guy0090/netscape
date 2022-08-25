export function getClassIdFromSkillId(id: string | number) {
  if (typeof id === "number") id = `${id}`;

  let classId = 0;
  Object.entries(skills).every((entry) => {
    const [key, value] = entry;
    if (id in value) {
      classId = parseInt(key);
      return false;
    }
    return true;
  });

  return classId;
}

export const skills = {
  "102": {
    "16000": "Basic Attack",
    "16010": "Fist Attack",
    "16020": "Basic Attack",
    "16030": "Power Break",
    "16040": "Tumbling",
    "16045": "Stand Up",
    "16046": "Stand Up",
    "16050": "Crime Hazard",
    "16060": "Shoulder Charge",
    "16061": "Shoulder Charge",
    "16070": "Whirlwind",
    "16080": "Hell Blade",
    "16090": "Strike Wave",
    "16100": "Double Slash",
    "16110": "Assault Blade",
    "16120": "Red Dust",
    "16130": "Burst",
    "16131": "폭주 흑화 광기 각인",
    "16132": "폭주 흑화 광기 각인 해제",
    "16140": "Bloody Rush",
    "16141": "Dark Rush",
    "16150": "Charge Strike",
    "16160": "Theatric Combat Switch",
    "16170": "Hell Blade Temp",
    "16180": "Hell Blade Temp",
    "16181": "Hell Blade Temp",
    "16190": "Tempest Slash",
    "16210": "Diving Slash",
    "16220": "Mountain Crash",
    "16300": "Finish Strike",
    "16400": "Aura Blade",
    "16500": "Chain Sword",
    "16600": "Sword Storm",
    "16610": "Wind Blade",
    "16620": "Maelstrom",
    "16700": "Chain of Vengeance",
    "16710": "Berserk Fury",
  },
  "103": {
    "18000": "Basic 3 Chain Hits",
    "18010": "Activate Hypergravity",
    "18011": "Vortex Gravity",
    "18020": "Run",
    "18025": "Stand Up",
    "18026": "Stand Up",
    "18030": "Hypergravity Basic Attack",
    "18050": "Heavy Crush",
    "18060": "Gravity Impact",
    "18070": "Full Swing",
    "18080": "Earth Smasher",
    "18090": "One-Man Army",
    "18100": "Neutralizer",
    "18110": "Dreadnaught",
    "18120": "Terra Break",
    "18130": "Seismic Hammer",
    "18140": "Endure Pain",
    "18150": "Earth Eater",
    "18160": "Jumping Smash",
    "18170": "Perfect Swing",
    "18180": "Power Strike",
    "18190": "Gravity Compression",
    "18200": "Gravity Force",
    "18201": "Gravity Force",
    "18210": "Running Crash",
    "18220": "Power Shoulder",
    "18230": "Big Bang",
  },
  "104": {
    "17000": "Basic Attack 3 Combo Hits",
    "17010": "Fist Attack 3 Chain Hits",
    "17020": "Back Step",
    "17025": "Stand Up",
    "17026": "Stand Up",
    "17030": "Sharp Gunlance",
    "17040": "Bash",
    "17050": "Shield Charge",
    "17060": "Fire Bullet",
    "17070": "Rising Gunlance",
    "17080": "Dash Upper Fire",
    "17090": "Hook Chain",
    "17100": "Shield Shock",
    "17101": "Shield Shock",
    "17110": "Leap Attack",
    "17130": "Nellasia's Energy",
    "17140": "Guardian's Thunderbolt",
    "17150": "Shield Bash",
    "17160": "Gunlance Shot",
    "17170": "Guardian's Protection",
    "17180": "Shout of Hatred",
    "17190": "Counter Gunlance",
    "17200": "Surge Cannon",
    "17210": "Charged Stinger",
    "17220": "Lance of Judgment",
    "17800": "Defensive Stance",
    "17820": "Battlefield Shield",
  },
  "105": {
    "36000": "Basic Attack",
    "36001": "Heavenly Guardian Basic Attack",
    "36010": "Unarmed Basic Attack",
    "36020": "Sprint",
    "36025": "Stand Up",
    "36026": "PvP Forced Wakeup",
    "36030": "Spin Slash",
    "36040": "Flash Thrust",
    "36050": "Light Shock",
    "36060": "Light of Judgment",
    "36070": "Charge",
    "36080": "Sword of Justice",
    "36090": "Flash Shash",
    "36100": "Holy Explosion",
    "36110": "Punishment",
    "36120": "Holy Area",
    "36130": "Dash Slash",
    "36140": "Holy Protection",
    "36150": "Godsent Law",
    "36160": "Executor's Sword",
    "36170": "Wrath of God",
    "36180": "Execution of Justice",
    "36190": "Holy Sword",
    "36200": "Heavenly Blessings",
    "36210": "Alithanes's Judgment",
    "36220": "Alithanes's Light",
    "36800": "Holy Aura",
    "36810": "신성의 오라 종료",
    "36900": "Sacred Executioner",
    "36910": "Sacred Executioner",
  },
  "202": {
    "19030": "Evoke",
    "19040": "Checkmate",
    "19050": "Dark Resurrection",
    "19090": "Ghost",
    "19091": "Twisted Fate",
    "19092": "Moon",
    "19093": "Corrosion",
    "19094": "Star",
    "19095": "Wheel of Fortune",
    "19096": "Royal",
    "19097": "Three-Headed Snake",
    "19098": "Judgment",
    "19099": "Balance",
    "19100": "Vanish",
    "19105": "Stand Up",
    "19106": "Stand Up",
    "19110": "Prismatic Mirror",
    "19120": "Unlimited Shuffle",
    "19140": "Celestial Rain",
    "19150": "Stream of Edge",
    "19160": "Four of a Kind",
    "19170": "Quadra Accelerate",
    "19180": "Call of Destiny",
    "19190": "Spiral Edge",
    "19195": "Spiral Edge",
    "19200": "Dancing of Spineflower",
    "19210": "Mysterious Stampede",
    "19215": "Mysterious Stampede",
    "19230": "Infinity Shower",
    "19240": "Serendipity",
    "19260": "Return",
    "19280": "Mayhem",
    "19281": "Cull",
    "19282": "Emperor",
    "19283": "Empress",
    "19290": "Evoke",
    "19300": "Evoke",
    "19310": "Secret Garden",
    "19320": "Scratch Dealer",
    "19330": "Deathbound",
  },
  "203": {
    "20020": "Crystalline Magick",
    "20030": "Steed Charge",
    "20040": "Reine's Protection",
    "20050": "Flash Explosion",
    "20051": "Flash Explosion",
    "20060": "Fleeting Gale Bird",
    "20070": "Alimaji",
    "20080": "Jahia & Ligheas",
    "20090": "Elcid",
    "20110": "Pauru",
    "20120": "Pauru - Flame Breath",
    "20125": "Pauru - Self-Destruct",
    "20130": "Maririn",
    "20137": "Maririn - Taunt",
    "20138": "Maririn - Charge",
    "20139": "Maririn - Stagger",
    "20160": "Shurdi",
    "20170": "Osh",
    "20180": "Sticky Moss Swamp",
    "20200": "Released Will",
    "20210": "Elemental Wings",
    "20215": "Stand Up",
    "20216": "Stand Up",
    "20220": "Winged Spirit",
    "20230": "Electricity Release",
    "20231": "Electricity Release",
    "20240": "Earth Collapse",
    "20250": "Water Elemental",
    "20260": "Ancient Spear",
    "20270": "Electric Storm",
    "20280": "Phoenix",
    "20290": "Kelsion",
    "20291": "Kelsion",
    "20292": "Kelsion",
    "20293": "Kelsion",
    "20294": "Kelsion - Thunderstroke",
    "20300": "Bagron's Wrath",
    "20310": "Akir",
    "20330": "Pauru - Flame Breath",
    "20335": "Pauru - Self-Destruct",
    "20347": "Maririn - Taunt",
    "20348": "Maririn - Charge",
    "20349": "Maririn - Stagger",
  },
  "204": {
    "21020": "Sound Shock",
    "21040": "Conviction Core",
    "21050": "Sound Wave",
    "21060": "Dissonance",
    "21070": "Wind of Music",
    "21079": "Wind of Music",
    "21080": "Prelude of Storm",
    "21090": "Stigma",
    "21100": "Sound Illusion",
    "21110": "Note Bundle",
    "21120": "Soundholic",
    "21130": "Serenade of Salvation",
    "21131": "Serenade of Salvation",
    "21132": "Serenade of Salvation",
    "21133": "Serenade of Salvation",
    "21140": "Serenade of Courage",
    "21141": "Serenade of Courage",
    "21142": "Serenade of Courage",
    "21143": "Serenade of Courage",
    "21150": "Rhythm Buckshot",
    "21160": "Heavenly Tune",
    "21170": "Sonic Vibration",
    "21180": "Harp of Rhythm",
    "21215": "Stand Up",
    "21216": "Stand Up",
    "21230": "Symphonia",
    "21240": "Prelude of Death",
    "21250": "Guardian Tune",
    "21260": "Rhapsody of Light",
    "21270": "March",
    "21280": "Oratorio",
  },
  "205": {
    "37000": "[소서리스] 기본 공격",
    "37010": "[소서리스] 맨손 평타",
    "37020": "Phase Leap",
    "37030": "Stand Up",
    "37040": "Stand Up",
    "37100": "Arcane Rupture",
    "37101": "Arcane Rupture",
    "37102": "[소서리스][아이덴티티티] 마력 방출 (z 스킬 off)",
    "37110": "Blink",
    "37200": "Blaze",
    "37210": "Lightning Vortex",
    "37211": "[소서리스][라이트닝 볼텍스][7번] 체인 스킬",
    "37220": "Ice Shower",
    "37230": "Inferno",
    "37240": "Energy Discharge",
    "37250": "Rime Arrow",
    "37260": "Esoteric Reaction",
    "37270": "Punishing Strike",
    "37280": "Reverse Gravity",
    "37290": "Elegian's Touch",
    "37291": "Elegian's Touch",
    "37300": "Lightning Bolt",
    "37310": "Squall",
    "37320": "Seraphic Hail",
    "37330": "Explosion",
    "37340": "Frost's Call",
    "37341": "Frost's Call",
    "37350": "Doomsday",
    "37360": "Enviska's Might",
    "37370": "Apocalypse Call",
  },
  "302": {
    "22020": "Esoteric Skill: Blast Formation",
    "22030": "Esoteric Skill: Spiral Impact",
    "22040": "Esoteric Skill: Rising Fire Dragon",
    "22060": "Flash Heat Fang",
    "22070": "Sleeping Ascent Celebration",
    "22080": "Roar of Courage",
    "22090": "Seismic Strike",
    "22100": "Esoteric Skill: Lightning Strike",
    "22110": "Esoteric Skill: Call of the Wind God",
    "22120": "Wind's Whisper",
    "22130": "Phoenix Advent",
    "22150": "Charging Steps",
    "22155": "Stand Up",
    "22156": "Stand Up",
    "22160": "Sky Shattering Blow",
    "22170": "Lightning Kick",
    "22180": "Triple Fist",
    "22190": "Moon Flash Kick",
    "22280": "Swift Wind Kick",
    "22290": "Energy Combustion",
    "22310": "Ultimate Skill: Flash Rage Blow",
    "22320": "Sweeping Kick",
    "22330": "Ultimate Skill: Fist of Dominance",
  },
  "303": {
    "23020": "Charging Blow",
    "23050": "Dragon Advent",
    "23060": "Judgment",
    "23070": "Earthquake Chain",
    "23080": "Chain of Resonance",
    "23090": "Crushing Smite",
    "23100": "Chain Destruction Fist",
    "23110": "Death Rattle",
    "23130": "Supernova",
    "23150": "Instant Hit",
    "23160": "Roundup Sweep",
    "23170": "Duck",
    "23171": "Duck",
    "23172": "Duck",
    "23175": "Stand Up",
    "23176": "Stand Up",
    "23180": "Fierce Tiger Strike",
    "23200": "Continuous Push",
    "23210": "Critical Blow",
    "23220": "Battering Fists",
    "23230": "Iron Cannon Blow",
    "23240": "True Rising Fist",
    "23250": "Undefeated Dragon King",
    "23260": "Shredding Strike",
    "23270": "Mysterious Art: Blast of Ruination",
  },
  "304": {
    "24020": "Hype",
    "24021": "Level 2 Hype",
    "24022": "Level 3 Hype",
    "24023": "Level 3 Hype",
    "24040": "Energy Blast",
    "24050": "World Decimation",
    "24070": "Venomous Fist",
    "24080": "Lightning Palm",
    "24090": "Energy Bullet",
    "24110": "Palm Burst",
    "24120": "Heavenly Squash",
    "24140": "Crippling Barrier",
    "24150": "Nebulous Step",
    "24155": "Stand Up",
    "24156": "Stand Up",
    "24170": "Magnetic Palm",
    "24180": "Pulverizing Palm",
    "24190": "Tempest Blast",
    "24200": "Shadowbreaker",
    "24210": "Merciless Pummel",
    "24220": "Bolting Crash",
    "24230": "Force Orb",
    "24240": "Flash Step",
    "24241": "Flash Step",
    "24242": "Flash Step",
    "24250": "Energy Release",
    "24260": "Deadly Finger",
    "24270": "Decimation Ray",
  },
  "305": {
    "34000": "Focus Stance",
    "34001": "Focus Stance",
    "34020": "Mirage Dash",
    "34030": "Stand Up",
    "34031": "Stand Up",
    "34040": "Double Strike",
    "34050": "Windsplitter",
    "34060": "Stampeding Slash",
    "34061": "Stampeding Slash",
    "34070": "Wheel of Blades",
    "34080": "Flash Kick",
    "34090": "Vault",
    "34100": "Blue Dragon's Claw",
    "34110": "Half Moon Slash",
    "34120": "Chain Slash",
    "34130": "Cutting Wind",
    "34140": "Soul Cutter",
    "34150": "Raging Dragon Slash",
    "34160": "Spear Dive",
    "34170": "Shackling Blue Dragon",
    "34500": "Flurry Stance",
    "34501": "Flurry Stance",
    "34520": "Breakthrough",
    "34540": "Spiraling Spear",
    "34550": "4-Headed Dragon",
    "34560": "Thrust of Destruction",
    "34570": "Starfall Pounce",
    "34580": "Dragonscale Defense",
    "34590": "Red Dragon's Horn",
    "34600": "Yeon-Style Spear Technique: Spear Meteor",
    "34610": "Yeon-Style Spear Technique: Storming Red Dragon",
  },
  "312": {
    "39020": "Esoteric Skill: Blast Formation",
    "39030": "Esoteric Skill: Spiral Impact",
    "39040": "Esoteric Skill: Tiger Emerges",
    "39060": "Flash Heat Fang",
    "39070": "Sleeping Ascent Celebration",
    "39080": "Lightning Whisper",
    "39090": "Berserk Circle",
    "39100": "Esoteric Skill: Lightning Tiger Strike",
    "39110": "Esoteric Skill: Call the Wind God",
    "39120": "Storm Dragon Awakening",
    "39121": "Storm Dragon Awakening",
    "39122": "Storm Dragon Awakening",
    "39130": "Phoenix Advent",
    "39150": "Charging Steps",
    "39155": "Stand Up",
    "39156": "Stand Up",
    "39160": "Sky Shattering Blow",
    "39170": "Lightning Kick",
    "39180": "Triple Fist",
    "39190": "Moon Flash Kick",
    "39280": "Swift Wind Kick",
    "39290": "Violent Tiger",
    "39310": "Ultimate Skill: Nova Blast",
    "39320": "Sweeping Kick",
    "39330": "Ultimate Skill: True Heavenly Awakening",
  },
  "402": {
    "25020": "High-Speed Move",
    "25025": "Stand Up",
    "25030": "Death Trance",
    "25031": "Death Trance",
    "25032": "Death Trance",
    "25035": "Level 1",
    "25036": "Level 2",
    "25037": "Level 3",
    "25038": "Zero",
    "25040": "Surprise Attack",
    "25050": "Wind Cut",
    "25060": "Upper Slash",
    "25070": "Earth Cleaver",
    "25080": "Death Sentence",
    "25090": "Twin Shadows",
    "25093": "Twin Shadows",
    "25100": "Blade Dance",
    "25110": "Soul Absorber",
    "25120": "Spincutter",
    "25130": "Turning Slash",
    "25140": "Moonlight Sonic",
    "25150": "Dark Axel",
    "25160": "Maelstrom",
    "25170": "Polestar",
    "25180": "Void Strike",
    "25190": "Fatal Wave",
    "25200": "Blitz Rush",
    "25210": "Head Hunt",
    "25300": "Flash Blink",
    "25350": "Blade Assault",
  },
  "403": {
    "27020": "Rush",
    "27025": "Stand Up",
    "27026": "Stand Up",
    "27030": "Demonize",
    "27032": "Cancel Demonization",
    "27035": "Gate of Eruption",
    "27050": "Demonic Slash",
    "27051": "Demonic Slash",
    "27060": "Nimble Cut",
    "27070": "Slasher",
    "27080": "Brutal Cross",
    "27090": "Demon's Grip",
    "27100": "Rising Claw",
    "27110": "Piercing Thorn",
    "27120": "Demon Vision",
    "27130": "Grind Chain",
    "27140": "Spinning Dive",
    "27170": "Howl",
    "27180": "Cruel Cutter",
    "27200": "Thrust Impact",
    "27210": "Demonic Clone",
    "27220": "Demolition",
    "27230": "Spinning Weapon",
    "27240": "Decimate",
    "27250": "Sharpened Cut",
    "27800": "Basic Attack",
    "27801": "Rift Walk",
    "27810": "Ruining Rush",
    "27820": "Death Claw",
    "27830": "Gore Bleeding",
    "27840": "Destruction",
    "27850": "Leaping Blow",
    "27860": "Blood Massacre",
    "27870": "Stand Up",
    "27890": "Fallen Ruin",
  },
  "404": {
    "26020": "Shadow Step",
    "26030": "Stand Up",
    "26031": "[리퍼] [PVP][기상액션]",
    "26040": "Persona",
    "26050": "Spinning Dagger",
    "26060": "Spirit Catch",
    "26070": "Shadow Dot",
    "26080": "Iblisto",
    "26090": "Nightmare",
    "26100": "Nightmare",
    "26110": "Saber Stinger",
    "26120": "Death Side",
    "26130": "Nightmare",
    "26140": "Phantom Dancer",
    "26150": "Phantom Dancer",
    "26500": "",
    "26510": "Distortion",
    "26520": "Blink",
    "26530": "Blink",
    "26540": "[리퍼][그림자] 블링크 소환수 명령 - 단검공격",
    "26550": "Call of the Knife",
    "26560": "Black Mist",
    "26570": "Shadow Trap",
    "26590": "[리퍼][그림자] 쉐도우 트랩 7번 체인 스킬",
    "26600": "Shadow Storm",
    "26610": "Blink",
    "26620": "[리퍼][그림자] 블링크 소환수 명령 - 전진베기",
    "26800": "Last Graffiti",
    "26810": "Rage Spear",
    "26820": "Silent Smasher",
    "26830": "Dance of Fury",
    "26900": "Lunar Eclipse: Cadenza",
    "26910": "Solar Eclipse: Requiem",
    "26920": "Solar Eclipse: Requiem",
    "26930": "Solar Eclipse: Requiem",
    "26950": "Solar Eclipse: Requiem",
  },
  "502": {
    "28015": "Slide",
    "28017": "Stand Up",
    "28020": "Rapid Shot",
    "28030": "Salvo",
    "28040": "Atomic Arrow",
    "28050": "Electric Nova",
    "28060": "Smokescreen Arrow",
    "28070": "Arrow Wave",
    "28080": "Arrow Shower",
    "28090": "Charged Shot",
    "28100": "Evasive Fire",
    "28110": "Sharp Shooter",
    "28120": "DM-42",
    "28125": "DM-42",
    "28130": "Deadly Slash",
    "28140": "Moving Slash",
    "28150": "Blade Storm",
    "28157": "Summon Silverhawk",
    "28158": "Summon Silverhawk",
    "28159": "Silverhawk Basic Attack",
    "28160": "Wings of Storm",
    "28170": "Last Rush",
    "28190": "Claymore Mine",
    "28200": "Shadow Arrow",
    "28210": "Stalker",
    "28220": "Snipe",
    "28230": "Fenrir's Messenger",
    "28240": "Golden Eye",
  },
  "503": {
    "29020": "Enforce Execution",
    "29040": "Sign of Apocalypse",
    "29041": "Sign of Apocalypse",
    "29050": "Hour of Judgment",
    "29060": "Spiral Flame",
    "29070": "Triple Explosion",
    "29071": "Triple Explosion",
    "29072": "Triple Explosion",
    "29073": "Triple Explosion",
    "29080": "Catastrophe",
    "29090": "Death Fire",
    "29100": "Meteor Stream",
    "29110": "Shotgun Dominator",
    "29120": "AT02 Grenade",
    "29140": "Plasma Bullet",
    "29150": "Tumbling",
    "29155": "Stand Up",
    "29160": "Change Stance",
    "29161": "Change Stance",
    "29162": "Change Stance",
    "29163": "Change Stance",
    "29164": "Change Stance",
    "29170": "Shotgun Rapid Fire",
    "29180": "Spiral Tracker",
    "29190": "Cruel Tracker",
    "29200": "Dexterous Shot",
    "29210": "Somersault Shot",
    "29220": "Equilibrium",
    "29230": "Last Request",
    "29240": "Aimed Shot",
    "29250": "Clay Bombardment",
    "29260": "Quick Shot",
    "29261": "Quick Shot",
    "29262": "Quick Shot",
    "29270": "Perfect Shot",
    "29280": "Bursting Flare",
  },
  "504": {
    "30015": "Roll",
    "30020": "Enter Barrage Mode",
    "30021": "Exit Barrage Mode",
    "30050": "Enhanced Shell",
    "30060": "Freeze Shell",
    "30070": "Buckshot",
    "30080": "Multiple Rocket Launcher",
    "30090": "Howitzer",
    "30100": "Summon Turret",
    "30110": "Air Raid",
    "30120": "Flamethrower",
    "30140": "Swing",
    "30150": "Jump Barrage",
    "30155": "Stand Up",
    "30160": "Energy Field",
    "30170": "Gatling Gun",
    "30180": "Napalm Shot",
    "30190": "Forward Barrage",
    "30200": "Gravity Explosion",
    "30210": "Plasma Storm",
    "30220": "Homing Barrage",
    "30230": "Missile Barrage",
    "30240": "Barrage: Basic Attack",
    "30250": "Barrage: Howitzer",
    "30260": "Barrage: Focus Fire",
    "30270": "Barrage: Energy Cannon",
    "30280": "Heavy Turret",
    "30285": "Photoelectronic Cannon",
    "30290": "Bombardment: Impregnability",
  },
  "505": {
    "35020": "Tremors",
    "35030": "Stand Up",
    "35040": "Bullet Hail",
    "35050": "Overcharged Battery",
    "35060": "Command: Carpet",
    "35061": "[드론] 카펫",
    "35070": "Command: Blockade",
    "35071": "[드론] 블록케이드",
    "35080": "Command: Flare Beam",
    "35081": "[드론] 플레어 빔",
    "35090": "Command: Active Pulse",
    "35091": "[드론] 액티브 펄스",
    "35100": "Command: Baby Drones",
    "35101": "[드론] 베이비 드론",
    "35110": "Command: Raid Missile",
    "35111": "[드론] 레이드 미사일",
    "35120": "Fiery Escape",
    "35130": "Annihilation Mode",
    "35140": "Command: M143 Machine Gun",
    "35141": "[드론] M143 기관총",
    "35150": "Backflip Strike",
    "35160": "High Voltage Bullet",
    "35170": "Strategic Fire",
    "35180": "Mobile Shot",
    "35181": "Mobile Shot",
    "35182": "Mobile Shot",
    "35190": "Avalanche",
    "35200": "Pulse Fire",
    "35210": "Energy Buster",
    "35700": "Hypersync",
    "35701": "Disable Hypersync",
    "35702": "[아이덴티티] 하이퍼 싱크 강제 해제",
    "35703": "하이퍼 싱크 체크용 더미 드론스킬",
    "35711": "Command: Call Back",
    "35720": "Basic Attack",
    "35730": "Thruster Move",
    "35740": "Stand Up",
    "35750": "Comet Strike",
    "35760": "Slugshot",
    "35761": "[싱크] 슬러그 샷 (연결)",
    "35770": "Laser Blade",
    "35771": "[싱크] 레이저 블레이드 (연결)",
    "35780": "Echelon Beam",
    "35781": "[싱크] 엑셀리온 빔 (연결)",
    "35790": "Surge Blow",
    "35800": "Crimson Breaker",
    "35930": "Air Strike",
    "35940": "Command: Final Explosion",
    "35941": "[각성기] [드론] 파이널 익스플로전",
    "35950": "드론 소환 (노모션)",
    "35951": "드론 소환",
    "35960": "드론 명령 리액션",
    "35970": "드론 명령 A (노모션)",
    "35980": "드론 명령 B (짧은 명령)",
    "35990": "드론 명령 C (긴 명령)",
  },
  "512": {
    "38020": "Quick Step",
    "38040": "Dual Buckshot",
    "38050": "Hour of Judgment",
    "38060": "Spiral Flame",
    "38070": "Target Down",
    "38080": "Catastrophe",
    "38090": "Death Fire",
    "38100": "Meteor Stream",
    "38110": "Sharpshooter",
    "38120": "AT02 Grenade",
    "38140": "Plasma Bullet",
    "38150": "Stampede",
    "38155": "Stand Up",
    "38156": "PVP 강제 기상",
    "38160": "Change Stance",
    "38161": "Reverse Stance Switch",
    "38162": "Change Stance",
    "38163": "Change Stance",
    "38164": "Change Stance",
    "38170": "Shotgun Rapid Fire",
    "38180": "Spiral Tracker",
    "38190": "Bullet Rain",
    "38200": "Dexterous Shot",
    "38210": "Somersault Shot",
    "38220": "Equilibrium",
    "38230": "Last Request",
    "38240": "Focused Shot",
    "38250": "Eye of Twilight",
    "38260": "Peacekeeper",
    "38270": "Perfect Shot",
    "38280": "High-Caliber HE Bullet",
  },
};

export const projectileItems = [
  33200, 32000, 32004, 32010, 32016, 32020, 23025, 32030, 32035, 32240, 32244,
  32260, 32262, 32310, 32311, 32312, 32313, 32320, 32325, 32350, 32352, 32360,
  32363, 32140, 32141, 32142,
];

export const battleItems = [
  32380, 32100, 32102, 32270, 32271, 32300, 32301, 33500, 32402, 32403,
];
