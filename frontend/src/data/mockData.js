// Mock data for demonstration purposes

export const mockTournaments = [
  {
    id: 1,
    name: "VALORANT Champions Tour 2024",
    status: "live",
    startDate: "2024-02-15",
    endDate: "2024-03-20",
    prize: "€50,000",
    teams: 16,
    region: "EMEA",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop",
    description: "El torneo más prestigioso de la región EMEA"
  },
  {
    id: 2,
    name: "Spanish Masters",
    status: "upcoming",
    startDate: "2024-03-25",
    endDate: "2024-04-10",
    prize: "€25,000",
    teams: 12,
    region: "España",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop",
    description: "Campeonato nacional español de VALORANT"
  },
  {
    id: 3,
    name: "Amateur League Season 1",
    status: "completed",
    startDate: "2024-01-10",
    endDate: "2024-02-05",
    prize: "€10,000",
    teams: 8,
    region: "España",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=400&fit=crop",
    description: "Liga amateur para equipos emergentes"
  },
  {
    id: 4,
    name: "University Championship",
    status: "upcoming",
    startDate: "2024-04-15",
    endDate: "2024-05-20",
    prize: "€15,000",
    teams: 10,
    region: "España",
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&h=400&fit=crop",
    description: "Torneo universitario de VALORANT"
  }
];

export const mockTeams = [
  {
    id: 1,
    name: "Phantom Strikers",
    tag: "PHS",
    logo: "🔥",
    region: "España",
    wins: 24,
    losses: 8,
    rank: 1,
    leader: 'testuser',
    players: [
      { id: 1, name: "ShadowKing", role: "Duelist", agent: "Jett" },
      { id: 2, name: "IronWall", role: "Sentinel", agent: "Killjoy" },
      { id: 3, name: "FlashMaster", role: "Initiator", agent: "Breach" },
      { id: 4, name: "SmokeShow", role: "Controller", agent: "Omen" },
      { id: 5, name: "ClutchGod", role: "Duelist", agent: "Reyna" }
    ]
  },
  {
    id: 2,
    name: "Viper Squad",
    tag: "VPS",
    logo: "🐍",
    region: "España",
    wins: 22,
    losses: 10,
    rank: 2,
    players: [
      { id: 6, name: "ToxicAce", role: "Controller", agent: "Viper" },
      { id: 7, name: "HeadHunter", role: "Duelist", agent: "Phoenix" },
      { id: 8, name: "WallBang", role: "Sentinel", agent: "Sage" },
      { id: 9, name: "BlindSpot", role: "Initiator", agent: "Skye" },
      { id: 10, name: "EntryFrag", role: "Duelist", agent: "Raze" }
    ]
  },
  {
    id: 3,
    name: "Radiant Legends",
    tag: "RDL",
    logo: "⚡",
    region: "España",
    wins: 20,
    losses: 12,
    rank: 3,
    players: [
      { id: 11, name: "SparkPlug", role: "Initiator", agent: "KAY/O" },
      { id: 12, name: "SilentKill", role: "Sentinel", agent: "Cypher" },
      { id: 13, name: "DashMaster", role: "Duelist", agent: "Neon" },
      { id: 14, name: "MistWalker", role: "Controller", agent: "Brimstone" },
      { id: 15, name: "Recon", role: "Initiator", agent: "Sova" }
    ]
  },
  {
    id: 4,
    name: "Cyber Wolves",
    tag: "CWF",
    logo: "🐺",
    region: "España",
    wins: 18,
    losses: 14,
    rank: 4,
    players: [
      { id: 16, name: "AlphaWolf", role: "Duelist", agent: "Jett" },
      { id: 17, name: "PackLeader", role: "Controller", agent: "Astra" },
      { id: 18, name: "LoneHowl", role: "Sentinel", agent: "Chamber" },
      { id: 19, name: "HuntMaster", role: "Initiator", agent: "Fade" },
      { id: 20, name: "NightStalker", role: "Duelist", agent: "Yoru" }
    ]
  },
  {
    id: 5,
    name: "Phoenix Rising",
    tag: "PHX",
    logo: "🔆",
    region: "España",
    wins: 16,
    losses: 16,
    rank: 5,
    players: [
      { id: 21, name: "BlazeRunner", role: "Duelist", agent: "Phoenix" },
      { id: 22, name: "AshGuard", role: "Sentinel", agent: "Sage" },
      { id: 23, name: "EmberStrike", role: "Initiator", agent: "Breach" },
      { id: 24, name: "InfernoKing", role: "Controller", agent: "Viper" }
    ]
  }
];

export const mockMatches = [
  {
    id: 1,
    tournamentId: 1,
    team1: mockTeams[0],
    team2: mockTeams[1],
    score1: 13,
    score2: 11,
    status: "completed",
    date: "2024-02-16T18:00:00",
    map: "Ascent",
    round: "Semifinals"
  },
  {
    id: 2,
    tournamentId: 1,
    team1: mockTeams[2],
    team2: mockTeams[3],
    score1: 10,
    score2: 13,
    status: "completed",
    date: "2024-02-16T20:00:00",
    map: "Bind",
    round: "Semifinals"
  },
  {
    id: 3,
    tournamentId: 1,
    team1: mockTeams[0],
    team2: mockTeams[3],
    score1: 0,
    score2: 0,
    status: "live",
    date: "2024-02-17T19:00:00",
    map: "Haven",
    round: "Grand Final"
  },
  {
    id: 4,
    tournamentId: 2,
    team1: mockTeams[1],
    team2: mockTeams[4],
    score1: 0,
    score2: 0,
    status: "upcoming",
    date: "2024-03-25T17:00:00",
    map: "Icebox",
    round: "Quarterfinals"
  }
];

export const mockPlayers = [
  {
    id: 1,
    name: "ShadowKing",
    team: "Phantom Strikers",
    role: "Duelist",
    mainAgent: "Jett",
    stats: {
      kills: 1247,
      deaths: 892,
      assists: 456,
      kd: 1.40,
      adr: 185,
      hs: "28%",
      clutches: 47
    },
    rank: 1
  },
  {
    id: 2,
    name: "ToxicAce",
    team: "Viper Squad",
    role: "Controller",
    mainAgent: "Viper",
    stats: {
      kills: 1089,
      deaths: 823,
      assists: 612,
      kd: 1.32,
      adr: 168,
      hs: "24%",
      clutches: 38
    },
    rank: 2
  },
  {
    id: 3,
    name: "SparkPlug",
    team: "Radiant Legends",
    role: "Initiator",
    mainAgent: "KAY/O",
    stats: {
      kills: 1156,
      deaths: 901,
      assists: 723,
      kd: 1.28,
      adr: 172,
      hs: "26%",
      clutches: 42
    },
    rank: 3
  },
  {
    id: 4,
    name: "AlphaWolf",
    team: "Cyber Wolves",
    role: "Duelist",
    mainAgent: "Jett",
    stats: {
      kills: 1198,
      deaths: 967,
      assists: 389,
      kd: 1.24,
      adr: 179,
      hs: "31%",
      clutches: 35
    },
    rank: 4
  },
  {
    id: 5,
    name: "IronWall",
    team: "Phantom Strikers",
    role: "Sentinel",
    mainAgent: "Killjoy",
    stats: {
      kills: 967,
      deaths: 789,
      assists: 534,
      kd: 1.23,
      adr: 156,
      hs: "22%",
      clutches: 51
    },
    rank: 5
  }
];

export const mockNews = [
  {
    id: 1,
    title: "Phantom Strikers domina el VCT EMEA",
    description: "El equipo español consigue una victoria aplastante en las semifinales",
    date: "2024-02-16",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=300&fit=crop",
    category: "Resultados"
  },
  {
    id: 2,
    title: "Nuevo agente revelado para el próximo episodio",
    description: "Riot Games anuncia un nuevo controlador con habilidades únicas",
    date: "2024-02-15",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=300&fit=crop",
    category: "Noticias"
  },
  {
    id: 3,
    title: "Cambios en el meta: Jett y Chamber nerfados",
    description: "El último parche trae importantes cambios de balance",
    date: "2024-02-14",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=300&fit=crop",
    category: "Actualizaciones"
  }
];

export const mockBracket = {
  tournamentId: 1,
  rounds: [
    {
      name: "Quarterfinals",
      matches: [
        { team1: "Phantom Strikers", team2: "Team Alpha", score1: 13, score2: 7 },
        { team1: "Viper Squad", team2: "Team Beta", score1: 13, score2: 9 },
        { team1: "Radiant Legends", team2: "Team Gamma", score1: 13, score2: 11 },
        { team1: "Cyber Wolves", team2: "Team Delta", score1: 13, score2: 8 }
      ]
    },
    {
      name: "Semifinals",
      matches: [
        { team1: "Phantom Strikers", team2: "Viper Squad", score1: 13, score2: 11 },
        { team1: "Radiant Legends", team2: "Cyber Wolves", score1: 10, score2: 13 }
      ]
    },
    {
      name: "Grand Final",
      matches: [
        { team1: "Phantom Strikers", team2: "Cyber Wolves", score1: null, score2: null }
      ]
    }
  ]
};

export const mockRequests = [];
