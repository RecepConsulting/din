import './style.css'

// ==================== CONSTANTS ====================
const KAABA_COORDS = { lat: 21.4225, lng: 39.8262 };
const PRAYER_NAMES = {
  Fajr: 'Fajr (Aube)',
  Sunrise: 'Lever du soleil',
  Dhuhr: 'Dhuhr (Midi)',
  Asr: 'Asr (Après-midi)',
  Maghrib: 'Maghrib (Coucher)',
  Isha: 'Isha (Nuit)'
};

// ==================== STATE ====================
let currentLocation = null;
let prayerTimes = null;
let currentDeviceHeading = 0;
let qiblaDirection = 0;

// ==================== DARK MODE ====================
function initDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const isDarkMode = localStorage.getItem('darkMode') === 'true' ||
    (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  }

  darkModeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
  });
}

// ==================== TABS NAVIGATION ====================
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;

      // Update buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update content
      tabContents.forEach(content => {
        if (content.id === `${targetTab}-section`) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    });
  });
}

// ==================== GEOLOCATION ====================
async function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      error => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

async function getCityName(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await response.json();
    return data.address?.city || data.address?.town || data.address?.village || 'Localisation inconnue';
  } catch (error) {
    console.error('Erreur lors de la récupération du nom de la ville:', error);
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}

// ==================== PRAYER TIMES ====================
async function fetchPrayerTimes(lat, lng) {
  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`
    );
    const data = await response.json();

    if (data.code === 200) {
      return data.data;
    }
    throw new Error('Erreur lors de la récupération des horaires');
  } catch (error) {
    console.error('Erreur API prayer times:', error);
    throw error;
  }
}

function getCurrentAndNextPrayer(timings) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const prayerMinutes = prayers.map(prayer => {
    const [hours, minutes] = timings[prayer].split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
  });

  let currentPrayer = null;
  let nextPrayer = null;

  for (let i = 0; i < prayers.length; i++) {
    if (currentTime < prayerMinutes[i]) {
      nextPrayer = prayers[i];
      currentPrayer = i > 0 ? prayers[i - 1] : null;
      break;
    }
  }

  // Si on est après Isha, la prière actuelle est Isha et la prochaine est Fajr
  if (!nextPrayer) {
    currentPrayer = 'Isha';
    nextPrayer = 'Fajr';
  }

  return { currentPrayer, nextPrayer };
}

function displayPrayerTimes(data) {
  const container = document.getElementById('prayerTimesContainer');
  const timings = data.timings;
  const { currentPrayer, nextPrayer } = getCurrentAndNextPrayer(timings);

  const prayersToDisplay = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  container.innerHTML = prayersToDisplay.map(prayer => {
    let classes = 'prayer-card';
    let badge = '';

    if (prayer === currentPrayer) {
      classes += ' current';
      badge = '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-500 text-white">En cours</span>';
    } else if (prayer === nextPrayer) {
      classes += ' next';
      badge = '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">Prochaine</span>';
    }

    return `
      <div class="${classes}">
        <div class="flex items-center space-x-3">
          <div class="w-2 h-2 rounded-full ${prayer === currentPrayer ? 'bg-emerald-500' : prayer === nextPrayer ? 'bg-blue-500' : 'bg-gray-400'}"></div>
          <div>
            <div class="font-semibold text-gray-900 dark:text-white">${PRAYER_NAMES[prayer]}</div>
            ${badge}
          </div>
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          ${timings[prayer]}
        </div>
      </div>
    `;
  }).join('');

  // Update dates
  displayDates(data.date);
}

function displayDates(dateData) {
  const hijriDate = document.getElementById('hijriDate');
  const gregorianDate = document.getElementById('gregorianDate');

  hijriDate.textContent = `${dateData.hijri.day} ${dateData.hijri.month.ar} ${dateData.hijri.year} هـ`;
  gregorianDate.textContent = `${dateData.gregorian.day} ${dateData.gregorian.month.en} ${dateData.gregorian.year}`;
}

async function loadPrayerTimes() {
  const locationText = document.getElementById('locationText');

  try {
    locationText.textContent = 'Récupération de votre position...';
    currentLocation = await getLocation();

    const cityName = await getCityName(currentLocation.lat, currentLocation.lng);
    locationText.textContent = `📍 ${cityName}`;

    prayerTimes = await fetchPrayerTimes(currentLocation.lat, currentLocation.lng);
    displayPrayerTimes(prayerTimes);

    // Calculate Qibla direction
    calculateQiblaDirection(currentLocation.lat, currentLocation.lng);
  } catch (error) {
    console.error('Erreur:', error);
    locationText.textContent = '❌ Impossible d\'obtenir votre position. Veuillez autoriser la géolocalisation.';
  }
}

// ==================== QURAN ====================
const SURAHS = [
  { number: 1, name: 'Al-Fatihah', arabicName: 'الفاتحة', verses: 7, revelation: 'Meccan' },
  { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', verses: 286, revelation: 'Medinan' },
  { number: 3, name: 'Aal-E-Imran', arabicName: 'آل عمران', verses: 200, revelation: 'Medinan' },
  { number: 4, name: 'An-Nisa', arabicName: 'النساء', verses: 176, revelation: 'Medinan' },
  { number: 5, name: 'Al-Ma\'idah', arabicName: 'المائدة', verses: 120, revelation: 'Medinan' },
  { number: 6, name: 'Al-An\'am', arabicName: 'الأنعام', verses: 165, revelation: 'Meccan' },
  { number: 7, name: 'Al-A\'raf', arabicName: 'الأعراف', verses: 206, revelation: 'Meccan' },
  { number: 8, name: 'Al-Anfal', arabicName: 'الأنفال', verses: 75, revelation: 'Medinan' },
  { number: 9, name: 'At-Tawbah', arabicName: 'التوبة', verses: 129, revelation: 'Medinan' },
  { number: 10, name: 'Yunus', arabicName: 'يونس', verses: 109, revelation: 'Meccan' },
  { number: 11, name: 'Hud', arabicName: 'هود', verses: 123, revelation: 'Meccan' },
  { number: 12, name: 'Yusuf', arabicName: 'يوسف', verses: 111, revelation: 'Meccan' },
  { number: 13, name: 'Ar-Ra\'d', arabicName: 'الرعد', verses: 43, revelation: 'Medinan' },
  { number: 14, name: 'Ibrahim', arabicName: 'ابراهيم', verses: 52, revelation: 'Meccan' },
  { number: 15, name: 'Al-Hijr', arabicName: 'الحجر', verses: 99, revelation: 'Meccan' },
  { number: 16, name: 'An-Nahl', arabicName: 'النحل', verses: 128, revelation: 'Meccan' },
  { number: 17, name: 'Al-Isra', arabicName: 'الإسراء', verses: 111, revelation: 'Meccan' },
  { number: 18, name: 'Al-Kahf', arabicName: 'الكهف', verses: 110, revelation: 'Meccan' },
  { number: 19, name: 'Maryam', arabicName: 'مريم', verses: 98, revelation: 'Meccan' },
  { number: 20, name: 'Ta-Ha', arabicName: 'طه', verses: 135, revelation: 'Meccan' },
  { number: 21, name: 'Al-Anbiya', arabicName: 'الأنبياء', verses: 112, revelation: 'Meccan' },
  { number: 22, name: 'Al-Hajj', arabicName: 'الحج', verses: 78, revelation: 'Medinan' },
  { number: 23, name: 'Al-Mu\'minun', arabicName: 'المؤمنون', verses: 118, revelation: 'Meccan' },
  { number: 24, name: 'An-Nur', arabicName: 'النور', verses: 64, revelation: 'Medinan' },
  { number: 25, name: 'Al-Furqan', arabicName: 'الفرقان', verses: 77, revelation: 'Meccan' },
  { number: 26, name: 'Ash-Shu\'ara', arabicName: 'الشعراء', verses: 227, revelation: 'Meccan' },
  { number: 27, name: 'An-Naml', arabicName: 'النمل', verses: 93, revelation: 'Meccan' },
  { number: 28, name: 'Al-Qasas', arabicName: 'القصص', verses: 88, revelation: 'Meccan' },
  { number: 29, name: 'Al-Ankabut', arabicName: 'العنكبوت', verses: 69, revelation: 'Meccan' },
  { number: 30, name: 'Ar-Rum', arabicName: 'الروم', verses: 60, revelation: 'Meccan' },
  { number: 31, name: 'Luqman', arabicName: 'لقمان', verses: 34, revelation: 'Meccan' },
  { number: 32, name: 'As-Sajdah', arabicName: 'السجدة', verses: 30, revelation: 'Meccan' },
  { number: 33, name: 'Al-Ahzab', arabicName: 'الأحزاب', verses: 73, revelation: 'Medinan' },
  { number: 34, name: 'Saba', arabicName: 'سبإ', verses: 54, revelation: 'Meccan' },
  { number: 35, name: 'Fatir', arabicName: 'فاطر', verses: 45, revelation: 'Meccan' },
  { number: 36, name: 'Ya-Sin', arabicName: 'يس', verses: 83, revelation: 'Meccan' },
  { number: 37, name: 'As-Saffat', arabicName: 'الصافات', verses: 182, revelation: 'Meccan' },
  { number: 38, name: 'Sad', arabicName: 'ص', verses: 88, revelation: 'Meccan' },
  { number: 39, name: 'Az-Zumar', arabicName: 'الزمر', verses: 75, revelation: 'Meccan' },
  { number: 40, name: 'Ghafir', arabicName: 'غافر', verses: 85, revelation: 'Meccan' },
  { number: 41, name: 'Fussilat', arabicName: 'فصلت', verses: 54, revelation: 'Meccan' },
  { number: 42, name: 'Ash-Shuraa', arabicName: 'الشورى', verses: 53, revelation: 'Meccan' },
  { number: 43, name: 'Az-Zukhruf', arabicName: 'الزخرف', verses: 89, revelation: 'Meccan' },
  { number: 44, name: 'Ad-Dukhan', arabicName: 'الدخان', verses: 59, revelation: 'Meccan' },
  { number: 45, name: 'Al-Jathiyah', arabicName: 'الجاثية', verses: 37, revelation: 'Meccan' },
  { number: 46, name: 'Al-Ahqaf', arabicName: 'الأحقاف', verses: 35, revelation: 'Meccan' },
  { number: 47, name: 'Muhammad', arabicName: 'محمد', verses: 38, revelation: 'Medinan' },
  { number: 48, name: 'Al-Fath', arabicName: 'الفتح', verses: 29, revelation: 'Medinan' },
  { number: 49, name: 'Al-Hujurat', arabicName: 'الحجرات', verses: 18, revelation: 'Medinan' },
  { number: 50, name: 'Qaf', arabicName: 'ق', verses: 45, revelation: 'Meccan' },
  { number: 51, name: 'Adh-Dhariyat', arabicName: 'الذاريات', verses: 60, revelation: 'Meccan' },
  { number: 52, name: 'At-Tur', arabicName: 'الطور', verses: 49, revelation: 'Meccan' },
  { number: 53, name: 'An-Najm', arabicName: 'النجم', verses: 62, revelation: 'Meccan' },
  { number: 54, name: 'Al-Qamar', arabicName: 'القمر', verses: 55, revelation: 'Meccan' },
  { number: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', verses: 78, revelation: 'Medinan' },
  { number: 56, name: 'Al-Waqi\'ah', arabicName: 'الواقعة', verses: 96, revelation: 'Meccan' },
  { number: 57, name: 'Al-Hadid', arabicName: 'الحديد', verses: 29, revelation: 'Medinan' },
  { number: 58, name: 'Al-Mujadila', arabicName: 'المجادلة', verses: 22, revelation: 'Medinan' },
  { number: 59, name: 'Al-Hashr', arabicName: 'الحشر', verses: 24, revelation: 'Medinan' },
  { number: 60, name: 'Al-Mumtahanah', arabicName: 'الممتحنة', verses: 13, revelation: 'Medinan' },
  { number: 61, name: 'As-Saff', arabicName: 'الصف', verses: 14, revelation: 'Medinan' },
  { number: 62, name: 'Al-Jumu\'ah', arabicName: 'الجمعة', verses: 11, revelation: 'Medinan' },
  { number: 63, name: 'Al-Munafiqun', arabicName: 'المنافقون', verses: 11, revelation: 'Medinan' },
  { number: 64, name: 'At-Taghabun', arabicName: 'التغابن', verses: 18, revelation: 'Medinan' },
  { number: 65, name: 'At-Talaq', arabicName: 'الطلاق', verses: 12, revelation: 'Medinan' },
  { number: 66, name: 'At-Tahrim', arabicName: 'التحريم', verses: 12, revelation: 'Medinan' },
  { number: 67, name: 'Al-Mulk', arabicName: 'الملك', verses: 30, revelation: 'Meccan' },
  { number: 68, name: 'Al-Qalam', arabicName: 'القلم', verses: 52, revelation: 'Meccan' },
  { number: 69, name: 'Al-Haqqah', arabicName: 'الحاقة', verses: 52, revelation: 'Meccan' },
  { number: 70, name: 'Al-Ma\'arij', arabicName: 'المعارج', verses: 44, revelation: 'Meccan' },
  { number: 71, name: 'Nuh', arabicName: 'نوح', verses: 28, revelation: 'Meccan' },
  { number: 72, name: 'Al-Jinn', arabicName: 'الجن', verses: 28, revelation: 'Meccan' },
  { number: 73, name: 'Al-Muzzammil', arabicName: 'المزمل', verses: 20, revelation: 'Meccan' },
  { number: 74, name: 'Al-Muddaththir', arabicName: 'المدثر', verses: 56, revelation: 'Meccan' },
  { number: 75, name: 'Al-Qiyamah', arabicName: 'القيامة', verses: 40, revelation: 'Meccan' },
  { number: 76, name: 'Al-Insan', arabicName: 'الانسان', verses: 31, revelation: 'Medinan' },
  { number: 77, name: 'Al-Mursalat', arabicName: 'المرسلات', verses: 50, revelation: 'Meccan' },
  { number: 78, name: 'An-Naba', arabicName: 'النبإ', verses: 40, revelation: 'Meccan' },
  { number: 79, name: 'An-Nazi\'at', arabicName: 'النازعات', verses: 46, revelation: 'Meccan' },
  { number: 80, name: 'Abasa', arabicName: 'عبس', verses: 42, revelation: 'Meccan' },
  { number: 81, name: 'At-Takwir', arabicName: 'التكوير', verses: 29, revelation: 'Meccan' },
  { number: 82, name: 'Al-Infitar', arabicName: 'الإنفطار', verses: 19, revelation: 'Meccan' },
  { number: 83, name: 'Al-Mutaffifin', arabicName: 'المطففين', verses: 36, revelation: 'Meccan' },
  { number: 84, name: 'Al-Inshiqaq', arabicName: 'الإنشقاق', verses: 25, revelation: 'Meccan' },
  { number: 85, name: 'Al-Buruj', arabicName: 'البروج', verses: 22, revelation: 'Meccan' },
  { number: 86, name: 'At-Tariq', arabicName: 'الطارق', verses: 17, revelation: 'Meccan' },
  { number: 87, name: 'Al-A\'la', arabicName: 'الأعلى', verses: 19, revelation: 'Meccan' },
  { number: 88, name: 'Al-Ghashiyah', arabicName: 'الغاشية', verses: 26, revelation: 'Meccan' },
  { number: 89, name: 'Al-Fajr', arabicName: 'الفجر', verses: 30, revelation: 'Meccan' },
  { number: 90, name: 'Al-Balad', arabicName: 'البلد', verses: 20, revelation: 'Meccan' },
  { number: 91, name: 'Ash-Shams', arabicName: 'الشمس', verses: 15, revelation: 'Meccan' },
  { number: 92, name: 'Al-Layl', arabicName: 'الليل', verses: 21, revelation: 'Meccan' },
  { number: 93, name: 'Ad-Duhaa', arabicName: 'الضحى', verses: 11, revelation: 'Meccan' },
  { number: 94, name: 'Ash-Sharh', arabicName: 'الشرح', verses: 8, revelation: 'Meccan' },
  { number: 95, name: 'At-Tin', arabicName: 'التين', verses: 8, revelation: 'Meccan' },
  { number: 96, name: 'Al-Alaq', arabicName: 'العلق', verses: 19, revelation: 'Meccan' },
  { number: 97, name: 'Al-Qadr', arabicName: 'القدر', verses: 5, revelation: 'Meccan' },
  { number: 98, name: 'Al-Bayyinah', arabicName: 'البينة', verses: 8, revelation: 'Medinan' },
  { number: 99, name: 'Az-Zalzalah', arabicName: 'الزلزلة', verses: 8, revelation: 'Medinan' },
  { number: 100, name: 'Al-Adiyat', arabicName: 'العاديات', verses: 11, revelation: 'Meccan' },
  { number: 101, name: 'Al-Qari\'ah', arabicName: 'القارعة', verses: 11, revelation: 'Meccan' },
  { number: 102, name: 'At-Takathur', arabicName: 'التكاثر', verses: 8, revelation: 'Meccan' },
  { number: 103, name: 'Al-Asr', arabicName: 'العصر', verses: 3, revelation: 'Meccan' },
  { number: 104, name: 'Al-Humazah', arabicName: 'الهمزة', verses: 9, revelation: 'Meccan' },
  { number: 105, name: 'Al-Fil', arabicName: 'الفيل', verses: 5, revelation: 'Meccan' },
  { number: 106, name: 'Quraysh', arabicName: 'قريش', verses: 4, revelation: 'Meccan' },
  { number: 107, name: 'Al-Ma\'un', arabicName: 'الماعون', verses: 7, revelation: 'Meccan' },
  { number: 108, name: 'Al-Kawthar', arabicName: 'الكوثر', verses: 3, revelation: 'Meccan' },
  { number: 109, name: 'Al-Kafirun', arabicName: 'الكافرون', verses: 6, revelation: 'Meccan' },
  { number: 110, name: 'An-Nasr', arabicName: 'النصر', verses: 3, revelation: 'Medinan' },
  { number: 111, name: 'Al-Masad', arabicName: 'المسد', verses: 5, revelation: 'Meccan' },
  { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', verses: 4, revelation: 'Meccan' },
  { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', verses: 5, revelation: 'Meccan' },
  { number: 114, name: 'An-Nas', arabicName: 'الناس', verses: 6, revelation: 'Meccan' }
];

function populateSurahSelect() {
  const select = document.getElementById('surahSelect');
  select.innerHTML = SURAHS.map(surah =>
    `<option value="${surah.number}">${surah.number}. ${surah.name} - ${surah.arabicName} (${surah.verses} versets)</option>`
  ).join('');
}

async function fetchSurah(surahNumber, edition = 'fr.hamidullah') {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${edition}`);
    const data = await response.json();

    if (data.code === 200) {
      return data.data;
    }
    throw new Error('Erreur lors de la récupération de la sourate');
  } catch (error) {
    console.error('Erreur API Quran:', error);
    throw error;
  }
}

async function displaySurah() {
  const surahNumber = document.getElementById('surahSelect').value;
  const edition = document.getElementById('translationSelect').value;
  const surahInfo = SURAHS.find(s => s.number === parseInt(surahNumber));

  const container = document.getElementById('versesContainer');
  container.innerHTML = '<div class="loading text-center py-8 text-gray-500">Chargement...</div>';

  try {
    const surahData = await fetchSurah(surahNumber, edition);

    // Display surah info
    document.getElementById('surahInfo').innerHTML = `
      <div class="text-center border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ${surahData.englishName} - ${surahData.name}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          ${surahInfo.revelation === 'Meccan' ? 'Mecquoise' : 'Médinoise'} • ${surahData.numberOfAyahs} versets
        </p>
      </div>
    `;

    // Display verses
    container.innerHTML = surahData.ayahs.map(ayah => `
      <div class="verse-card">
        <div class="flex items-start justify-between mb-2">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-semibold">
            ${ayah.numberInSurah}
          </span>
        </div>
        <p class="text-gray-800 dark:text-gray-200 leading-relaxed">
          ${ayah.text}
        </p>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = '<div class="text-center py-8 text-red-500">Erreur lors du chargement de la sourate</div>';
  }
}

function initQuran() {
  populateSurahSelect();

  document.getElementById('surahSelect').addEventListener('change', displaySurah);
  document.getElementById('translationSelect').addEventListener('change', displaySurah);

  // Load first surah by default
  displaySurah();
}

// ==================== QIBLA ====================
function calculateQiblaDirection(lat, lng) {
  const toRadians = (deg) => deg * (Math.PI / 180);
  const toDegrees = (rad) => rad * (180 / Math.PI);

  const lat1 = toRadians(lat);
  const lng1 = toRadians(lng);
  const lat2 = toRadians(KAABA_COORDS.lat);
  const lng2 = toRadians(KAABA_COORDS.lng);

  const dLng = lng2 - lng1;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let bearing = toDegrees(Math.atan2(y, x));
  qiblaDirection = (bearing + 360) % 360;

  document.getElementById('qiblaDirection').textContent = `${Math.round(qiblaDirection)}°`;

  return qiblaDirection;
}

function initQibla() {
  if ('DeviceOrientationEvent' in window) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ devices
      document.getElementById('qiblaStatus').innerHTML = `
        <button class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          Activer la boussole
        </button>
      `;

      document.querySelector('#qiblaStatus button').addEventListener('click', async () => {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            setupCompass();
          }
        } catch (error) {
          console.error('Erreur permission:', error);
        }
      });
    } else {
      // Non-iOS devices
      setupCompass();
    }
  } else {
    document.getElementById('qiblaStatus').textContent = 'La boussole n\'est pas disponible sur cet appareil';
  }
}

function setupCompass() {
  window.addEventListener('deviceorientationabsolute', handleOrientation, true);
  window.addEventListener('deviceorientation', handleOrientation, true);
  document.getElementById('qiblaStatus').textContent = 'Boussole active';
}

function handleOrientation(event) {
  let heading = event.alpha;

  if (event.webkitCompassHeading) {
    heading = event.webkitCompassHeading;
  } else if (heading !== null) {
    heading = 360 - heading;
  }

  if (heading !== null) {
    currentDeviceHeading = heading;
    updateCompassNeedle();
  }
}

function updateCompassNeedle() {
  const needle = document.getElementById('compassNeedle');
  const rotation = qiblaDirection - currentDeviceHeading;
  needle.style.transform = `rotate(${rotation}deg)`;
}

// ==================== SERVICE WORKER ====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(error => console.log('SW registration failed:', error));
  });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initTabs();
  loadPrayerTimes();
  initQuran();
  initQibla();

  // Refresh location button
  document.getElementById('refreshLocation').addEventListener('click', loadPrayerTimes);

  // Update prayer times every minute
  setInterval(() => {
    if (prayerTimes) {
      displayPrayerTimes(prayerTimes);
    }
  }, 60000);
});
