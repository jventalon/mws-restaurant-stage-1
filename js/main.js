let restaurants,
    neighborhoods,
    cuisines;
var newMap;
var markers = [];
var idbPromise;

/**
 * Initialize data.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    // open idenxedDB database
    idbPromise = IndexedDBHelper.openIDB();
    // register service worker
    SWHelper.registerServiceWorker();
    // initialize the map and restaurants
    initRestaurantsMap();
    // initialize the neighborhoods and cuisines
    loadNeighborhoods();
    loadCuisines();
});

/**
 * Get all neighborhoods and set their HTML.
 */
function loadNeighborhoods() {
    // get all neighborhoods stored into IDB
    IndexedDBHelper.getNeighborhoods(idbPromise, neighborhoods => {
        if (neighborhoods) {
            self.neighborhoods = neighborhoods.map(neighborhood => neighborhood.name);
            fillNeighborhoodsHTML();
        }
    }).then(() => fetchNeighborhoods());
}

/**
 * Fetch all neighborhoods from the server and store them in IDB.
 */
function fetchNeighborhoods() {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            IndexedDBHelper.storeNeighborhoods(idbPromise, neighborhoods);
            fillNeighborhoodsHTML();
        }
    });
}

/**
 * Set neighborhoods HTML.
 */
function fillNeighborhoodsHTML(neighborhoods = self.neighborhoods) {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
}

/**
 * Get all cuisines and set their HTML.
 */
function loadCuisines() {
    // get all cuisines stored into IDB
    IndexedDBHelper.getCuisines(idbPromise, cuisines => {
        if (cuisines) {
            self.cuisines = cuisines.map(cuisine => cuisine.name);
            fillCuisinesHTML();
        }
    }).then(() => fetchCuisines());
}

/**
 * Fetch all cuisines from the server and store them in IDB.
 */
function fetchCuisines() {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            IndexedDBHelper.storeCuisines(idbPromise, cuisines);
            fillCuisinesHTML();
        }
    });
}

/**
 * Set cuisines HTML.
 */
function fillCuisinesHTML(cuisines = self.cuisines) {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
}

/**
 * Initialize Leaflet map, called from HTML.
 */
function initRestaurantsMap() {
    self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
    });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoianZlbnRhbG9uIiwiYSI6ImNqaWttMDMxOTJmaHgza3BlajdxZ3dlOTMifQ.DqcTWxGIVgOzYMU9pxMiyA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(newMap);

    updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
function updateRestaurants() {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;
    
    loadRestaurants(cuisine, neighborhood);
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
function resetRestaurants(restaurants) {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (self.markers) {
        self.markers.forEach(marker => marker.remove());
    }
    self.markers = [];
    self.restaurants = restaurants;
}

/**
 * Get restaurants by cuisine and neighborhood and set their HTML.
 */
function loadRestaurants (cuisine, neighborhood) {
    // get all restaurants stored into IDB
    IndexedDBHelper.getRestaurants(idbPromise, cuisine, neighborhood, restaurants => {
        if (restaurants) {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    }).then(() => fetchRestaurants(cuisine, neighborhood));
}

/**
 * Fetch restaurants by cuisine and neighborhood from the server and store them in IDB.
 */
function fetchRestaurants(cuisine, neighborhood) {
    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            if (restaurants) {
                IndexedDBHelper.storeRestaurants(idbPromise, restaurants);
                resetRestaurants(restaurants);
                fillRestaurantsHTML();
            }
        }
    });
}


/**
 * Create all restaurants HTML and add them to the webpage.
 */
function fillRestaurantsHTML(restaurants = self.restaurants) {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
function createRestaurantHTML(restaurant) {
    const li = document.createElement('li');
    li.className = 'box restaurant';

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.alt = ''; // empty alt as per W3C recommendation as it is only a decorative thumbnail image which don’t add any information (the restaurant name is already in the heading below it)
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    li.append(image);

    const name = document.createElement('h2');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more)

    return li;
}

/**
 * Add markers for current restaurants to the map.
 */
function addMarkersToMap(restaurants = self.restaurants) {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
        marker.on("click", onClick);
        function onClick() {
            window.location.href = marker.options.url;
        }
        self.markers.push(marker);
  });
}