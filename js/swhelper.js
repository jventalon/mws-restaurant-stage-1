/**
 * Common ServiceWorker helper functions.
 */
class SWHelper {
    
    /**
     * Register the service worker.
     */
    static registerServiceWorker() {
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
}