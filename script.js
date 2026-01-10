// --- UI State & Helper Variables ---
let currentHeroMovie = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    initNavbar();
    setupEventListeners();

    if (document.getElementById('hero')) {
        loadHomeContent();
    }

    if (document.getElementById('wishlist-grid')) {
        loadWishlistContent();
    }

    if (document.getElementById('profile-name')) {
        loadProfileContent();
    }
});

// --- Auth UI Handling ---
function updateAuthUI() {
    const user = Auth.getCurrentUser();
    const authButtons = document.getElementById('auth-buttons');
    const myListLink = document.getElementById('my-list-link');

    if (user) {
        authButtons.innerHTML = `
            <a href="profile.html" class="btn btn-outline btn-sm" style="margin-right: 10px;">
                <i class="fas fa-user"></i> ${user.name}
            </a>
            <button class="btn btn-primary btn-sm" onclick="confirmLogout()">Logout</button>
        `;
        if (myListLink) myListLink.classList.remove('hidden');
    } else {
        authButtons.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="openModal('login-modal')">Login</button>
            <button class="btn btn-secondary btn-sm" onclick="openModal('register-modal')">Register</button>
        `;
    }
}

// --- Home Content Loading ---
async function loadHomeContent() {
    // 1. Hero Section (Trending)
    const trending = await fetchData(requests.fetchTrending);
    if (trending && trending.length > 0) {
        const randomMovie = trending[Math.floor(Math.random() * trending.length)];
        currentHeroMovie = randomMovie;
        setHero(randomMovie);
    }

    // 2. Categories
    const categories = [
        { title: "Trending Now", url: requests.fetchTrending },
        { title: "Anime", url: requests.fetchAnime },
        { title: "Telugu Movies", url: requests.fetchTelugu },
        { title: "Tamil Movies", url: requests.fetchTamil },
        { title: "Kannada Movies", url: requests.fetchKannada },
        { title: "Malayalam Movies", url: requests.fetchMalayalam },
        { title: "Hindi Movies", url: requests.fetchHindi },
        { title: "Top Rated", url: requests.fetchTopRated },
    ];

    const categoryContainer = document.getElementById('category-container');

    for (const cat of categories) {
        const movies = await fetchData(cat.url);
        if (movies && movies.length > 0) {
            const row = createRow(cat.title, movies);
            categoryContainer.appendChild(row);
        }
    }
    setupCategoryFilters();
}

function setHero(movie) {
    const hero = document.getElementById('hero');
    const title = document.getElementById('hero-title');
    const desc = document.getElementById('hero-desc');

    if (movie.backdrop_path) {
        hero.style.backgroundImage = `url('${IMG_URL_ORIGINAL}${movie.backdrop_path}')`;
    }
    title.innerText = movie.title || movie.name;
    desc.innerText = movie.overview;
}

function createRow(title, movies, categoryRaw = "") {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';

    // Determine category key for filtering
    let catKey = "other";
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('telugu')) catKey = "te";
    else if (lowerTitle.includes('hindi')) catKey = "hi";
    else if (lowerTitle.includes('tamil')) catKey = "ta";
    else if (lowerTitle.includes('kannada')) catKey = "kn";
    else if (lowerTitle.includes('malayalam')) catKey = "ml";
    else if (lowerTitle.includes('trending') || lowerTitle.includes('top rated')) catKey = "en"; // Grouping English/International here
    else if (lowerTitle.includes('anime')) catKey = "anime";

    rowDiv.setAttribute('data-category', catKey);

    const titleEl = document.createElement('h2');
    titleEl.className = 'row-title';
    titleEl.innerText = title;

    const postersDiv = document.createElement('div');
    postersDiv.className = 'row-posters';

    movies.forEach(movie => {
        if (!movie.poster_path) return;

        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <div class="rating-badge"><i class="fas fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</div>
            <img class="movie-poster" src="${IMG_URL_BASE}${movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <div class="movie-title">${movie.title || movie.name}</div>
                <div class="movie-actions">
                    <button class="action-btn" onclick="openTrailer('${movie.id}')" title="Watch Trailer"><i class="fas fa-play"></i></button>
                    <button class="action-btn" onclick="handleAddToWishlist(${JSON.stringify(movie).replace(/"/g, '&quot;')})" title="Add to List"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        `;
        postersDiv.appendChild(card);
    });

    rowDiv.appendChild(titleEl);
    rowDiv.appendChild(postersDiv);

    return rowDiv;
}

// --- Category Filtering ---
function setupCategoryFilters() {
    const filters = document.querySelectorAll('.filter-btn');
    const rows = document.querySelectorAll('#category-container .row');

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            filters.forEach(f => f.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            rows.forEach(row => {
                const rowCat = row.getAttribute('data-category');

                if (filterValue === 'all') {
                    row.classList.remove('hidden');
                } else {
                    // Simple logic: "en" matches Top Rated/Trending which are mostly English/International
                    if (rowCat === filterValue) {
                        row.classList.remove('hidden');
                    } else {
                        row.classList.add('hidden');
                    }
                }
            });
        });
    });
}

// --- Wishlist Content Loading ---
function loadWishlistContent() {
    const user = Auth.getCurrentUser();
    const grid = document.getElementById('wishlist-grid');

    if (!user) {
        grid.innerHTML = '<p>Please <a href="#" onclick="openModal(\'login-modal\')">login</a> to view your list.</p>';
        return;
    }

    const wishlist = Auth.getWishlist();
    if (wishlist.length === 0) {
        document.getElementById('empty-msg').style.display = 'block';
    } else {
        document.getElementById('empty-msg').style.display = 'none';

        wishlist.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.style.width = '100%';

            card.innerHTML = `
                <div class="rating-badge"><i class="fas fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</div>
                <img class="movie-poster" src="${IMG_URL_BASE}${movie.poster_path}" alt="${movie.title}">
                <div class="movie-info">
                    <div class="movie-title">${movie.title || movie.name}</div>
                    <div class="movie-actions">
                         <button class="action-btn" onclick="openTrailer('${movie.id}')" title="Watch Trailer"><i class="fas fa-play"></i></button>
                        <button class="action-btn" style="color: red;" onclick="handleRemoveFromWishlist('${movie.id}')" title="Remove"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
           `;
            grid.appendChild(card);
        });
    }
}

// --- Profile Content Loading ---
function loadProfileContent() {
    const user = Auth.getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('profile-name').innerText = user.name;
    document.getElementById('profile-email').innerText = user.email;
    document.getElementById('wishlist-count').innerText = user.wishlist ? user.wishlist.length : 0;
}

// --- Interaction Logic ---
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    const searchIcon = document.getElementById('search-icon');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');



    if (searchInput) {
        // Removed click toggle logic as search is now always visible
        searchInput.addEventListener('focus', () => {
            const user = Auth.getCurrentUser();
            if (!user) {
                searchInput.blur();
                openModal('login-modal');
                return;
            }
        });

        let debounce;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounce);
            debounce = setTimeout(async () => {
                const query = e.target.value;
                const resultsWrapper = document.getElementById('search-results');
                const categoryWrapper = document.getElementById('category-container');
                const resultsContainer = document.getElementById('search-results-container');

                if (!resultsWrapper) return;

                if (query.trim().length > 0) {
                    const results = await fetchData(requests.search + query);
                    categoryWrapper.classList.add('hidden');
                    if (document.getElementById('hero')) document.getElementById('hero').classList.add('hidden'); // Hide Hero
                    resultsWrapper.classList.remove('hidden');

                    resultsContainer.innerHTML = '';
                    results.forEach(movie => {
                        if (!movie.poster_path) return;
                        const card = document.createElement('div');
                        card.className = 'movie-card';
                        card.innerHTML = `
                            <div class="rating-badge"><i class="fas fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</div>
                            <img class="movie-poster" src="${IMG_URL_BASE}${movie.poster_path}" alt="${movie.title}">
                            <div class="movie-info">
                                <div class="movie-title">${movie.title || movie.name}</div>
                                <div class="movie-actions">
                                    <button class="action-btn" onclick="openTrailer('${movie.id}')"><i class="fas fa-play"></i></button>
                                    <button class="action-btn" onclick="handleAddToWishlist(${JSON.stringify(movie).replace(/"/g, '&quot;')})"><i class="fas fa-plus"></i></button>
                                </div>
                            </div>
                        `;
                        resultsContainer.appendChild(card);
                    });
                } else {
                    resultsWrapper.classList.add('hidden');
                    categoryWrapper.classList.remove('hidden');
                    if (document.getElementById('hero')) document.getElementById('hero').classList.remove('hidden'); // Show Hero
                }
            }, 500);
        });
    }

    const hamburger = document.getElementById('hamburger-menu');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        window.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });

        // Close menu when clicking a link
        const links = mobileMenu.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
}

// --- Actions ---
function handleAddToWishlist(movie) {
    const user = Auth.getCurrentUser();
    if (!user) {
        openModal('login-modal');
        return;
    }

    showConfirm("Are you sure you want to add this movie to your list?", () => {
        const result = Auth.addToWishlist(movie);
        alert(result.message);
    });
}

function handleRemoveFromWishlist(movieId) {
    showConfirm("Are you sure you want to delete this movie from your list?", () => {
        Auth.removeFromWishlist(parseInt(movieId));
        window.location.reload();
    });
}

function addToMyListHero() {
    if (currentHeroMovie) {
        handleAddToWishlist(currentHeroMovie);
    }
}

function playHeroTrailer() {
    if (currentHeroMovie) {
        openTrailer(currentHeroMovie.id);
    }
}

async function openTrailer(movieId) {
    const videos = await fetchMovieVideos(movieId);
    const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') || videos.find(v => v.site === 'YouTube');

    if (trailer) {
        const playerDiv = document.getElementById('trailer-player');
        playerDiv.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top:0; left: 0;"></iframe>`;
        openModal('trailer-modal');
    } else {
        alert("Sorry, no trailer available for this movie.");
    }
}

function closeTrailerModal() {
    const playerDiv = document.getElementById('trailer-player');
    playerDiv.innerHTML = ''; // Stop video
    closeModal('trailer-modal');
}

function confirmLogout() {
    showConfirm("Are you sure you want to logout from this application?", () => {
        Auth.logout();
    });
}

// --- Modal System ---
function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('show');
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('show');
}

function switchModal(closeId, openId) {
    closeModal(closeId);
    openModal(openId);
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        // If it's trainler modal, stop video
        if (event.target.id === 'trailer-modal') {
            closeTrailerModal();
        } else {
            event.target.classList.remove('show');
        }
    }
}

function showConfirm(message, onYes) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;

    document.getElementById('confirm-message').innerText = message;

    const yesBtn = document.getElementById('confirm-yes');
    const newYesBtn = yesBtn.cloneNode(true); // Clear old listeners
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

    newYesBtn.addEventListener('click', () => {
        onYes();
        closeModal('confirm-modal');
    });

    openModal('confirm-modal');
}

// --- Auth Forms ---
function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            const res = Auth.login(email, pass);

            if (res.success) {
                closeModal('login-modal');
                updateAuthUI();
                if (document.getElementById('wishlist-grid') || document.getElementById('profile-name')) {
                    window.location.reload();
                }
                alert(`Welcome back, ${res.user.name}!`);
            } else {
                alert(res.message);
            }
        });
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-password').value;

            const res = Auth.register(name, email, pass);
            if (res.success) {
                closeModal('register-modal');
                alert(res.message);
                openModal('login-modal');
            } else {
                alert(res.message);
            }
        });
    }
}
