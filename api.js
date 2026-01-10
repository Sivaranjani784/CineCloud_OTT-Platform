const API_KEY = '87942d1df39530e2e9566776faa9b6fa';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

const requests = {
    fetchTrending: `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`,
    fetchTopRated: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US`,
    fetchTelugu: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=te&sort_by=popularity.desc`,
    fetchTamil: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ta&sort_by=popularity.desc`,
    fetchKannada: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=kn&sort_by=popularity.desc`,
    fetchMalayalam: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ml&sort_by=popularity.desc`,
    fetchHindi: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=hi&sort_by=popularity.desc`,
    fetchAnime: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`,
    search: `${BASE_URL}/search/movie?api_key=${API_KEY}&query=`,
};

// Generic fetch function
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}

// Fetch video (trailer)
async function fetchMovieVideos(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Error fetching videos:", error);
        return [];
    }
}
