import { requestAPI } from "./requestAPI";

// Backend API Service
export const routesAPI = {
  // Test
  testConnection() { return requestAPI.get("/"); },
  testDatabase() { return requestAPI.get("/test-db"); },

  // --- AUTH ---
  register(userData) { return requestAPI.post("/auth/register", userData); },
  login(credentials) { return requestAPI.post("/auth/login", credentials); },

  // --- USER PROFILE ---
  getMe(token) {
    return requestAPI.get("/users/me", undefined, token ? { token } : undefined);
  },
  updateMe(userData) { return requestAPI.put("/users/me", userData); },

  // --- PLAYERS (público — ranking de jugadores) ---
  getPlayers() { return requestAPI.get("/users/players"); },

  // --- NEWS ---
  getNews() { return requestAPI.get("/news"); },

  // --- TOURNAMENTS ---
  getTournaments() { return requestAPI.get("/tournaments"); },
  getTournamentDetail(id) { return requestAPI.get(`/tournaments/${id}`); },
  createTournament(data) { return requestAPI.post("/tournaments", data); },
  updateTournament(id, data) { return requestAPI.put(`/tournaments/${id}`, data); },
  deleteTournament(id) { return requestAPI.del(`/tournaments/${id}`); },

  // --- MATCHES (anidados bajo tournament) ---
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

  // --- TEAMS ---
  getTeams() { return requestAPI.get("/teams"); },
  getTeamDetail(id) { return requestAPI.get(`/teams/${id}`); },
  getMyTeams() { return requestAPI.get("/teams/my"); },
  createTeam(data) { return requestAPI.post("/teams", data); },
  updateTeam(id, data) { return requestAPI.put(`/teams/${id}`, data); },
  deleteTeam(id) { return requestAPI.del(`/teams/${id}`); },
  requestToJoin(teamId, joinData) { return requestAPI.post(`/teams/${teamId}/join`, joinData); },

  // Join requests (gestión por founder/admin)
  listJoinRequests(teamId, status = 'pending') {
    return requestAPI.get(`/teams/${teamId}/join-requests`, { status });
  },
  acceptJoinRequest(teamId, requestId) {
    return requestAPI.post(`/teams/${teamId}/join-requests/${requestId}/accept`);
  },
  rejectJoinRequest(teamId, requestId) {
    return requestAPI.post(`/teams/${teamId}/join-requests/${requestId}/reject`);
  },

  // Roster
  removeTeamMember(teamId, userId) {
    return requestAPI.del(`/teams/${teamId}/members/${userId}`);
  },

  // --- ADMIN (panel global, admin only) ---
  adminGetUsers() { return requestAPI.get("/admin/users"); },
  adminUpdateUserRole(userId, role) {
    return requestAPI.put(`/admin/users/${userId}/role`, { role });
  },
  adminDeleteUser(userId) { return requestAPI.del(`/admin/users/${userId}`); },
};

export default routesAPI;
