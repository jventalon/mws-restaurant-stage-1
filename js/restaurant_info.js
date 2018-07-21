let restaurant;
var newMap;
var idbPromise;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    // open idenxedDB database
    idbPromise = IndexedDBHelper.openIDB();
    // register service worker
    SWHelper.registerServiceWorker();
    // initialize the map and restaurant
    initRestaurantMap();
});

/**
 * Initialize leaflet map
 */
function initRestaurantMap() {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
        console.error(error);
    } else {
        self.newMap = L.map('map', {
            center: [restaurant.latlng.lat, restaurant.latlng.lng],
            zoom: 16,
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
        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
function fetchRestaurantFromURL(callback) {
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        const error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        IndexedDBHelper.getRestaurantById(idbPromise, id, restaurant => {
            if (restaurant) {
                self.restaurant = restaurant;
                fillRestaurantHTML();
            }
        }).then(() => fetchRestaurantById(id, callback));
        
    }
}

/**
 * Fetch restaurant from the server by id.
 */
function fetchRestaurantById(id, callback) {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
        self.restaurant = restaurant;
        if (!restaurant) {
            console.error(error);
            return;
        }
        IndexedDBHelper.storeRestaurant(idbPromise, restaurant);
        fillRestaurantHTML();
        callback(null, restaurant)
    });
}

/**
 * Create restaurant HTML and add it to the webpage
 */
function fillRestaurantHTML(restaurant = self.restaurant) {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.src = DBHelper.imageUrlForRestaurant(restaurant);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
function fillRestaurantHoursHTML(operatingHours = self.restaurant.operating_hours) {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
function fillReviewsHTML(reviews = self.restaurant.reviews) {
    const container = document.getElementById('reviews-container');
    const ul = document.getElementById('reviews-list');
    ul.innerHTML = '';
    container.innerHTML = '';
    container.appendChild(ul);
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
function createReviewHTML(review) {
    const li = document.createElement('li');
    li.className = 'box review';


    const header = document.createElement('header');
    header.className = 'review-header';

    const name = document.createElement('span');
    name.className = 'review-author';
    name.innerHTML = review.name;
    header.appendChild(name);

    const date = document.createElement('span');
    date.className = 'review-date';
    date.innerHTML = review.date;
    header.appendChild(date);

    li.appendChild(header);

    const raitingContainer = document.createElement('p');
    raitingContainer.className = 'review-rating-container';

    const rating = document.createElement('span');
    rating.className = 'review-rating';
    rating.innerHTML = `Rating: ${review.rating}`;
    raitingContainer.appendChild(rating);

    li.appendChild(raitingContainer);

    const comments = document.createElement('p');
    comments.className = 'review-content';
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
function fillBreadcrumb(restaurant=self.restaurant) {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
function getParameterByName(name, url) {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}