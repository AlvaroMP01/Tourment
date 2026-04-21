  import axios from 'axios';

const VLR_API_BASE = 'https://vlrggapi.vercel.app';

// VLR.gg API Service
export const vlrApi = {
  // Get latest news
  async getNews() {
    try {
      const response = await axios.get(`${VLR_API_BASE}/v2/news`);
      return response.data.data.segments || [];
    } catch (error) {
      console.error('Error fetching VLR news:', error);
      return [];
    }
  },

  // Get match results
  async getMatches() {
    try {
      const response = await axios.get(`${VLR_API_BASE}/match/results`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching VLR matches:', error);
      return [];
    }
  },

  // Get upcoming matches
  async getUpcomingMatches() {
    try {
      const response = await axios.get(`${VLR_API_BASE}/match/upcoming`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      return [];
    }
  },

  // Get rankings
  async getRankings(region = 'emea') {
    try {
      const response = await axios.get(`${VLR_API_BASE}/rankings/${region}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return [];
    }
  },

  // Get match details
  async getMatchDetails(matchId) {
    try {
      const response = await axios.get(`${VLR_API_BASE}/match/${matchId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching match details:', error);
      return null;
    }
  },

  // Get team details
  async getTeamDetails(teamId) {
    try {
      const response = await axios.get(`${VLR_API_BASE}/team/${teamId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching team details:', error);
      return null;
    }
  }
};

export default vlrApi;
