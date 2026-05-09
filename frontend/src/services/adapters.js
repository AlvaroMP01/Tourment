/**
 * Adapters para normalizar los datos que vienen del backend.
 * Esto protege al frontend de cambios en la estructura de la API.
 */

const PRIZE_NUMBER_FORMAT = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const CURRENCY_SYMBOL = { EUR: '€' };

export const formatPrize = (amount, currency) => {
  // null/undefined/0 → torneo sin premio
  if (amount == null || amount === '' || Number(amount) === 0) return 'Por determinar';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return 'Por determinar';
  const symbol = CURRENCY_SYMBOL[currency] || currency || '';
  return `${symbol}${PRIZE_NUMBER_FORMAT.format(num)}`;
};

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
    image: apiTournament.image || null,
    prizeAmount: apiTournament.prize_amount ?? null,
    prizeCurrency: apiTournament.prize_currency || null,
    prize: formatPrize(apiTournament.prize_amount, apiTournament.prize_currency),
    description: apiTournament.description || null,
    acceptedTeamsCount: apiTournament.accepted_teams_count ?? null,
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
