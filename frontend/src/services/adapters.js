/**
 * Adapters para normalizar los datos que vienen del backend.
 * Esto protege al frontend de cambios en la estructura de la API.
 */

export const userAdapter = (apiUser) => {
  if (!apiUser) return null;
  return {
    id: apiUser.id,
    nickname: apiUser.nickname,
    customName: apiUser.custom_name || '',
    bio: apiUser.bio || '',
    avatar: apiUser.avatar || '',
    role: apiUser.role ?? apiUser.role,
    stats: {
      kills: apiUser.stats?.kills || 0,
      deaths: apiUser.stats?.deaths || 0,
      assists: apiUser.stats?.assists || 0,
      adr: parseFloat(apiUser.stats?.adr || 0),
      hsPercentage: parseFloat(apiUser.stats?.hs_percentage || 0),
      clutches: apiUser.stats?.clutches || 0
    }
  };
};

export const tournamentAdapter = (apiTournament) => {
  return {
    id: apiTournament.id,
    name: apiTournament.name,
    startDate: apiTournament.start_date,
    endDate: apiTournament.end_date,
    status: apiTournament.status,
    prize: apiTournament.prize || 'Por determinar'
  };
};

export const teamAdapter = (apiTeam) => {
  return {
    id: apiTeam.id,
    name: apiTeam.name,
    tag: apiTeam.tag,
    logo: apiTeam.logo,
    region: apiTeam.region,
    memberCount: apiTeam.member_count || 0,
    members: apiTeam.members?.map(m => ({
      userId: m.user_id,
      nickname: m.nickname,
      role: m.role,
      ingameRole: m.ingame_role,
      favoriteAgent: m.favorite_agent
    })) || []
  };
};

export const newsAdapter = (apiNews) => {
  return {
    id: apiNews.id,
    title: apiNews.title,
    description: apiNews.description,
    link: apiNews.link,
    date: apiNews.date,
    image: apiNews.image
  };
};
