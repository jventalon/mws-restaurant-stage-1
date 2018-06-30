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
    idbPromise = openIDB();
    // register service worker
    registerServiceWorker();
    // initialize the map and restaurants
    initMap();
    // initialize the neighborhoods and cuisines
    loadNeighborhoods();
    loadCuisines();
});

/**
 * Get all neighborhoods and set their HTML.
 */
loadNeighborhoods = () => {
    // get all neighborhoods stored into IDB
    idbPromise.then(db => {
        if (!db) return;
        
        // get neighborhoods stored into IDB
        return db.transaction('neighborhood')
            .objectStore('neighborhood')
            .getAll()
            .then(neighborhoods => {
                if (neighborhoods) {
                    self.neighborhoods = neighborhoods.map(neighborhood => neighborhood.name);
                    fillNeighborhoodsHTML();
                }
            });
    }).then(() => {
        // get all neighborhoods from the server
        fetchNeighborhoods();
    });
}

/**
 * Fetch all neighborhoods from the server and store them in IDB.
 */
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            storeNeighborhoods(neighborhoods);
            fillNeighborhoodsHTML();
        }
    });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
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
loadCuisines = () => {
    // get all cuisines stored into IDB
    idbPromise.then(db => {
        if (!db) return;
        
        return db.transaction('cuisine')
            .objectStore('cuisine')
            .getAll()
            .then(cuisines => {
                if (cuisines) {
                    self.cuisines = cuisines.map(cuisine => cuisine.name);
                    fillCuisinesHTML();
                }
            });
    }).then(() => {
        // get all cuisines from the server
        fetchCuisines();
    });
}

/**
 * Fetch all cuisines from the server and store them in IDB.
 */
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            storeCuisines(cuisines);
            fillCuisinesHTML();
        }
    });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
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
initMap = () => {
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
updateRestaurants = () => {
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
resetRestaurants = (restaurants) => {
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
loadRestaurants = (cuisine, neighborhood) => {
    // get all neighborhoods stored into IDB
    idbPromise.then(db => {
        if (!db) return;
        
        // get restaurants stored into IDB
        const store = db.transaction('restaurant')
                .objectStore('restaurant');
        let promise;
        console.log('neighborhood: ' + neighborhood);
        console.log('cuisine: ' + cuisine);
        if (cuisine != 'all' && neighborhood != 'all') {
            console.log('case 1');
            promise = store.index('neighborhood, cuisine-type')
                .getAll([neighborhood, cuisine]);
        } else if (cuisine != 'all') {
            console.log('case 2');
            promise = store.index('cuisine-type')
                .getAll(cuisine);
        } else if (neighborhood != 'all') {
            console.log('case 3');
            promise = store.index('neighborhood')
                .getAll(neighborhood);
        } else {
            console.log('case 4');
            promise = store.getAll();
        }
        return promise.then(restaurants => {
            if (restaurants) {
                resetRestaurants(restaurants);
                fillRestaurantsHTML();
            }
        });
        
    }).then(() => {
        // get restaurants from the server
        fetchRestaurants(cuisine, neighborhood);
    });
}

/**
 * Fetch restaurants by cuisine and neighborhood from the server and store them in IDB.
 */
fetchRestaurants = (cuisine, neighborhood) => {
    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            if (restaurants) {
                storeRestaurants(restaurants);
                resetRestaurants(restaurants);
                fillRestaurantsHTML();
            }
        }
    });
}


/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
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

    return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
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

/**
 * Register the service worker.
 */
registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('../../sw.js').then(function(reg) {
    if (!navigator.serviceWorker.controller) {
        return;
    }

    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
    });
  });
}

/**
 * Open an indexedDB database for restaurant data.
 */
openIDB = () => {
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open('restaurant-reviews-db', 1, function(upgradeDb) {
      switch(upgradeDb.oldVersion) {
        case 0:
            // create restaurant store with indexes
            let store = upgradeDb.createObjectStore('restaurant', {keyPath: 'id'})
            store.createIndex('neighborhood, cuisine-type', ['neighborhood', 'cuisine_type']);
            store.createIndex('neighborhood', 'neighborhood');
            store.createIndex('cuisine-type', 'cuisine_type');
            // create cuisine store
            upgradeDb.createObjectStore('cuisine', {keyPath: 'id'});
              // create neighborhood store
            upgradeDb.createObjectStore('neighborhood', {keyPath: 'id'});
      }
  });
}

/**
 * Store restaurant data into indexedDB database.
 */
storeRestaurants = (restaurants) => {
    idbPromise.then(db => {
        let store = db.transaction('restaurant', 'readwrite')
            .objectStore('restaurant');
        restaurants.forEach(restaurant => {
            store.put(restaurant);
        });
    });
}

/**
 * Store neighborhood data into indexedDB database.
 */
storeNeighborhoods = (neighborhoods) => {
    idbPromise.then(db => {
        let store = db.transaction('neighborhood', 'readwrite')
            .objectStore('neighborhood');
        neighborhoods.forEach((neighborhood, index) => {
            store.put({
                id: index,
                name: neighborhood
            });
        });
    });
}

/**
 * Store cuisine data into indexedDB database.
 */
storeCuisines = (cuisines) => {
    idbPromise.then(db => {
        let store = db.transaction('cuisine', 'readwrite')
            .objectStore('cuisine');
        cuisines.forEach((cuisine, index) => {
            store.put({
                id: index,
                name: cuisine
            });
        });
    });
}