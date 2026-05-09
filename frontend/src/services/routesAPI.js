import { requestAPI } from "./requestAPI";

export const routesAPI = {
  testConnection() { return requestAPI.get("/"); },
  testDatabase() { return requestAPI.get("/test-db"); },

  register(userData) { return requestAPI.post("/auth/register", userData); },
  login(credentials) { return requestAPI.post("/auth/login", credentials); },

  getMe(token) {
    return requestAPI.get("/users/me", undefined, token ? { token } : undefined);
  },
  updateMe(userData) { return requestAPI.put("/users/me", userData); },

  uploadAvatar(file) { return requestAPI.upload("/users/me/avatar", file); },
  deleteAvatar() { return requestAPI.del("/users/me/avatar"); },

  // params opcional: { sort_by: 'kd'|'adr'|'hs'|'clutches'|'kills'|'assists'|'matches', min_matches: int }
  getPlayers(params) { return requestAPI.get("/users/players", params); },

  // params opcional: { limit: int } — backend default 20, max 50
  getNews(params) { return requestAPI.get("/news", params); },

  getStatsOverview() { return requestAPI.get("/stats/overview"); },

  getTournaments() { return requestAPI.get("/tournaments"); },
  getTournamentDetail(id) { return requestAPI.get(`/tournaments/${id}`); },
  createTournament(data) { return requestAPI.post("/tournaments", data); },
  updateTournament(id, data) { return requestAPI.put(`/tournaments/${id}`, data); },
  deleteTournament(id) { return requestAPI.del(`/tournaments/${id}`); },
  uploadTournamentImage(id, file) { return requestAPI.upload(`/tournaments/${id}/image`, file); },
  deleteTournamentImage(id) { return requestAPI.del(`/tournaments/${id}/image`); },

  generateBracket(tournamentId) {
    return requestAPI.post(`/tournaments/${tournamentId}/bracket`);
  },
  deleteBracket(tournamentId) {
    return requestAPI.del(`/tournaments/${tournamentId}/bracket`);
  },

  getTournamentMatches(tournamentId) {
    return requestAPI.get(`/tournaments/${tournamentId}/matches`);
  },
  createMatch(tournamentId, data) {
    return requestAPI.post(`/tournaments/${tournamentId}/matches`, data);
  },
  updateMatch(tournamentId, matchId, data) {
    return requestAPI.put(`/tournaments/${tournamentId}/matches/${matchId}`, data);
  },
  deleteMatch(tournamentId, matchId) {
    return requestAPI.del(`/tournaments/${tournamentId}/matches/${matchId}`);
  },
  reportMatchResults(tournamentId, matchId, payload) {
    return requestAPI.post(`/tournaments/${tournamentId}/matches/${matchId}/results`, payload);
  },
  getMatchStats(tournamentId, matchId) {
    return requestAPI.get(`/tournaments/${tournamentId}/matches/${matchId}/stats`);
  },

  // params opcional: { sort_by: 'wins'|'name'|'members' }. Default backend = 'wins'.
  getTeams(params) { return requestAPI.get("/teams", params); },
  getTeamDetail(id) { return requestAPI.get(`/teams/${id}`); },
  getMyTeams() { return requestAPI.get("/teams/my"); },
  createTeam(data) { return requestAPI.post("/teams", data); },
  updateTeam(id, data) { return requestAPI.put(`/teams/${id}`, data); },
  deleteTeam(id) { return requestAPI.del(`/teams/${id}`); },
  uploadTeamLogo(id, file) { return requestAPI.upload(`/teams/${id}/logo`, file); },
  deleteTeamLogo(id) { return requestAPI.del(`/teams/${id}/logo`); },
  requestToJoin(teamId, joinData) { return requestAPI.post(`/teams/${teamId}/join`, joinData); },

  listJoinRequests(teamId, status = 'pending') {
    return requestAPI.get(`/teams/${teamId}/join-requests`, { status });
  },
  acceptJoinRequest(teamId, requestId) {
    return requestAPI.post(`/teams/${teamId}/join-requests/${requestId}/accept`);
  },
  rejectJoinRequest(teamId, requestId) {
    return requestAPI.post(`/teams/${teamId}/join-requests/${requestId}/reject`);
  },

  removeTeamMember(teamId, userId) {
    return requestAPI.del(`/teams/${teamId}/members/${userId}`);
  },

  // status opcional para managers: 'pending'|'accepted'|'rejected'|'all'.
  // Sin token o sin manager, el backend devuelve solo accepted.
  listTournamentRegistrations(tournamentId, status) {
    return requestAPI.get(
      `/tournaments/${tournamentId}/registrations`,
      status ? { status } : undefined
    );
  },
  registerTeamToTournament(tournamentId, teamId) {
    return requestAPI.post(`/tournaments/${tournamentId}/register`, { team_id: teamId });
  },
  acceptTournamentRegistration(tournamentId, regId) {
    return requestAPI.post(`/tournaments/${tournamentId}/registrations/${regId}/accept`);
  },
  rejectTournamentRegistration(tournamentId, regId) {
    return requestAPI.post(`/tournaments/${tournamentId}/registrations/${regId}/reject`);
  },
  deleteTournamentRegistration(tournamentId, regId) {
    return requestAPI.del(`/tournaments/${tournamentId}/registrations/${regId}`);
  },

  adminGetUsers() { return requestAPI.get("/admin/users"); },
  adminUpdateUserRole(userId, role) {
    return requestAPI.put(`/admin/users/${userId}/role`, { role });
  },
  adminDeleteUser(userId) { return requestAPI.del(`/admin/users/${userId}`); },
};

export default routesAPI;
