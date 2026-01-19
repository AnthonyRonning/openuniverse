// Content script - bridges between injected page script and background worker

(function() {
  'use strict';

  // Listen for messages from the injected page script
  window.addEventListener('__openuniverse_tweets__', (event) => {
    const tweets = event.detail;
    if (tweets && tweets.length > 0) {
      chrome.runtime.sendMessage({
        type: 'TWEETS_CAPTURED',
        tweets: tweets
      });
    }
  });

  // Inject script into page context to intercept fetch
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  console.log('OpenUniverse Tweet Collector: Content script loaded');
})();
