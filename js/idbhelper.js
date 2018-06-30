/**
 * Common IDB helper functions.
 */
class IndexedDBHelper {
    
    /**
     * Open an indexedDB database for restaurant data.
     */
    static openIDB() {
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
    static storeRestaurants(idbPromise, restaurants) {
        idbPromise.then(db => {
            if (!db) return;
            
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
    static storeNeighborhoods(idbPromise, neighborhoods) {
        idbPromise.then(db => {
            if (!db) return;
            
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
    static storeCuisines(idbPromise, cuisines) {
        idbPromise.then(db => {
            if (!db) return;
            
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
    
    /**
     * Get restaurant data stored into indexedDB database.
     */
    static getRestaurants(idbPromise, cuisine, neighborhood, callback) {
        return idbPromise.then(db => {
            if (!db) return;

            let promise;
            const store = db.transaction('restaurant')
                    .objectStore('restaurant');
            if (cuisine != 'all' && neighborhood != 'all') {
                promise = store.index('neighborhood, cuisine-type')
                    .getAll([neighborhood, cuisine]);
            } else if (cuisine != 'all') {
                promise = store.index('cuisine-type')
                    .getAll(cuisine);
            } else if (neighborhood != 'all') {
                promise = store.index('neighborhood')
                    .getAll(neighborhood);
            } else {
                promise = store.getAll();
            }
            return promise.then(restaurants => callback(restaurants));
        });
    }
    
    /**
     * Get neighborhood data stored into indexedDB database.
     */
    static getNeighborhoods(idbPromise, callback) {
        return idbPromise.then(db => {
            if (!db) return;

            // get neighborhoods stored into IDB
            return db.transaction('neighborhood')
                .objectStore('neighborhood')
                .getAll()
                .then(neighborhoods => callback(neighborhoods));
        });
    }
    
    /**
     * Get cuisine data stored into indexedDB database.
     */
    static getCuisines(idbPromise, callback) {
        return idbPromise.then(db => {
            if (!db) return;

            return db.transaction('cuisine')
                .objectStore('cuisine')
                .getAll()
                .then(cuisines => callback(cuisines));
        });
    }
}