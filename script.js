/* Developed by: Kranshy 
   Project: Film Show AI - 2026
   V.Final PRO: Multi-Page, Favorites & Random Refresh
*/

const API_KEY = 'f487ddad5bddeefbde5682e2828fcb97';
const API_URL = 'https://api.themoviedb.org/3';

const moviesGrid = document.getElementById('moviesGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const favListBtn = document.getElementById('favListBtn');
const catBtns = document.querySelectorAll('.cat-btn');
const heroSection = document.getElementById('heroSection');

let currentPage = 1;
let isFavoritesView = false;
let favorites = JSON.parse(localStorage.getItem('myFavs')) || [];
let currentType = 'movie';
let heroMovies = [];
let currentIndex = 0;

const genresMap = { 28: "أكشن", 12: "مغامرة", 16: "أنيميشن", 35: "كوميدي", 80: "جريمة", 18: "دراما", 10751: "عائلي", 27: "رعب", 878: "خيال علمي", 53: "إثارة" };

// إضافة المودالات برمجياً
if(!document.getElementById('customModals')) {
    const modals = `
    <div id="customModals">
        <div id="detailsModal" style="display:none; position:fixed; z-index:2000; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.9); backdrop-filter:blur(10px); overflow-y:auto; font-family:'Cairo', sans-serif;">
            <div style="background:#111; margin:5% auto; padding:25px; border:2px solid #ff4d2b; width:90%; max-width:550px; border-radius:20px; position:relative; color:white; direction:rtl; box-shadow: 0 0 20px rgba(255, 77, 43, 0.3);">
                <span id="closeDetails" style="position:absolute; left:20px; top:15px; font-size:35px; cursor:pointer; color:#ff4d2b;">&times;</span>
                <div id="modalBodyContent"></div>
                <div id="collectionContainer" style="margin-top:20px; border-top:1px solid #333; padding-top:20px; display:none;"></div>
                <div id="similarContainer" style="margin-top:20px; border-top:1px solid #333; padding-top:20px;"></div>
            </div>
        </div>
        <div id="moodModal" style="display:none; position:fixed; z-index:2001; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.85); align-items:center; justify-content:center; font-family:'Cairo', sans-serif;">
            <div style="background:#111; padding:30px; border-radius:20px; border:1px solid #ff4d2b; width:320px; text-align:center; color:white;">
                <h3 style="margin-bottom:20px; color:#ff4d2b;">🎭 اختر مودك اليوم</h3>
                <div id="moodList" style="display:flex; flex-direction:column; gap:12px;"></div>
                <button id="closeMood" style="margin-top:20px; background:transparent; border:none; color:#777; cursor:pointer;">إلغاء</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modals);
}

const detailsModal = document.getElementById('detailsModal');
const moodModal = document.getElementById('moodModal');
const modalBody = document.getElementById('modalBodyContent');
const similarContainer = document.getElementById('similarContainer');
const collectionContainer = document.getElementById('collectionContainer'); // عنصر السلسلة

document.getElementById('closeDetails').onclick = () => detailsModal.style.display = 'none';
document.getElementById('closeMood').onclick = () => moodModal.style.display = 'none';

initApp();

function initApp() {
    loadHero();
    loadMovies(); 
    setupEventListeners();
}

function setupEventListeners() {
    searchBtn.onclick = () => { isFavoritesView = false; searchMovies(searchInput.value.trim()); };
    searchInput.onkeypress = (e) => { if (e.key === 'Enter') { isFavoritesView = false; searchMovies(searchInput.value.trim()); } };
    
    catBtns.forEach(btn => {
        btn.onclick = () => {
            if(btn.id === 'randomBtn' || btn.id === 'moodBtn') return;
            isFavoritesView = false;
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.dataset.type === 'upcoming') {
                loadUpcoming();
            } else {
                currentType = btn.dataset.type;
                currentPage = 1;
                loadMovies();
            }
        };
    });

    favListBtn.onclick = showFavorites;
    document.getElementById('randomBtn').onclick = showRandomMovie;
    document.getElementById('moodBtn').onclick = openMoodPopup;
}

async function loadMovies(page = 1, append = false) {
    if(!append) {
        moviesGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center; color:#ff4b2b;">جاري التحميل...</p>';
        currentPage = 1;
    }
    const url = `${API_URL}/discover/${currentType}?api_key=${API_KEY}&language=ar&sort_by=popularity.desc&page=${page}${currentType==='movie'?'&without_genres=10749,18':''}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        let moviesToShow = data.results;

        if (!append) {
            moviesToShow = data.results.sort(() => Math.random() - 0.5);
        }

        displayMovies(moviesToShow, append);
        manageLoadMore(data.total_pages > page);
    } catch (e) { console.error(e); }
}

function displayMovies(movies, append = false) {
    if(!append) moviesGrid.innerHTML = '';
    
    if(movies.length === 0 && !append) {
        moviesGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">لا توجد نتائج حالياً</p>';
        return;
    }

    movies.forEach(movie => {
        if(!movie.poster_path) return;
        const isFav = favorites.some(f => f.id === movie.id);
        const genre = (movie.genres && movie.genres.length > 0) ? movie.genres[0].name : (genresMap[movie.genre_ids ? movie.genre_ids[0] : ''] || 'منوع');
        const year = (movie.release_date || movie.first_air_date || '2026').split('-')[0];
        const popularity = movie.popularity ? (movie.popularity/10).toFixed(0) + 'K' : '1.2K';
        
        const typeLabel = movie.title ? "فيلم" : "مسلسل";
        const mediaType = movie.title ? 'movie' : 'tv';

        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <div class="rating-tag ${movie.vote_average >= 7 ? 'good' : ''}">${movie.vote_average.toFixed(1)}</div>
            <div style="position:absolute; top:12px; left:50%; transform:translateX(-50%); background:#ff4d2b; color:white; padding:2px 12px; border-radius:20px; font-size:11px; z-index:100; font-weight:bold; box-shadow:0 2px 8px rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.2); white-space:nowrap;">${typeLabel}</div>

            <div class="extra-tags">
                <div class="data-tag"><i class="fas fa-calendar-alt"></i> ${year}</div>
                <div class="data-tag"><i class="fas fa-eye"></i> ${popularity}</div>
                <div class="data-tag" style="border-right-color:#2ecc71"><i class="fas fa-film"></i> ${genre}</div>
            </div>

            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" loading="lazy" onclick="showDetails(${movie.id}, '${mediaType}')">
            
            <div class="movie-info">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap:10px;">
                    <h3 style="margin:0; font-size:16px; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${movie.title || movie.name}</h3>
                    <i class="${isFav ? 'fas' : 'far'} fa-heart" style="color:#ff4d2b; font-size:18px; cursor:pointer;" onclick="toggleFav(event, this, ${movie.id}, '${mediaType}')"></i>
                </div>
                <div class="card-buttons">
                    <button class="btn-details" onclick="showDetails(${movie.id}, '${mediaType}')">التفاصيل</button>
                    <button class="btn-trailer" onclick="getTrailer(${movie.id}, '${mediaType}')"><i class="fab fa-youtube"></i> تريلر</button>
                </div>
            </div>`;
        moviesGrid.appendChild(card);
    });
}

async function showFavorites() {
    isFavoritesView = true;
    manageLoadMore(false);
    moviesGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center; color:#ff4b2b;">جاري عرض مفضلاتك...</p>';
    
    if(favorites.length === 0) {
        moviesGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center; color:#ccc;">قائمتك فاضية.. حب لك كام فيلم يا معلم! ❤️</p>';
        return;
    }

    const favData = [];
    for(const item of favorites) {
        try {
            const res = await fetch(`${API_URL}/${item.type}/${item.id}?api_key=${API_KEY}&language=ar`);
            const data = await res.json();
            favData.push(data);
        } catch(e) {}
    }
    displayMovies(favData);
}

function toggleFav(e, el, id, type) {
    e.stopPropagation();
    const index = favorites.findIndex(f => f.id === id);
    if(index > -1) {
        favorites.splice(index, 1);
        el.classList.replace('fas', 'far');
        if(isFavoritesView) el.closest('.movie-card').remove();
    } else {
        favorites.push({id, type});
        el.classList.replace('far', 'fas');
    }
    localStorage.setItem('myFavs', JSON.stringify(favorites));
}

function manageLoadMore(show) {
    let loadBtn = document.getElementById('loadMoreBtn');
    if(!loadBtn) {
        const container = document.createElement('div');
        container.style = "grid-column: 1/-1; text-align: center; margin: 40px 0;";
        container.innerHTML = `<button id="loadMoreBtn" class="btn-details" style="background:transparent; border:1px solid #ff4d2b; color:#ff4d2b; padding:10px 40px; cursor:pointer;">عرض المزيد</button>`;
        moviesGrid.after(container);
        loadBtn = document.getElementById('loadMoreBtn');
        loadBtn.onclick = () => {
            currentPage++;
            loadMovies(currentPage, true);
        };
    }
    loadBtn.parentElement.style.display = (show && !isFavoritesView) ? 'block' : 'none';
}

async function loadUpcoming() {
    manageLoadMore(false);
    moviesGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center; color:#ff4b2b;">جاري جلب أفلام لسه منزلتش...</p>';
    const today = new Date().toISOString().split('T')[0];
    const url = `${API_URL}/discover/movie?api_key=${API_KEY}&language=ar&region=EG&release_date.gte=${today}&sort_by=primary_release_date.asc`;
    const res = await fetch(url);
    const data = await res.json();
    displayMovies(data.results);
}

async function showDetails(id, type) {
    const res = await fetch(`${API_URL}/${type}/${id}?api_key=${API_KEY}&language=ar`);
    const movie = await res.json();
    const adultGenres = [27, 80, 53]; 
    const movieGenres = movie.genres ? movie.genres.map(g => g.id) : [];
    const hasAdultGenre = movieGenres.some(id => adultGenres.includes(id));
    const isFamilyGenre = movieGenres.includes(10751) || movieGenres.includes(16);

    let classification = "عائلي ✅";
    if (isFamilyGenre) classification = " عائلي 👪";
    if (hasAdultGenre || movie.adult) classification ="للكبار🔞";

    const views = movie.popularity ? Math.floor(movie.popularity * 100).toLocaleString() : "1,850";

    modalBody.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" style="width:100%; border-radius:15px; margin-bottom:15px;">
        <h2 style="color:#ff4d2b; margin-bottom:10px;">${movie.title || movie.name}</h2>
        <div style="display:flex; gap:15px; font-size:14px; color:#aaa; margin-bottom:15px;">
            <span>⭐ ${movie.vote_average.toFixed(1)}</span>
            <span>👁️ ${views}</span>
            <span>🛡️ ${classification}</span>
        </div>
        <p style="line-height:1.6; color:#ddd;">${movie.overview || "وصف الفيلم غير متوفر حالياً."}</p>
        <button class="btn-details" style="width:100%; margin-top:20px; padding:15px;" onclick="window.open('player.html?id=${movie.id}&type=${type}')">مشاهدة الآن</button>
    `;
    
    // جلب السلسلة (الأجزاء) أولاً، ثم المشابهة
    if(movie.belongs_to_collection) {
        loadCollection(movie.belongs_to_collection.id, type);
    } else {
        collectionContainer.style.display = 'none';
    }

    loadSimilar(id, type);
    detailsModal.style.display = 'block';
}

// ميزة جلب أجزاء الفيلم (السلسلة)
async function loadCollection(collectionId, type) {
    collectionContainer.innerHTML = '<h3 style="color:#ff4d2b; font-size:18px; margin-bottom:15px;">🎬 أجزاء السلسلة بالكامل:</h3><div id="collectionGrid" style="display:flex; gap:10px; overflow-x:auto; padding-bottom:10px;"></div>';
    collectionContainer.style.display = 'block';
    const grid = document.getElementById('collectionGrid');

    try {
        const res = await fetch(`${API_URL}/collection/${collectionId}?api_key=${API_KEY}&language=ar`);
        const data = await res.json();
        
        data.parts.forEach(part => {
            if(!part.poster_path) return;
            const div = document.createElement('div');
            div.style = "min-width:100px; cursor:pointer;";
            div.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w200${part.poster_path}" style="width:100px; height:150px; border-radius:10px; object-fit:cover; border:1px solid #333;">
                <p style="font-size:10px; margin-top:5px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100px;">${part.title}</p>
            `;
            div.onclick = () => {
                detailsModal.scrollTo({ top: 0, behavior: 'smooth' });
                showDetails(part.id, 'movie');
            };
            grid.appendChild(div);
        });
    } catch(e) { console.error("Error loading collection:", e); }
}

async function loadSimilar(id, type) {
    similarContainer.innerHTML = `<h3 style="color:#ff4d2b; font-size:18px; margin-bottom:15px;">✨ ${type==='movie'?'أفلام':'مسلسلات'} مشابهة قد تعجبك:</h3><div id="similarGrid" style="display:flex; gap:10px; overflow-x:auto; padding-bottom:10px;"></div>`;
    const grid = document.getElementById('similarGrid');
    
    try {
        const res = await fetch(`${API_URL}/${type}/${id}/similar?api_key=${API_KEY}&language=ar&page=1`);
        const data = await res.json();
        
        if(data.results.length === 0) {
            similarContainer.innerHTML = '';
            return;
        }

        data.results.slice(0, 6).forEach(item => {
            if(!item.poster_path) return;
            const div = document.createElement('div');
            div.style = "min-width:100px; cursor:pointer;";
            div.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w200${item.poster_path}" style="width:100px; height:150px; border-radius:10px; object-fit:cover; border:1px solid #333;">
                <p style="font-size:10px; margin-top:5px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100px;">${item.title || item.name}</p>
            `;
            div.onclick = () => {
                detailsModal.scrollTo({ top: 0, behavior: 'smooth' });
                showDetails(item.id, type);
            };
            grid.appendChild(div);
        });
    } catch(e) { console.error("Error loading similar:", e); }
}

function openMoodPopup() {
    const moods = [{n:'أضحك 😂', id:35}, {n:'أكشن 🔥', id:28}, {n:'رعب 💀', id:27}, {n:'خيال 🚀', id:878}, {n:'دراما 😢', id:18}];
    const list = document.getElementById('moodList');
    list.innerHTML = '';
    moods.forEach(m => {
        const b = document.createElement('button');
        b.className = 'cat-btn'; b.style.width = '100%'; b.style.marginBottom = '5px'; b.innerText = m.n;
        b.onclick = () => { fetchByMood(m.id); moodModal.style.display = 'none'; };
        list.appendChild(b);
    });
    moodModal.style.display = 'flex';
}

async function fetchByMood(id) {
    manageLoadMore(false);
    moviesGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center; color:#ff4b2b;">جاري الفلترة بناءً على مودك...</p>';
    const res = await fetch(`${API_URL}/discover/movie?api_key=${API_KEY}&language=ar&with_genres=${id}&sort_by=vote_count.desc`);
    const data = await res.json();
    displayMovies(data.results);
}

async function showRandomMovie() {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const res = await fetch(`${API_URL}/movie/popular?api_key=${API_KEY}&language=ar&page=${randomPage}`);
    const data = await res.json();
    const randomIdx = Math.floor(Math.random() * data.results.length);
    showDetails(data.results[randomIdx].id, 'movie');
}

async function loadHero() {
    try {
        const res = await fetch(`${API_URL}/trending/all/day?api_key=${API_KEY}&language=ar`);
        const data = await res.json();
        heroMovies = data.results.slice(0, 10);
        updateHero();
        setInterval(() => { currentIndex = (currentIndex + 1) % heroMovies.length; updateHero(); }, 5000);
    } catch(e) {}
}

function updateHero() {
    const m = heroMovies[currentIndex]; if(!m) return;
    heroSection.style.backgroundImage = `linear-gradient(to top, #0f0f0f 15%, transparent), url(https://image.tmdb.org/t/p/original${m.backdrop_path})`;
    heroSection.innerHTML = `<div class="hero-content"><h1 style="color:#ff4d2b;">${m.title || m.name}</h1><p style="color:#ccc;">${m.overview?.substring(0,120)}...</p><button class="btn-details" onclick="showDetails(${m.id}, '${m.title?'movie':'tv'}')">التفاصيل</button></div>`;
}

async function getTrailer(id, type) {
    const res = await fetch(`${API_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const tr = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (tr) { window.open(`https://www.youtube.com/watch?v=${tr.key}`, '_blank'); } 
    else { alert("للأسف، لا يوجد تريلر متاح حالياً."); }
}

async function searchMovies(q) {
    if(!q) return;
    manageLoadMore(false);
    moviesGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center; color:#ff4b2b;">جاري البحث...</p>';
    const res = await fetch(`${API_URL}/search/multi?api_key=${API_KEY}&language=ar&query=${q}`);
    const data = await res.json();
    displayMovies(data.results);
}