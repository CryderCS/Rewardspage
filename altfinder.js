// Ensure utils.js is loaded before this script

// --- Polling State ---
let pollingInterval = null;
let queueModal = null;
let queueModalMessage = null;
let queuePositionText = null;
let targetTimestampToScroll = null; // For restoring scroll position from URL


// --- Search State Variables (Global within script scope) ---
let currentCursor = null; // Use cursor instead of page number
let pageSize = 50; // Default page size
let totalResults = 0;
let currentSearchQuery = '';
let isLoading = false;
let hasMoreResults = true; // Determined by presence of nextCursor
const displayedEventIds = new Set(); // Track displayed messages/events to prevent duplicates
let currentOldUsernames = []; // Yeni eklendi

// Autocomplete state
let autocompleteTimeout = null;
let selectedAutocompleteIndex = -1;
let autocompleteResults = [];
let currentChannelEvents = []; // Store events for the current channel search
let searchInitiated = false; // Flag to track if a search has been started

// --- DOM Element Variables (declared globally, assigned in DOMContentLoaded) ---
let searchForm = null;
let searchQuery = null;
// let searchSize = null; // Not used globally
let loading = null;
let resultsInfo = null;
let resultsCount = null;
let chatMessages = null;
let searchHeader = null;
// let pagination = null; // Pagination controls removed as we use infinite scroll
let usernameFilter = null;
let channelFilter = null;
let dateFrom = null;
let dateTo = null;
let searchPage = null; // Retained for page detection
// let toggleHelp = null; // Replaced by searchTipsToggleTitle
let searchTips = null;
let searchTipsToggleTitle = null; // New variable for the h4 title
let advancedSearchToggle = null;
let advancedSearchFields = null;
let searchWarningModal = null;
let modalCloseButton = null;
let modalOkButton = null;
let modalLoginButton = null;
let modalUpgradeButton = null;
let shareSearchButton = null; // Added for share button

// --- Ad Container Modal Elements ---
// Rewarded Ad Choice Modal elements removed, logic merged into searchWarningModal
let adContainerModal = null;
let adContainerCloseButton = null;
let adPlayerContent = null; // Will be the <video> tag for FluidPlayer
let adLoadingMessage = null;
let adRewardMessage = null; // Added for reward message display
let adErrorMessage = null; // Added for error message display
// let manualAdPlayButton = null; // REMOVED - No longer using custom button

// --- Ad State ---
let fluidPlayerInstance = null; // To hold the FluidPlayer instance
// videoJsPlayer, videoContentElement, isAdPlaying, VAST_AD_TAG_URL removed
let originalSearchFunction = null; // To store the search function call that was blocked (retained)


document.addEventListener('DOMContentLoaded', () => {
    // --- Assign DOM elements ---
    searchForm = document.getElementById('search-form');
    searchQuery = document.getElementById('search-query');
    // searchSize = document.getElementById('search-size'); // Not needed globally
    loading = document.getElementById('loading');
    resultsInfo = document.getElementById('results-info');
    resultsCount = document.getElementById('results-count');
    chatMessages = document.getElementById('chat-messages');
    searchHeader = document.getElementById('search-header');
    // pagination = document.getElementById('pagination'); // Removed
    usernameFilter = document.getElementById('username-filter');
    channelFilter = document.getElementById('channel-filter');
    dateFrom = document.getElementById('date-from');
    dateTo = document.getElementById('date-to');
    searchPage = document.getElementById('search-page');
    // toggleHelp = document.getElementById('toggle-help'); // Replaced
    searchTips = document.getElementById('search-tips');
    searchTipsToggleTitle = document.getElementById('search-tips-toggle-title'); // Assign new h4 title
    advancedSearchToggle = document.getElementById('advanced-search-toggle');
    advancedSearchFields = document.getElementById('advanced-search-fields');
    searchWarningModal = document.getElementById('search-warning-modal');
    modalCloseButton = searchWarningModal ? searchWarningModal.querySelector('.close-button') : null;
    // modalOkButton removed, using modalDeclineButton instead
    modalLoginButton = document.getElementById('modal-login-button');
    modalUpgradeButton = document.getElementById('modal-upgrade-button');
    // New buttons for combined modal
    modalWatchAdButton = document.getElementById('modal-watch-ad-button');
    modalDeclineButton = document.getElementById('modal-decline-button'); // Replaces modalOkButton functionally
    shareSearchButton = document.getElementById('share-search-button'); // Assign share button

    // --- Assign Ad Container Modal Elements ---
    adContainerModal = document.getElementById('ad-container-modal');
    adContainerCloseButton = document.getElementById('ad-container-close');
    adPlayerContent = document.getElementById('fluid-ad-player'); // Use the new ID for FluidPlayer video tag
    adLoadingMessage = document.getElementById('ad-loading-message');
    adRewardMessage = document.getElementById('ad-reward-message'); // Assign new element
    adErrorMessage = document.getElementById('ad-error-message'); // Assign new element
    // manualAdPlayButton = document.getElementById('manual-ad-play-button'); // REMOVED
    queueModal = document.getElementById('queue-status-modal');
    queueModalMessage = document.getElementById('queue-modal-message');
    queuePositionText = document.getElementById('queue-position-text');

    // --- Initialization (Only if on Search Page) ---
    // Check if searchPage element exists before proceeding with search-specific setup
    if (searchPage) {
        console.log("Search page detected. Initializing search specific elements.");

        // --- Advanced Search Toggle ---
        if (advancedSearchToggle && advancedSearchFields) {
            // Set initial state based on whether fields have content (e.g., from URL params)
            const hasAdvancedContent = (usernameFilter && usernameFilter.value) ||
                                       (channelFilter && channelFilter.value) ||
                                       (dateFrom && dateFrom.value) ||
                                       (dateTo && dateTo.value);
          //  advancedSearchFields.style.display = hasAdvancedContent ? 'block' : 'none';
          advancedSearchFields.style.display =  'block';
            const initialIconClass = hasAdvancedContent ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
            const icon = advancedSearchToggle.querySelector('i');
            if (icon) icon.className = initialIconClass;


            advancedSearchToggle.addEventListener('click', (e) => {
                e.preventDefault();
                const isHidden = advancedSearchFields.style.display === 'none';
                advancedSearchFields.style.display = isHidden ? 'block' : 'none';
                const icon = advancedSearchToggle.querySelector('i');
                if (icon) {
                    icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
                }
            });
        }else{
             if (advancedSearchFields) advancedSearchFields.style.display = 'block';
        }

        // --- Combined Rate Limit Modal Event Listeners (Initial Setup) ---
        // Specific button actions (Login, Upgrade, Watch Ad, Decline) are now set dynamically within showCombinedRateLimitModal
        if (searchWarningModal && modalCloseButton) {
            // General close button (top right 'X')
            modalCloseButton.onclick = () => searchWarningModal.style.display = 'none';
            // Close modal if clicked outside
            window.addEventListener('click', (event) => {
                if (event.target == searchWarningModal) searchWarningModal.style.display = 'none';
            });
            // Login and Upgrade button listeners remain simple redirects
             if (modalLoginButton) {
                 modalLoginButton.onclick = () => window.location.href = '/login';
             }
             if (modalUpgradeButton) {
                 modalUpgradeButton.onclick = () => window.location.href = '/packages';
             }
             // Watch Ad and Decline listeners are set dynamically in showCombinedRateLimitModal
        }


        // --- Ad Container Modal Listener ---
        if (adContainerModal && adContainerCloseButton) {
            adContainerCloseButton.onclick = () => {
                // Handle user closing the ad prematurely
                console.log("User closed ad container.");
                cleanupFluidAd(); // Clean up FluidPlayer resources
                adContainerModal.style.display = 'none';
                showCombinedRateLimitModal(); // Show the combined modal again if ad is closed early
            };
             // Close modal if clicked outside (might interfere with ad clicks, consider disabling)
            /* window.addEventListener('click', (event) => {
                 if (event.target == adContainerModal) {
                     adContainerModal.style.display = 'none';
                     cleanupAd();
                     showCombinedRateLimitModal(); // Show combined modal
                 }
            }); */
        }

        // --- Referral Offer Modal Check (Run early after modal elements are defined, with a slight delay) ---
        setTimeout(() => {
            console.log("Checking for referral offer (after timeout)..."); // DEBUG
            try {
                // Read the offer description from the data attribute
                const offerDescription = document.body.dataset.referralOffer;

                if (offerDescription) {
                     console.log("Referral offer data found in body dataset:", offerDescription); // DEBUG
                } else {
                    console.log("No referral offer data found in body dataset (after timeout)."); // DEBUG
            }

            // Get the NEW referral modal element
            const referralModal = document.getElementById('referral-offer-modal');
            const referralModalCloseButton = referralModal?.querySelector('.close-button');

            // DEBUG: Log finding the new modal
            console.log("Referral modal elements found:", {
                referralModal: !!referralModal,
                referralModalCloseButton: !!referralModalCloseButton
            });

            // Check if the offer description exists AND the new modal element exists in the DOM
            if (offerDescription && referralModal && referralModalCloseButton) {
                console.log("Referral offer and referral modal found. Proceeding to display."); // DEBUG

                // Content (title/message) is already set by EJS.
                // No need to hide buttons as the new modal doesn't have them.

                // Add close functionality specific to this modal
                referralModalCloseButton.onclick = () => referralModal.style.display = 'none';
                // Add window click listener to close this specific modal
                const referralWindowClickListener = (event) => {
                    if (event.target == referralModal) {
                        referralModal.style.display = 'none';
                        // Clean up listener after closing
                        window.removeEventListener('click', referralWindowClickListener);
                    }
                };
                window.addEventListener('click', referralWindowClickListener);


                // Display the modal
                console.log("Attempting to display referral modal..."); // DEBUG
                referralModal.style.display = 'block';
                console.log("Referral modal display style set to 'block'. Current display:", referralModal.style.display); // DEBUG

                // Clean the URL parameter (Still relevant as the redirect adds it)
                // Check if the ref_offer param exists before trying to clean
                const currentUrlParams = new URLSearchParams(window.location.search);
                if (currentUrlParams.has('ref_offer')) {
                    if (window.history && window.history.replaceState) {
                        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                        // Preserve other query params if necessary
                        currentUrlParams.delete('ref_offer');
                        const remainingParams = currentUrlParams.toString();
                        const finalUrl = cleanUrl + (remainingParams ? '?' + remainingParams : '');

                        window.history.replaceState({ path: finalUrl }, '', finalUrl);
                        console.log('Referral query parameter removed from URL.');
                    } else {
                        console.warn('Browser does not support history.replaceState - cannot clean URL.');
                    }
                }
            } else {
                 // Log if offerDescription is null/empty OR if modal elements are missing
                 if (!offerDescription) {
                     // console.log("No referral offer data found in body dataset."); // Already logged
                 } else {
                     console.error("Referral offer found, but some modal elements are missing. Cannot display modal.");
                 }
            }
        } catch (e) {
            console.error('Error processing referral offer data (after timeout):', e);
        }
        // --- End Referral Offer Modal Check ---
    }, 100); // Delay execution slightly (100ms)


        // --- Search Tips Accordion ---
        if (searchTipsToggleTitle && searchTips) {
            const iconElement = searchTipsToggleTitle.querySelector('i');
            // Initial state: tips are visible as per EJS (display: block), icon is fa-chevron-up

            searchTipsToggleTitle.addEventListener('click', function() {
                const isHidden = searchTips.style.display === 'none';
                searchTips.style.display = isHidden ? 'block' : 'none';
                if (iconElement) {
                    iconElement.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
                }
            });
        }

        // --- Default Date Range ---
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        const todayString = formatDateToDateTimeLocalString(today); // From utils.js
        const oneWeekAgoString = formatDateToDateTimeLocalString(oneWeekAgo); // From utils.js

        // Set default dates only if they are empty (to respect URL params)
        if (dateTo && !dateTo.value) dateTo.value = todayString;
        if (dateFrom && !dateFrom.value) dateFrom.value = oneWeekAgoString;

        // --- Setup Autocomplete ---
        setupChannelAutocomplete();

        // --- Search Form Submission ---
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (isLoading) return;
                currentCursor = null; // Reset cursor on new search
                currentSearchQuery = searchQuery ? searchQuery.value : '';
                // pageSize is set globally

                // Collapse search tips when search button is clicked
                if (searchTips && searchTips.style.display !== 'none') {
                    searchTips.style.display = 'none';
                    const iconElement = searchTipsToggleTitle ? searchTipsToggleTitle.querySelector('i') : null;
                    if (iconElement) {
                        iconElement.className = 'fas fa-chevron-down'; // Set to down arrow when collapsed
                    }
                }

                searchMessages(); // Start search (no targetPage needed)
            });
        }

        // --- Auto-search if URL parameters were pre-filled ---
        const urlParams = new URLSearchParams(window.location.search);
        const pathSegments = window.location.pathname.split('/').filter(Boolean); // e.g., ['search', 'query', 'user', 'channel', 'from', 'to']

        let preFilledQuery = '';
        let preFilledUser = '';
        let preFilledChannel = '';
        let preFilledDateFrom = '';
        let preFilledDateTo = '';
        // let preFilledScrollPage = urlParams.get('scrollPage'); // No longer using page numbers
        let preFilledScrollTs = urlParams.get('scrollTopTs'); // Keep timestamp for scrolling
            if (preFilledScrollTs) {
    targetTimestampToScroll = parseInt(preFilledScrollTs, 10);
    console.log(`Target timestamp to scroll to: ${targetTimestampToScroll}`);
}

        // Extract parameters from path if available
        if (pathSegments.length > 1 && pathSegments[0] === 'search') {
            preFilledQuery = decodeURIComponent(pathSegments[1] || '').replace(/^_$/, ''); // Handle '_' placeholder
            preFilledUser = decodeURIComponent(pathSegments[2] || '').replace(/^_$/, '');
            preFilledChannel = decodeURIComponent(pathSegments[3] || '').replace(/^_$/, '');
            preFilledDateFrom = decodeURIComponent(pathSegments[4] || '').replace(/^_$/, '');
            preFilledDateTo = decodeURIComponent(pathSegments[5] || '').replace(/^_$/, '');
        }

        // Also check for 'channel' from query parameter and prioritize it if path is empty
        const channelFromQuery = urlParams.get('channel');
        if (!preFilledChannel && channelFromQuery) {
            preFilledChannel = channelFromQuery;
        }

        // Populate form fields if they were empty but values exist in path/query
        if (searchQuery && !searchQuery.value && preFilledQuery) searchQuery.value = preFilledQuery;
        if (usernameFilter && !usernameFilter.value && preFilledUser) usernameFilter.value = preFilledUser;
        if (channelFilter && !channelFilter.value && preFilledChannel) channelFilter.value = preFilledChannel;
        if (dateFrom && !dateFrom.value && preFilledDateFrom) dateFrom.value = preFilledDateFrom;
        if (dateTo && !dateTo.value && preFilledDateTo) dateTo.value = preFilledDateTo;

        // Determine if an auto-search should run
        const hasPreFilledData = preFilledQuery || preFilledUser || preFilledChannel || preFilledDateFrom || preFilledDateTo;

        if (hasPreFilledData) {
            console.log("aaa")
            console.log(`Pre-filled search parameters detected. Triggering automatic search.`);
            currentSearchQuery = searchQuery ? searchQuery.value : ''; // Ensure currentSearchQuery is set
            // Pass true for isInitialLoad, no targetPage needed
            searchMessages(true);
        }

        // --- Scroll URL Update Listener ---
        // Use throttle from utils.js
        const throttledUpdateUrl = throttle(updateUrlWithScrollState, 300);
        window.addEventListener('scroll', throttledUpdateUrl);

        // --- Lazy Loading Scroll Listener ---
        // Setup initial listener (will be re-attached after search)
        setupLazyLoading();

        // --- Share Button Event Listener ---
        if (shareSearchButton) {
            shareSearchButton.addEventListener('click', handleShareSearch);
        }

        // Event listener for the old usernames info icon
        const oldUsernamesInfoIcon = document.getElementById('old-usernames-info-icon');
        if (oldUsernamesInfoIcon) {
            oldUsernamesInfoIcon.addEventListener('click', () => {
                const modal = document.getElementById('search-warning-modal');
                const modalTitle = modal.querySelector('#modal-title');
                const modalMessage = modal.querySelector('#modal-message');
                const modalButtons = modal.querySelector('.modal-buttons');
                const closeButton = modal.querySelector('.close-button'); // Ensure we can re-attach listener if needed

                // Get translated tooltip text
                const tooltipTextElement = document.getElementById('old-usernames-tooltip-translation');
                const tooltipText = tooltipTextElement ? tooltipTextElement.textContent : 'Bu seçenek ile kullanıcının eski nicklerinin mesajlarını da görebilirsiniz.'; // Fallback

                if (modalTitle) modalTitle.textContent = 'Bilgi'; // Or use a translation key
                if (modalMessage) modalMessage.textContent = tooltipText;
                
                // Hide all original buttons in the .modal-buttons div
                if (modalButtons) {
                    Array.from(modalButtons.children).forEach(button => button.style.display = 'none');
                    
                    // Check if an "OK" button for this specific info modal already exists
                    let infoOkButton = modalButtons.querySelector('.info-modal-ok-button');
                    if (!infoOkButton) {
                        infoOkButton = document.createElement('button');
                        infoOkButton.textContent = document.getElementById('ok-button-translation')?.textContent || 'Tamam';
                        infoOkButton.className = 'info-modal-ok-button'; // Add a class to identify it
                        infoOkButton.style.display = 'inline-block';
                        modalButtons.appendChild(infoOkButton);
                    }
                    infoOkButton.style.display = 'inline-block'; // Ensure it's visible
                    infoOkButton.onclick = () => modal.style.display = 'none';
                }

                // Ensure the main close button (X) works
                if (closeButton && !closeButton.dataset.infoModalListenerAttached) {
                    closeButton.onclick = () => modal.style.display = 'none';
                    closeButton.dataset.infoModalListenerAttached = 'true'; // Mark that we've set its behavior for this context
                }
                // Also handle click outside modal
                window.onclick = function(event) {
                    if (event.target == modal) {
                        modal.style.display = "none";
                    }
                }

                modal.style.display = 'block';
            });
        }

    } // End if(searchPage)
});

// --- Search Functions ---


// --- WebSocket Result Handlers ---
function handleSearchResult(data) {
     if (queueModal) queueModal.style.display = 'none';
    const hits = data.hits || [];
    console.log('[FRONTEND] Received search result:', data);

    // Hide the main loading spinner
    if (loading) loading.style.display = 'none';
    isLoading = false;

    // Update global totalResults ONLY if it's the first request (cursor is null)
    if (currentCursor === null) {
        totalResults = data.total;
        console.log(`Total results set to: ${totalResults}`);
    }

    // Update cursor and hasMoreResults based on the response
    currentCursor = data.nextCursor;
    hasMoreResults = !!currentCursor;
    console.log(`Results loaded. Hits: ${hits.length}. Next Cursor: ${JSON.stringify(currentCursor)}. HasMoreResults: ${hasMoreResults}`);

    // Render the newly fetched page items (append)
    renderPageItems(hits);

    // Update UI elements that depend on the final results
    updateResultsCount();
    checkAndAddLoadMoreIndicator();
    if (shareSearchButton) {
        shareSearchButton.style.display = totalResults > 0 ? 'inline-block' : 'none';
    }

    // Display no-results message if container is still empty
    if (totalResults === 0 && chatMessages && !chatMessages.hasChildNodes()) {
        chatMessages.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Aramanıza uygun sonuç bulunamadı.</p>
                <p>Farklı anahtar kelimeler veya daha geniş filtreler kullanmayı deneyin.</p>
            </div>
        `;
    }
     checkAndScrollToTarget();
}
function checkAndScrollToTarget() {
    if (!targetTimestampToScroll || isLoading) {
        return; // Hedef yok veya zaten yeni sayfa yükleniyor
    }

    // Hedeflenen zaman damgasına en yakın mesajı bulmaya çalış
    let closestElement = null;
    let smallestDiff = Infinity;
    const allMessages = chatMessages.querySelectorAll('[data-timestamp]');

    allMessages.forEach(el => {
        const ts = new Date(el.getAttribute('data-timestamp')).getTime();
        const diff = Math.abs(ts - targetTimestampToScroll);
        if (diff < smallestDiff) {
            smallestDiff = diff;
            closestElement = el;
        }
    });

    // Eğer 5 saniye toleransla bir eşleşme bulursak, oraya kaydır ve işlemi bitir
    if (closestElement && smallestDiff < 5000) {
        console.log(`Hedef mesaj bulundu, kaydırılıyor...`);
        closestElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // İsteğe bağlı: bulunan mesajı vurgula
        setTimeout(() => closestElement.classList.add('highlighted-message'), 500); 
        targetTimestampToScroll = null; // Görev tamamlandı
        return;
    }

    // Eğer eşleşme bulunamadıysa ve daha fazla sonuç varsa
    if (hasMoreResults && allMessages.length > 0) {
        const lastMessageTimestamp = new Date(allMessages[allMessages.length - 1].getAttribute('data-timestamp')).getTime();
        
        // Eğer sayfadaki son mesaj bile hedefimizden daha yeniyse, daha fazla yüklememiz gerekir
        if (lastMessageTimestamp > targetTimestampToScroll) {
            console.log(`Hedef bu sayfada değil. Daha fazla sonuç yükleniyor...`);
            loadMoreResults(); // Otomatik olarak bir sonraki sayfayı yükle
        } else {
            // Hedef zaman damgasını geçtik, muhtemelen sonuçlarda yok. Aramayı durdur.
            console.log(`Hedef zaman damgası geçildi. Arama durduruluyor.`);
            targetTimestampToScroll = null;
        }
    } else {
        // Yüklenecek başka sonuç yok
        targetTimestampToScroll = null;
    }
}

//hata oldugunde tum chati silen kisim
function handleSearchError2(data) {
    console.error('Search error received:', data.error);
    if (queueModal) queueModal.style.display = 'none';

    if (loading) loading.style.display = 'none';
    isLoading = false;

    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="no-results error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${data.error || 'Arama sırasında bir hata oluştu.'}</p>
            </div>
        `;
    }
    if (resultsCount) resultsCount.textContent = 'Sonuç yüklenemedi.';
    totalResults = 0;
    hasMoreResults = false;
    checkAndAddLoadMoreIndicator();
    if (shareSearchButton) shareSearchButton.style.display = 'none';
}
function handleSearchError(data) {
    console.error('Search error received:', data.error);
    if (queueModal) queueModal.style.display = 'none';

    if (loading) loading.style.display = 'none';
    isLoading = false;

    const errorMessage = data.error || 'Arama sırasında bir hata oluştu.';

    // Check if there are already results on the page
    if (chatMessages && chatMessages.children.length > 0) {
        // Error occurred during "load more"
        hasMoreResults = false; // Stop further loading attempts
        checkAndAddLoadMoreIndicator(); // Remove the loading spinner

        // Add a specific error indicator at the bottom
        const existingError = document.getElementById('loading-error');
        if (existingError) existingError.remove();

        const errorIndicator = document.createElement('div');
        errorIndicator.id = 'loading-error';
        errorIndicator.className = 'no-more-results error-indicator'; // Use similar styling
        errorIndicator.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorMessage}`;
        chatMessages.appendChild(errorIndicator);

    } else {
        // Error occurred on the initial search
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="no-results error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${errorMessage}</p>
                </div>
            `;
        }
        if (resultsCount) resultsCount.textContent = 'Sonuç yüklenemedi.';
        totalResults = 0;
        hasMoreResults = false;
        checkAndAddLoadMoreIndicator();
        if (shareSearchButton) shareSearchButton.style.display = 'none';
    }
}

function updateResultsCount() {
    const lng = document.documentElement.lang || 'tr';
    const t = window.i18next
      ? (key, vars) => window.i18next.t(key, vars)
      : (key, vars) => {
          const map = {
            'search.results.none': document.getElementById('search-results-none-translation')?.textContent || 'Sonuç bulunamadı.',
            'search.results.one': document.getElementById('search-results-one-translation')?.textContent || '1 sonuç bulundu.',
            'search.results.at_least': document.getElementById('search-results-at-least-translation')?.textContent || 'En az {count} sonuç bulundu.',
            'search.results.exact': document.getElementById('search-results-exact-translation')?.textContent || '{count} sonuç bulundu.',
            'search.results.unknown': document.getElementById('search-results-unknown-translation')?.textContent || 'Sonuç sayısı bilinmiyor.'
          };
          let str = map[key] || key;
          if (vars) {
            Object.keys(vars).forEach(k => {
              str = str.replace(`{${k}}`, vars[k]);
            });
          }
          return str;
        };
    
    if (resultsCount) {
      if (totalResults === 0) {
        resultsCount.textContent = t('search.results.none');
      } else if (totalResults === 1) {
        resultsCount.textContent = t('search.results.one');
      } else if (hasMoreResults) {
        resultsCount.textContent = t('search.results.at_least', {
          count: totalResults.toLocaleString(lng)
        });
      } else {
        resultsCount.textContent = typeof totalResults === 'number'
          ? t('search.results.exact', { count: totalResults.toLocaleString(lng) })
          : t('search.results.unknown');
      }
    }
}


// Main function to initiate search
async function searchMessages(isInitialLoad = false) { // Removed targetPage parameter
    searchInitiated = true; // Mark that a search has started
    // Ensure DOM elements are assigned
    if (!chatMessages) chatMessages = document.getElementById('chat-messages');
    if (!loading) loading = document.getElementById('loading');
    const usernameFilter = document.getElementById('username-filter');
    const channelFilter = document.getElementById('channel-filter');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    const resultsInfo = document.getElementById('results-info');
    const resultsCount = document.getElementById('results-count');
    const searchWarningModal = document.getElementById('search-warning-modal'); // For rate limit
    const shareSearchButton = document.getElementById('share-search-button'); // Get share button reference

    // Prevent starting a new search if one is already in progress
    if (isLoading || !chatMessages) {
        console.log("Search skipped: isLoading=", isLoading);
        return;
    }

    isLoading = true; // Set loading flag for the entire operation
    //if (loading) loading.style.display = 'block';
    // Show the queue modal instead of the simple spinner
if (queueModal) {
    queuePositionText.textContent = ''; // Reset position text
    const waitingText = document.getElementById('search-queueModalWaiting-translation')?.textContent || 'Aramanız sıraya alınıyor...';
    queueModalMessage.textContent = waitingText;
    queueModal.style.display = 'block';
}

    if (chatMessages) chatMessages.innerHTML = ''; // Clear previous results ONCE
    // if (pagination) pagination.innerHTML = ''; // Pagination removed
    displayedEventIds.clear(); // Clear displayed IDs for new search

    // Reset state for a new search
    currentCursor = null; // Reset cursor
    hasMoreResults = true; // Assume more results initially
    currentChannelEvents = []; // Clear previous channel events on new search
    currentOldUsernames = []; // Her yeni aramada sıfırla

    try {
        const includeOldUsernamesCheckbox = document.getElementById('search-old-usernames');
        const shouldIncludeOldUsernames = includeOldUsernamesCheckbox ? includeOldUsernamesCheckbox.checked : false;
        // usernameFilter global değişkenini kullanalım, DOM'dan tekrar çekmeye gerek yok.
        const usernameFromFilterValue = usernameFilter ? usernameFilter.value.trim() : '';

        if (shouldIncludeOldUsernames && usernameFromFilterValue) {
            try {
                console.log(`Eski kullanıcı adları getiriliyor: ${usernameFromFilterValue}`);
                const historyResponse = await fetch(`/api/user/${encodeURIComponent(usernameFromFilterValue)}/username-history`);
                if (historyResponse.ok) {
                    const historyData = await historyResponse.json();
                    if (historyData.success && historyData.data) {
                        currentOldUsernames = historyData.data.map(item => item.username);
                        console.log('Aramaya dahil edilecek eski kullanıcı adları:', currentOldUsernames);
                    } else {
                        console.warn('Eski kullanıcı adları alınamadı veya parse edilemedi:', historyData.message);
                    }
                } else {
                    console.warn(`Eski kullanıcı adları API hatası: ${historyResponse.status}`);
                }
            } catch (error) {
                console.error('Eski kullanıcı adları getirilirken hata:', error);
            }
        }

        // Get CSRF token
        const csrfTokenInput = document.querySelector('#search-form input[name="_csrf"]');
        const csrfToken = csrfTokenInput ? csrfTokenInput.value : null;
        if (!csrfToken) throw new Error("CSRF token not found.");

        // Get filter values
        const username = usernameFilter ? usernameFilter.value.trim().replace(/_/g, '-') : '';
        const channelName = "crydercs";
        let fromDateISO = null;
        let toDateISO = null;

        if (dateFrom && dateFrom.value) {
            try { fromDateISO = new Date(dateFrom.value).toISOString(); } catch (e) { console.warn("Invalid From Date:", dateFrom.value); }
        }
        if (dateTo && dateTo.value) {
            try { toDateISO = new Date(dateTo.value).toISOString(); } catch (e) { console.warn("Invalid To Date:", dateTo.value); }
        }

        // Update search header
        updateSearchHeader(currentSearchQuery, username, channelName);

        // Fetch channel events ONCE if channel is specified
        if (channelName) {
            try {
                console.log(`Fetching events for channel: ${channelName}`);
                currentChannelEvents = await fetchChannelEvents(channelName);
                console.log(`Fetched ${currentChannelEvents.length} events.`);
            } catch (error) {
                console.error("Failed to fetch initial channel events:", error);
                currentChannelEvents = []; // Ensure it's empty on error
            }
        } else {
            currentChannelEvents = []; // Clear events if no channel filter
        }

        // --- Queue the search job ---
        console.log("Queuing search job...");
        const response = await queueSearchJob(); 

        if (response && response.success && response.jobId) {
            // Eğer ilk pozisyon bilgisi geldiyse, modal'ı hemen güncelle
            if (response.initialPosition) {
                updateLoadingMessage({ status: 'waiting', position: response.initialPosition });
            }
            // Job was queued successfully. Start polling for status.
            console.log("Job queued. Starting to poll for status. Job ID:", response.jobId);
            startPolling(response.jobId);
        } else {
            // This block will be triggered if queuing fails.
            if (loading) loading.style.display = 'none';
            isLoading = false;
            if (chatMessages && !chatMessages.hasChildNodes()) {
                chatMessages.innerHTML = `
                    <div class="no-results error">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>${response.error || 'Arama işi sıraya alınamadı.'}</p>
                    </div>
                `;
            }
            if (resultsCount) resultsCount.textContent = 'Hata.';
        }

        // Update browser history immediately after queuing
        if (!isInitialLoad) {
            updateBrowserHistory(currentSearchQuery, username, channelName, dateFrom ? dateFrom.value : null, dateTo ? dateTo.value : null);
        }

        // Note: We don't call a lot of the UI update functions here anymore.
        // They will be called in handleSearchResult when the data arrives.
        // We also don't reset isLoading here; it will be reset in the WebSocket handlers.

           } catch (error) {
        if (queueModal) queueModal.style.display = 'none';
        console.error('Overall Search error (queuing phase):', error);
        isLoading = false;

        // Çeviri fonksiyonunu hazırla (i18next yoksa varsayılan metni kullanır)
        const t = (key, fallback) => {
            const element = document.getElementById(key.replace(/\./g, '-') + '-translation');
            if (element && element.textContent) return element.textContent;
            if (window.i18next) return window.i18next.t(key, fallback);
            return fallback;
        };

        // Modal elementlerini al
        const modal = document.getElementById('search-warning-modal');
        const modalTitle = modal.querySelector('#modal-title');
        const modalMessage = modal.querySelector('#modal-message');
        const modalButtons = modal.querySelector('.modal-buttons');

        // Modal başlığını ayarla
        if (modalTitle) {
            modalTitle.textContent = t('common.error', 'Hata');
        }

        // Hata mesajını ayarla
        if (modalMessage) {
            // Eğer API'den özel bir hata mesajı geldiyse onu kullan, yoksa genel hata mesajını göster
            modalMessage.textContent = error.isApiError ? error.message : t('common.somethingWentWrong', 'Bir şeyler ters gitti. Lütfen daha sonra tekrar deneyin.');
        }

        // Butonları ayarla (sadece "Tamam" butonu)
        if (modalButtons) {
            Array.from(modalButtons.children).forEach(button => button.style.display = 'none');
            
            let okButton = modalButtons.querySelector('.info-modal-ok-button');
            if (!okButton) {
                okButton = document.createElement('button');
                okButton.className = 'info-modal-ok-button';
                modalButtons.appendChild(okButton);
            }
            okButton.textContent = t('common.ok', 'Tamam');
            okButton.style.display = 'inline-block';
            okButton.onclick = () => modal.style.display = 'none';
        }
        
        // Modalı göster
        modal.style.display = 'block';
    }


    // The 'finally' block is removed because isLoading is now managed by the WebSocket handlers.
}

// Render messages and relevant events for a specific page
function renderPageItems2(pageMessages) {
    // Ensure DOM element is available
    if (!chatMessages) chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error("Chat messages container not found!");
        return;
    }
    if (!pageMessages || pageMessages.length === 0) {
        console.log("No messages to render for this page.");
        checkAndAddLoadMoreIndicator(); // Update indicator even if no messages
        return;
    }

    // 1. Determine time range of this page's messages
    let minTimestamp = new Date(pageMessages[pageMessages.length - 1].created_at);
    let maxTimestamp = new Date(pageMessages[0].created_at);
     // Ensure min/max are correct even if messages aren't perfectly sorted initially
     pageMessages.forEach(msg => {
         const msgTime = new Date(msg.created_at);
         if (msgTime < minTimestamp) minTimestamp = msgTime;
         if (msgTime > maxTimestamp) maxTimestamp = msgTime;
     });
    console.log(`Rendering page. Time range: ${minTimestamp.toISOString()} to ${maxTimestamp.toISOString()}`);


    // 2. Filter relevant events from the stored list
    const relevantEvents = currentChannelEvents.filter(event => {
        const eventTime = new Date(event.created_at);
        return eventTime >= minTimestamp && eventTime <= maxTimestamp;
    });
    console.log(`Found ${relevantEvents.length} relevant events for this page.`);


    // 3. Combine page messages and relevant events
    const messagesWithType = pageMessages.map(msg => ({ ...msg, itemType: 'message' }));
    const eventsWithType = relevantEvents.map(evt => ({ ...evt, itemType: evt.type }));
    const combinedItems = [...messagesWithType, ...eventsWithType];

    // 4. Sort the combined list for this page (descending)
    combinedItems.sort((a, b) => {
        let dateA = new Date(a.created_at);
        let dateB = new Date(b.created_at);

        // Handle invalid dates: push them towards the end (older)
        const validA = !isNaN(dateA.getTime());
        const validB = !isNaN(dateB.getTime());

        if (!validA && !validB) return 0; // Both invalid, keep original order relative to each other
        if (!validA) return 1;  // Invalid A is "older" than valid B
        if (!validB) return -1; // Valid A is "newer" than invalid B

        // Both dates are valid, compare them
        return dateB - dateA; // Descending order (newest first)
    });

    // 5. Create fragment and append items, checking displayedEventIds
    const fragment = document.createDocumentFragment();
    combinedItems.forEach(item => {
        const itemId = (item.itemType === 'message')
            ? (item.id || `msg_${item.created_at}_${item.username}`)
            : getEventUniqueId(item); // Use existing function for event IDs

        // Only add if not already displayed
        if (!displayedEventIds.has(itemId)) {
            let element = null;
            if (item.itemType === 'message') {
               
                element = createMessageElement(item);
            
            } else {
                // Pass the original event object (without itemType) to creation function
                const { itemType, ...originalEvent } = item;
                 if (originalEvent && originalEvent.type) {
                     element = createEventElement(originalEvent);
                 } else {
                      console.warn("Skipping event item due to missing type:", item);
                 }
            }

            if (element) {
                fragment.appendChild(element);
                displayedEventIds.add(itemId); // Mark as displayed
            }
        } else {
             // console.log(`Skipping already displayed item: ${itemId}`); // Optional debug
        }
    });

    // 6. Append the fragment for this page to the container
    chatMessages.appendChild(fragment);
    checkAndAddLoadMoreIndicator(); // Add/update the loading/end indicator
}
function renderPageItems(pageMessages) {
    // Ensure DOM element is available
    if (!chatMessages) chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error("Chat messages container not found!");
        return;
    }
    if (!pageMessages || pageMessages.length === 0) {
        console.log("No messages to render for this page.");
        checkAndAddLoadMoreIndicator(); // Update indicator even if no messages
        return;
    }

    const fragment = document.createDocumentFragment();
    pageMessages.forEach(message => {
        const itemId = message.id || `msg_${message.created_at}_${message.username}`;

        // Only add if not already displayed
        if (!displayedEventIds.has(itemId)) {
            const element = createMessageElement(message);
            if (element) {
                fragment.appendChild(element);
                displayedEventIds.add(itemId); // Mark as displayed
            }
        } else {
             // console.log(`Skipping already displayed item: ${itemId}`); // Optional debug
        }
    });

    // Append the fragment for this page to the container
    chatMessages.appendChild(fragment);
    checkAndAddLoadMoreIndicator(); // Add/update the loading/end indicator
}


// Create HTML element for a single chat message
function createMessageElement2423(message) {
console.log("asdasdasdsadasda232")
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.setAttribute('data-timestamp', message.created_at); // Store ISO timestamp

    const channelName = message.channel_slug || 'unknown-channel';
    const channelProfilePic = message.channel_profilepic;
    const timestamp = new Date(message.created_at);
    const localTimeStr = formatLocalDateTime(timestamp); // Use utility function
    const userColor = message.color || '#FFFFFF';
    let messageContent = message.content || '';
    messageContent = parseEmotes(messageContent); // Use utility function
    const isDeleted = message.deleted === true;
    const isAIModerated = message.ai_moderated === true;
    const username = message.username || 'Anonim'; // Get username - Ensure this is defined if used in userHtml

    if (isDeleted) {
        messageElement.classList.add('deleted-message');
    }

    // Channel link
    let channelHtml = `
        <div class="message-channel-inline">
            ${channelProfilePic ? `<img src="${channelProfilePic}" alt="${channelName}" class="channel-avatar-inline">` : ''}
            <a href="/streamer/${channelName}" title="${channelName}">${channelName}</a>
        </div>`;
    
    // User link (assuming badgesHtml and userHtml are intended for the message-body)
    // let userHtml = `<a href="/kick-profile/${encodeURIComponent(username)}" style="color: ${userColor}; text-decoration: none;" class="message-user-link">${username}</a>`;
    // let badgesHtml = renderBadges(message.badges);


    let replyHtml = '';
    if (message.reply_to_message_id) {
        const replyToUsername = message.reply_to_username || 'User';
        // Assuming message.reply_to_content might contain emotes, parse them.
        // Also, ensure parseEmotes is available in this scope or is a global utility.
        const replyToContentText = message.reply_to_content ? parseEmotes(message.reply_to_content) : '';

        replyHtml = `
            <div class="message-reply">
                <i class="fas fa-reply message-reply-icon"></i>
                <span class="reply-to-user">${replyToUsername}:</span>
                ${replyToContentText ? `<span class="reply-content-text"> ${replyToContentText}</span>` : ''}
            </div>`;
    }

    let statusHtml = '';
    if (isDeleted) {
        statusHtml = `<div class="message-status"><i class="fas fa-ban"></i> ${isAIModerated ? 'AI Moderasyonuyla Silindi' : 'Silindi'}</div>`;
    }

    // Set the main structure of the message element first
    // The original code had message.username in message-user div, let's ensure it's correctly placed
    // Also, badges were part of the original structure, so they should be included if renderBadges and message.badges exist
    let badgesHtmlContent = '';
    if (typeof renderBadges === 'function' && message.badges) {
        badgesHtmlContent = renderBadges(message.badges);
    }
    let userHtmlContent = `<a href="/kick-profile/${encodeURIComponent(username)}" style="color: ${userColor}; text-decoration: none;" class="message-user-link">${username}</a>`;


    messageElement.innerHTML = `
        ${channelHtml}
        <div class="message-time" title="${timestamp.toLocaleString()}">
            ${localTimeStr}
        </div>
        <div class="message-body">
            <div class="message-user" style="color: ${userColor}">${badgesHtmlContent} ${userHtmlContent}</div>
            <div class="message-content ${isDeleted ? 'deleted-content' : ''}">${messageContent || '<i style="color: #ADADB8;">(boş mesaj)</i>'}</div>
        </div>
        ${replyHtml}
        ${statusHtml}
    `;

    // Add broadcast info icon and functionality programmatically
    // The icon is added if message.id is present, as it's needed for the API call.
    
    console.log(message.id)
    if (message.id) { 
        const timeDiv = messageElement.querySelector('.message-time');
        if (timeDiv) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'broadcast-info-icon';
            iconSpan.title = 'Yayın Bilgisini Göster'; // Tooltip for the icon
            iconSpan.style.cursor = 'pointer';
            iconSpan.style.marginLeft = '8px'; // Add some spacing
            iconSpan.innerHTML = '<i class="fas fa-info-circle"></i>';

            iconSpan.addEventListener('click', async (event) => {
                event.stopPropagation(); // Prevent triggering other click events

                if (iconSpan.classList.contains('loading-details')) return; // Prevent multiple clicks

                iconSpan.classList.add('loading-details');
                iconSpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Loading indicator

                try {
                    // Fetch ALL broadcast details on demand
                    // Pass channel_id and created_at from the message object to avoid extra DB lookups on the backend
                    // More explicit check for null, undefined, or empty string
                 
                    if (message.channel_id == null || String(message.channel_id).trim() === "" || message.created_at == null || String(message.created_at).trim() === "") {
                        console.error("Message object is missing channel_id or created_at, or they are empty. channel_id:", message.channel_id, "created_at:", message.created_at);
                        alert('Yayın detayları için gerekli bilgi eksik (kanal ID veya zaman bilgisi bulunamadı).');
                        iconSpan.classList.remove('loading-details');
                        iconSpan.innerHTML = '<i class="fas fa-info-circle"></i>'; // Reset icon
                        return;
                    }
                    const response = await fetch(`/api/message/${message.id}/broadcast-details?channelId=${encodeURIComponent(String(message.channel_id).trim())}&createdAt=${encodeURIComponent(String(message.created_at).trim())}`);
                    
                    let fetchedBroadcastTitle = '';
                    let fetchedBroadcastStartTime = '';
                    let fetchedTimeIntoBroadcast = '';

                    if (response.ok) {
                        const detailsData = await response.json();
                        fetchedBroadcastTitle = detailsData.broadcast_title || '';
                        fetchedBroadcastStartTime = detailsData.broadcast_start_time || '';
                        fetchedTimeIntoBroadcast = detailsData.time_into_broadcast || '';
                    } else {
                        console.error(`API error fetching broadcast details: ${response.status}`);
                        alert('Yayın detayları yüklenirken bir hata oluştu.');
                        iconSpan.classList.remove('loading-details');
                        iconSpan.innerHTML = '<i class="fas fa-info-circle"></i>'; // Reset icon
                        return;
                    }

                    const t = window.i18next ? (key, options) => window.i18next.t(key, options) : (key, options) => options.defaultValue || key;

                    const titleLabel = t('broadcastDetails.titleLabel', { defaultValue: 'Title:' });
                    const startTimeLabel = t('broadcastDetails.startTimeLabel', { defaultValue: 'Start:' });
                    const timeIntoBroadcastLabel = t('broadcastDetails.timeIntoBroadcastLabel', { defaultValue: 'Time Into Broadcast:' });
                    
                    let modalDetails = [];
                    if (fetchedBroadcastTitle) modalDetails.push(`${titleLabel} ${fetchedBroadcastTitle}`);
                    if (fetchedBroadcastStartTime) modalDetails.push(`${startTimeLabel} ${formatLocalDateTime(new Date(fetchedBroadcastStartTime))}`);
                    if (fetchedTimeIntoBroadcast) modalDetails.push(`${timeIntoBroadcastLabel} ${fetchedTimeIntoBroadcast}`);

                    const modalElement = searchWarningModal; 
                    if (modalElement) {
                        const modalTitleElement = modalElement.querySelector('#modal-title');
                        const modalMessageElement = modalElement.querySelector('#modal-message');
                        const modalLoginButton = modalElement.querySelector('#modal-login-button');
                        const modalUpgradeButton = modalElement.querySelector('#modal-upgrade-button');
                        const modalWatchAdButton = modalElement.querySelector('#modal-watch-ad-button');
                        const modalDeclineButton = modalElement.querySelector('#modal-decline-button'); 

                        const okText = t('common.ok', { defaultValue: 'OK' });
                        const broadcastDetailsTitleText = t('broadcastDetails.modalTitle', { defaultValue: 'Broadcast Details' });
                        const notFoundMessage = t('broadcastDetails.notFound', { defaultValue: 'No broadcast details found for this message.' });

                        if (modalTitleElement) modalTitleElement.textContent = broadcastDetailsTitleText;

                        if (modalDetails.length > 0) {
                            if (modalMessageElement) modalMessageElement.innerHTML = modalDetails.join('<br>');
                        } else {
                            if (modalMessageElement) modalMessageElement.textContent = notFoundMessage;
                        }

                        if (modalLoginButton) modalLoginButton.style.display = 'none';
                        if (modalUpgradeButton) modalUpgradeButton.style.display = 'none';
                        if (modalWatchAdButton) modalWatchAdButton.style.display = 'none';

                        if (modalDeclineButton) {
                            modalDeclineButton.textContent = okText;
                            modalDeclineButton.style.display = 'inline-block';
                            modalDeclineButton.onclick = () => modalElement.style.display = 'none';
                        }
                        modalElement.style.display = 'block';
                    } else {
                        // Fallback to alert if modal is not found (should ideally not happen)
                        if (modalDetails.length > 0) {
                            alert(modalDetails.join('\n'));
                        } else {
                            alert(notFoundMessage);
                        }
                    }

                } catch (error) {
                    console.error("Error fetching or processing broadcast details:", error);
                    const t = window.i18next ? (key, options) => window.i18next.t(key, options) : (key, options) => options.defaultValue || key;
                    const modalElement = searchWarningModal;

                    if (modalElement) {
                        const modalTitleElement = modalElement.querySelector('#modal-title');
                        const modalMessageElement = modalElement.querySelector('#modal-message');
                        const modalLoginButton = modalElement.querySelector('#modal-login-button');
                        const modalUpgradeButton = modalElement.querySelector('#modal-upgrade-button');
                        const modalWatchAdButton = modalElement.querySelector('#modal-watch-ad-button');
                        const modalDeclineButton = modalElement.querySelector('#modal-decline-button');
                        
                        const okText = t('common.ok', { defaultValue: 'OK' });
                        const errorTitleText = t('common.error', { defaultValue: 'Error' });
                        const errorLoadingMessage = t('broadcastDetails.errorLoading', { defaultValue: 'An error occurred while loading broadcast details.' });

                        if (modalTitleElement) modalTitleElement.textContent = errorTitleText;
                        if (modalMessageElement) modalMessageElement.textContent = errorLoadingMessage;
                        
                        if (modalLoginButton) modalLoginButton.style.display = 'none';
                        if (modalUpgradeButton) modalUpgradeButton.style.display = 'none';
                        if (modalWatchAdButton) modalWatchAdButton.style.display = 'none';
                        
                        if (modalDeclineButton) {
                            modalDeclineButton.textContent = okText;
                            modalDeclineButton.style.display = 'inline-block';
                            modalDeclineButton.onclick = () => modalElement.style.display = 'none';
                        }
                        modalElement.style.display = 'block';
                    } else {
                        alert(t('broadcastDetails.errorLoading', { defaultValue: 'An error occurred while loading broadcast details.' }));
                    }
                } finally {
                    iconSpan.classList.remove('loading-details');
                    iconSpan.innerHTML = '<i class="fas fa-info-circle"></i>'; // Reset icon
                }
            });
            timeDiv.appendChild(iconSpan);
        }
    }

    return messageElement;
}

// --- Event Element Creation ---

// Generic function to create event elements based on type
function createEventElement(event) {
    switch (event.type) {
        case 'host': return createHostElement(event);
        case 'poll': return createPollElement(event);
        case 'pinned': return createPinnedMessageElement(event);
        case 'room_setting': return createRoomSettingElement(event);
        default:
            console.warn("Unknown event type:", event.type, event);
            return null;
    }
}

// Create element for Host events
function createHostElement(hostEvent) {
    const element = document.createElement('div');
    element.className = 'chat-event host-event';
    const localTimeStr = formatUTCToLocal(hostEvent.created_at); // Use utility
    element.setAttribute('data-timestamp', hostEvent.created_at); // Store ISO

    const viewerCount = hostEvent.number_viewers || 0;
    const message = hostEvent.optional_message || '';

    element.innerHTML = `
        <div class="event-time">${localTimeStr}</div>
        <div class="event-icon"><i class="fas fa-share-alt"></i></div>
        <div class="event-content">
            <strong>${hostEvent.host_username || 'Bilinmeyen Kanal'}</strong> yayını
            <span class="event-viewers">${viewerCount} izleyici</span> ile host etti.
            ${message ? `<div class="event-message">"${message}"</div>` : ''}
        </div>`;
    return element;
}

// Create element for Poll events
function createPollElement(pollEvent) {
    const element = document.createElement('div');
    element.className = 'chat-event poll-event';
    const localTimeStr = formatUTCToLocal(pollEvent.created_at); // Use utility
    element.setAttribute('data-timestamp', pollEvent.created_at); // Store ISO

    let optionsData = processPollOptions(pollEvent.options); // Helper below
    let optionsHtml = '';
    optionsData.options.forEach((option, i) => {
        const votes = optionsData.votes[i] || 0;
        const percent = optionsData.totalVotes ? Math.round((votes / optionsData.totalVotes) * 100) : 0;
        optionsHtml += `
            <div class="poll-option">
                <div class="poll-option-text">
                    <span class="option-name">${option}</span>
                    <span class="option-result">${votes} oy (${percent}%)</span>
                </div>
                <div class="poll-option-bar"><div class="poll-option-progress" style="width: ${percent}%"></div></div>
            </div>`;
    });

    const pollStartTime = new Date(pollEvent.created_at);
    const pollEndTime = new Date(pollStartTime.getTime() + (pollEvent.duration * 1000));
    const isActive = pollEndTime > new Date();
    const statusText = isActive ? 'Aktif' : 'Tamamlandı';
    const statusClass = isActive ? 'active' : 'completed';

    element.innerHTML = `
        <div class="event-time">${localTimeStr}</div>
        <div class="event-icon"><i class="fas fa-poll"></i></div>
        <div class="event-content">
            <div class="poll-header">
                <div class="poll-title">${pollEvent.title || 'Başlıksız Anket'}</div>
                <div class="poll-status ${statusClass}">${statusText}</div>
            </div>
            <div class="poll-options">${optionsHtml}</div>
            <div class="poll-footer">
                <span class="poll-total">${optionsData.totalVotes} toplam oy</span>
                <span class="poll-duration">Süre: ${formatDuration(pollEvent.duration)}</span>
            </div>
        </div>`;
    return element;
}

// Create element for Pinned Message events
function createPinnedMessageElement(pinnedEvent) {
    const element = document.createElement('div');
    element.className = 'chat-event pinned-event';
    const localTimeStr = formatUTCToLocal(pinnedEvent.created_at); // Use utility
    element.setAttribute('data-timestamp', pinnedEvent.created_at); // Store ISO

    let messageContent = pinnedEvent.content || '';
    messageContent = parseEmotes(messageContent); // Use utility

    const pinStartTime = new Date(pinnedEvent.created_at);
    const pinEndTime = pinnedEvent.duration ? new Date(pinStartTime.getTime() + (pinnedEvent.duration * 1000)) : null;
    const isActive = !pinnedEvent.deleted_at && (!pinEndTime || pinEndTime > new Date());
    const statusText = isActive ? 'Sabitlendi' : 'Artık Sabitli Değil';
    const statusClass = isActive ? 'active' : 'inactive';

    element.innerHTML = `
        <div class="event-time">${localTimeStr}</div>
        <div class="event-icon"><i class="fas fa-thumbtack"></i></div>
        <div class="event-content">
            <div class="pinned-header">
                <div class="pinned-status ${statusClass}">${statusText}</div>
                <div class="pinned-by">Sabitleyen: ${pinnedEvent.pinned_by_username || 'Bilinmeyen'}</div>
            </div>
            <div class="pinned-message">
                <div class="message-user">${pinnedEvent.sender_username || 'Anonim'}:</div>
                <div class="message-content">${messageContent}</div>
            </div>
        </div>`;
    return element;
}

// Create element for Room Setting change events
function createRoomSettingElement(settingEvent) {
    const element = document.createElement('div');
    element.className = 'chat-event settings-event';
    const localTimeStr = formatUTCToLocal(settingEvent.created_at); // Use utility
    element.setAttribute('data-timestamp', settingEvent.created_at); // Store ISO

    let settingIcon = 'fa-cog';
    let settingText = '';
    let settingClass = settingEvent.enabled ? 'enabled' : 'disabled';

    switch(settingEvent.setting_type) {
        case 'sub_only':
            settingIcon = 'fa-star';
            settingText = settingEvent.enabled ? 'Abone-Modu etkinleştirildi' : 'Abone-Modu devre dışı bırakıldı';
            break;
        case 'follower_only':
            settingIcon = 'fa-user-plus';
            settingText = settingEvent.enabled
                ? `Takipçi-Modu etkinleştirildi (min. takip süresi: ${settingEvent.value ? `${settingEvent.value} dakika` : 'varsayılan'})`
                : 'Takipçi-Modu devre dışı bırakıldı';
            break;
        case 'slow_mode':
            settingIcon = 'fa-clock';
            settingText = settingEvent.enabled
                ? `Yavaş Mod etkinleştirildi (${settingEvent.value || 'varsayılan'} saniye aralık)`
                : 'Yavaş Mod devre dışı bırakıldı';
            break;
        case 'emote_only':
            settingIcon = 'fa-smile';
            settingText = settingEvent.enabled ? 'Emote-Modu etkinleştirildi' : 'Emote-Modu devre dışı bırakıldı';
            break;
        case 'account_age_mode':
            settingIcon = 'fa-user-clock';
             settingText = settingEvent.enabled
                ? `Hesap Yaş Sınırlaması etkinleştirildi (min. yaş: ${settingEvent.value ? `${settingEvent.value} gün` : 'varsayılan'})`
                : 'Hesap Yaş Sınırlaması devre dışı bırakıldı';
            break;
        case 'allow_link':
             settingIcon = 'fa-link';
             settingText = settingEvent.enabled ? 'Link Paylaşımı etkinleştirildi' : 'Link Paylaşımı devre dışı bırakıldı';
             break;
        default:
            settingText = `Oda ayarı değiştirildi: ${settingEvent.setting_type}`;
            settingClass = ''; // No specific class for unknown types
    }

    let moderatorInfo = settingEvent.changed_by_username ? `<strong>${settingEvent.changed_by_username}</strong> tarafından ` : '';

    element.innerHTML = `
        <div class="event-time">${localTimeStr}</div>
        <div class="event-icon"><i class="fas ${settingIcon}"></i></div>
        <div class="event-content">
            <div class="settings-info ${settingClass}">
                ${moderatorInfo}${settingText}
            </div>
        </div>`;
    return element;
}

// --- Helper Functions (Search Specific) ---

// Fetch channel events (hosts, polls, pinned messages, settings)
async function fetchChannelEvents(channelName) {
    if (!channelName) return [];
    try {
        const [hostsRes, pollsRes, pinnedRes, settingsRes] = await Promise.all([
            fetch(`/api/streamer/${channelName}/hosts`).catch(e => { console.error('Host fetch failed:', e); return { ok: false }; }),
            fetch(`/api/streamer/${channelName}/polls`).catch(e => { console.error('Poll fetch failed:', e); return { ok: false }; }),
            fetch(`/api/streamer/${channelName}/pinned-messages`).catch(e => { console.error('Pinned fetch failed:', e); return { ok: false }; }),
            fetch(`/api/streamer/${channelName}/room-settings`).catch(e => { console.error('Settings fetch failed:', e); return { ok: false }; })
        ]);

        const hostsData = hostsRes.ok ? await hostsRes.json() : { hosts: [] };
        const pollsData = pollsRes.ok ? await pollsRes.json() : { polls: [] };
        const pinnedData = pinnedRes.ok ? await pinnedRes.json() : { pinnedMessages: [] };
        const settingsData = settingsRes.ok ? await settingsRes.json() : { roomSettings: [] };

        // Combine and add type property
        return [
            ...(hostsData.hosts || []).map(h => ({ ...h, type: 'host' })),
            ...(pollsData.polls || []).map(p => ({ ...p, type: 'poll' })),
            ...(pinnedData.pinnedMessages || []).map(p => ({ ...p, type: 'pinned' })),
            ...(settingsData.roomSettings || []).map(s => ({ ...s, type: 'room_setting' }))
        ];
    } catch (error) {
        console.error("Error fetching channel events:", error);
        return []; // Return empty array on error
    }
}


// Generate a unique ID for an event or message to prevent duplicates
function getEventUniqueId(event) {
    let idParts = [event.type || 'message'];
    if (event.id) idParts.push(event.id);
    else if (event.message_id) idParts.push(event.message_id); // For pinned messages referencing original
    else if (event.type === 'host') idParts.push(`host_${event.host_username}_${event.created_at}`);
    else if (event.type === 'poll') idParts.push(`poll_${event.title}_${event.created_at}`);
    else if (event.type === 'pinned') idParts.push(`pinned_${event.sender_username}_${event.created_at}`);
    else if (event.type === 'room_setting') idParts.push(`setting_${event.setting_type}_${event.created_at}`);
    else idParts.push(`unknown_${event.created_at}`); // Fallback
    return idParts.join('_');
}

// Helper to parse poll options from various potential formats
function processPollOptions(options) {
    let parsedOptions = [];
    let votes = [];
    let totalVotes = 0;
    try {
        let data = options;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { console.error("Poll JSON parse error:", e); data = null; }
        }
        if (!data) return { options: ["Veri yok"], votes: [0], totalVotes: 0 };

        if (Array.isArray(data)) {
            data.forEach(opt => {
                if (typeof opt === 'object' && opt !== null) {
                    let label = opt.label || opt.text || opt.name || `Seçenek ${parsedOptions.length + 1}`;
                    if (label === '[object Object]') label = `Seçenek ${parsedOptions.length + 1}`;
                    let voteCount = parseInt(opt.votes || opt.count || 0, 10);
                    if (isNaN(voteCount)) voteCount = 0;
                    parsedOptions.push(label);
                    votes.push(voteCount);
                    totalVotes += voteCount;
                } else {
                    parsedOptions.push(String(opt));
                    votes.push(0);
                }
            });
        } else if (typeof data === 'object' && data !== null) {
            // Handle object-based options if necessary (adjust based on actual data structure)
             console.warn("Unhandled object format for poll options:", data);
             parsedOptions = ["Bilinmeyen format"];
             votes = [0];
        } else {
             parsedOptions = ["Veri yok"];
             votes = [0];
        }
        if (parsedOptions.length === 0) {
             parsedOptions = ["Veri yok"];
             votes = [0];
        }
    } catch (e) {
        console.error('Poll options processing error:', e);
        return { options: ["Veri hatası"], votes: [0], totalVotes: 0 };
    }
    return { options: parsedOptions, votes, totalVotes };
}

// Update the search header information
function updateSearchHeader(query, username, channelName) {
    const searchHeader = document.getElementById('search-header');
    if (!searchHeader) return;
    let headerHTML = '';
    if (query) headerHTML += `<p>Searching for logs containing: <span class="search-info">${query}</span></p>`;
    if (username) headerHTML += `<p>Searching for logs from: <span class="search-info">${username}</span></p>`;
    if (channelName) headerHTML += `<p>Searching logs from: <span class="search-info"><a href="https://kick.com/${channelName}" target="_blank" rel="noopener noreferrer">kick.com/${channelName}</a></span></p>`;
    searchHeader.innerHTML = headerHTML;
}

// --- Lazy Loading ---

function setupLazyLoading() {
    window.removeEventListener('scroll', handleScroll); // Remove previous listener if any
    window.addEventListener('scroll', handleScroll); // Add new listener
}

function handleScroll() {
    // Only handle scroll for lazy loading if a search has been initiated
    if (!searchInitiated || isLoading || !hasMoreResults) return;
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    // Load more when nearing the bottom (e.g., last 300px)
    if (scrollTop + clientHeight >= scrollHeight - 300) {
        loadMoreResults();
    }
}


async function loadMoreResults() {
    // Prevent multiple simultaneous loads
    if (isLoading || !hasMoreResults) return;

    isLoading = true;
    console.log(`Lazy loading next results using cursor: ${JSON.stringify(currentCursor)}...`);

    // Show a loading indicator at the bottom
    const loadingMoreElement = document.getElementById('loading-more');
    if (loadingMoreElement) loadingMoreElement.style.display = 'block';

    try {
        // ÖNEMLİ: currentCursor'ı parametre olarak gönderiyoruz
        const response = await queueSearchJob(currentCursor); 

        if (response && response.success && response.jobId) {
            // Eğer ilk pozisyon bilgisi geldiyse, modal'ı hemen güncelle
            if (response.initialPosition) {
                updateLoadingMessage({ status: 'waiting', position: response.initialPosition });
            }
            // Job was queued successfully. Start polling for status.
            console.log("Load more job queued. Polling for status. Job ID:", response.jobId);
            startPolling(response.jobId);
                } else {
            // This block will be triggered if queuing fails.
            if (queueModal) queueModal.style.display = 'none'; // Bu satırı ekleyin
            if (loading) loading.style.display = 'none';
            isLoading = false;
            if (chatMessages && !chatMessages.hasChildNodes()) {
                chatMessages.innerHTML = `
                    <div class="no-results error">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>${response.error || 'Arama işi sıraya alınamadı.'}</p>
                    </div>
                `;
            }
            if (resultsCount) resultsCount.textContent = 'Hata.';
        }

    } catch (error) {
        console.error("Error in loadMoreResults:", error);
        isLoading = false; // Reset loading state on error
        if (loadingMoreElement) loadingMoreElement.style.display = 'none'; // Hide indicator
    }
    // isLoading will be reset to false in handleSearchResult or handleSearchError
}





// Add/Update the "Loading More" or "All Results Shown" indicator
function checkAndAddLoadMoreIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    // Remove existing indicators first
    const existingLoading = document.getElementById('loading-more');
    const existingNoMore = document.getElementById('no-more-results');
    const existingError = document.getElementById('loading-error');
    if (existingLoading) existingLoading.remove();
    if (existingNoMore) existingNoMore.remove();
    if (existingError) existingError.remove(); // Remove error if we are adding a new indicator

      if (hasMoreResults) {
        const loadingMoreElement = document.createElement('div');
        loadingMoreElement.id = 'loading-more';
        loadingMoreElement.className = 'loading-more';
        // Sıra numarasını göstermek için bir span ekledik
        loadingMoreElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span id="loading-more-text">Daha fazla sonuç yükleniyor...</span>';
        loadingMoreElement.style.display = 'none'; // Initially hidden, shown by loadMoreResults
        chatMessages.appendChild(loadingMoreElement);
    }  else if (totalResults > 0) { // Only show "all results" if there were results initially
        const noMoreResultsElement = document.createElement('div');
        noMoreResultsElement.id = 'no-more-results';
        noMoreResultsElement.className = 'no-more-results';
        noMoreResultsElement.innerHTML = '<i class="fas fa-check-circle"></i> Tüm sonuçlar görüntülendi.';
        chatMessages.appendChild(noMoreResultsElement);
    }
}

// --- Pagination (Removed) ---
// Pagination controls are no longer needed with infinite scroll + cursor


// --- Autocomplete ---

function setupChannelAutocomplete() {
    const channelInput = document.getElementById('channel-filter');
    if (!channelInput) return;

    const parent = channelInput.parentNode;
    // Ensure container doesn't already exist
    let autocompleteContainer = parent.querySelector('.autocomplete-container');
    if (!autocompleteContainer) {
        autocompleteContainer = document.createElement('div');
        autocompleteContainer.className = 'autocomplete-container';
        parent.replaceChild(autocompleteContainer, channelInput);
        autocompleteContainer.appendChild(channelInput);
    }


    // Ensure results container doesn't already exist
    let resultsContainer = autocompleteContainer.querySelector('.autocomplete-results');
     if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'autocomplete-results';
        resultsContainer.style.display = 'none';
        autocompleteContainer.appendChild(resultsContainer);
     }


    channelInput.addEventListener('input', () => {
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = setTimeout(() => {
            const query = channelInput.value.trim();
            if (query.length >= 2) {
                fetchAutocompleteSuggestions(query, resultsContainer);
            } else {
                resultsContainer.style.display = 'none';
                autocompleteResults = [];
                selectedAutocompleteIndex = -1;
            }
        }, 300); // Debounce
    });

    channelInput.addEventListener('focus', () => {
        if (channelInput.value.trim().length >= 2 && autocompleteResults.length > 0) {
            resultsContainer.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!autocompleteContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });

    channelInput.addEventListener('keydown', (e) => {
        if (resultsContainer.style.display === 'none' || autocompleteResults.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, autocompleteResults.length - 1);
                updateSelectedItem(resultsContainer);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, -1); // Allow -1 to deselect
                updateSelectedItem(resultsContainer);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedAutocompleteIndex >= 0 && selectedAutocompleteIndex < autocompleteResults.length) {
                    selectAutocompleteItem(autocompleteResults[selectedAutocompleteIndex], channelInput);
                    resultsContainer.style.display = 'none';
                } else {
                    // If Enter is pressed without a selection, trigger search with current input value
                     searchForm.requestSubmit(); // Programmatically submit the form
                }
                break;
            case 'Escape':
                e.preventDefault();
                resultsContainer.style.display = 'none';
                break;
        }
    });
}

async function fetchAutocompleteSuggestions(query, resultsContainer) {
    try {
        const response = await fetch(`/api/channels/autocomplete?term=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Suggestions fetch failed');
        const data = await response.json();
        autocompleteResults = data || []; // Ensure it's an array
        renderAutocompleteResults(query, autocompleteResults, resultsContainer);
        resultsContainer.style.display = autocompleteResults.length > 0 ? 'block' : 'none';
        selectedAutocompleteIndex = -1; // Reset selection
    } catch (error) {
        console.error('Autocomplete error:', error);
        resultsContainer.innerHTML = `<div class="autocomplete-notice error"><i class="fas fa-exclamation-circle"></i> Öneriler yüklenemedi.</div>`;
        resultsContainer.style.display = 'block';
        autocompleteResults = [];
    }
}

function renderAutocompleteResults(query, results, container) {
    container.innerHTML = ''; // Clear previous results
    if (results.length === 0) {
        container.innerHTML = `<div class="autocomplete-notice">Sonuç bulunamadı</div>`;
        return;
    }
    results.forEach((item, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'autocomplete-item';
        resultItem.dataset.index = index;

        const imageHtml = item.image
            ? `<img src="${item.image}" alt="${item.label}" class="autocomplete-item-image">`
            : `<div class="autocomplete-item-placeholder">${item.label.charAt(0).toUpperCase()}</div>`;

        const highlightedLabel = highlightMatch(item.label, query); // Helper below

        resultItem.innerHTML = `
            ${imageHtml}
            <div class="autocomplete-item-info">
                <div class="autocomplete-item-label">${highlightedLabel}</div>
            </div>`;

        resultItem.addEventListener('click', () => {
            selectAutocompleteItem(item, document.getElementById('channel-filter'));
            container.style.display = 'none';
        });
        container.appendChild(resultItem);
    });
}

function updateSelectedItem(container) {
    const items = container.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
        if (index === selectedAutocompleteIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

function selectAutocompleteItem(item, input) {
    if (input && item) {
        input.value = item.label; // Use label (channel name) for the input value
        // Optionally store chatroom_id if needed elsewhere, e.g., on a data attribute
        // input.dataset.chatroomId = item.chatroom_id;
    }
    selectedAutocompleteIndex = -1; // Reset selection index
}


function highlightMatch(text, query) {
    if (!query || !text) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return text;
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    return `${before}<span class="autocomplete-highlight">${match}</span>${after}`;
}

// --- URL and History Management ---

function updateBrowserHistory(query, username, channelName, dateFromVal, dateToVal) {

    let newPath = '/search';
    // Add segments, using '_' as placeholder for empty values
    newPath += `/${encodeURIComponent(query || '_')}`;
    newPath += `/${encodeURIComponent(username || '_')}`;
    newPath += `/${encodeURIComponent(channelName || '_')}`;
    newPath += `/${dateFromVal ? encodeURIComponent(dateFromVal) : '_'}`;
    newPath += `/${dateToVal ? encodeURIComponent(dateToVal) : '_'}`;

    // Preserve essential query parameters (like lng, stats)
    const currentUrl = new URL(window.location);
    const paramsToKeep = ['stats', 'lng']; // Add any other params to preserve
    const preservedParams = new URLSearchParams();
    paramsToKeep.forEach(param => {
        if (currentUrl.searchParams.has(param)) {
            preservedParams.set(param, currentUrl.searchParams.get(param));
        }
    });
    const preservedParamsString = preservedParams.toString();
    if (preservedParamsString) {
        newPath += `?${preservedParamsString}`;
    }

    // Use pushState to update URL and add to history
    const state = { query, username, channelName, dateFrom: dateFromVal, dateTo: dateToVal };
    try {
        history.pushState(state, '', newPath);
        console.log("History updated:", newPath);
    } catch (error) {
        console.error("Error updating browser history:", error);
    }
}


// Function to update the URL with scroll state (page and top timestamp) using replaceState
function updateUrlWithScrollState() {
    console.log("imdaaaat")
    const chatMessages = document.getElementById('chat-messages');
    if (isLoading || !chatMessages || chatMessages.children.length === 0) return;

    const topTimestamp = getTopmostVisibleElementTimestamp();
    if (!topTimestamp) return; // Only update if we have a valid timestamp

    try {
        const currentUrl = new URL(window.location);
        const basePath = currentUrl.pathname; // Keep the existing path /search/q/u/c/f/t

        // Preserve essential non-scroll query parameters
        const paramsToKeep = ['stats', 'lng']; // Add others if needed
        const preservedParams = new URLSearchParams();
        paramsToKeep.forEach(param => {
            if (currentUrl.searchParams.has(param)) {
                preservedParams.set(param, currentUrl.searchParams.get(param));
            }
        });

        // Convert ISO string to Unix timestamp (milliseconds) before using it
        const topTimestampUnix = new Date(topTimestamp).getTime();
        if (isNaN(topTimestampUnix)) {
            console.warn("Could not convert ISO timestamp to Unix timestamp:", topTimestamp);
            return; // Don't update URL if conversion fails
        }

        // Add scroll state parameter (only timestamp needed now)
        // preservedParams.set('scrollPage', currentPage); // Removed page number
        preservedParams.set('scrollTopTs', topTimestampUnix);

        const newSearchString = preservedParams.toString();
        const newUrlString = `${basePath}${newSearchString ? '?' + newSearchString : ''}`;

        // Use replaceState to update URL without adding new history entry
        if (window.location.href !== newUrlString) {
            history.replaceState(history.state, '', newUrlString);
            // console.log("Scroll state updated in URL:", newUrlString); // Optional logging
        }
    } catch (error) {
        console.error("Error updating URL with scroll state:", error);
    }
}

// Function to find the timestamp of the topmost visible message/event
function getTopmostVisibleElementTimestamp() {
    const chatMessagesContainer = document.getElementById('chat-messages');
    if (!chatMessagesContainer || chatMessagesContainer.children.length === 0) {
        return null;
    }

    let highestVisibleElement = null;
    let smallestTopValue = Infinity; // Smallest rect.top found for a visible element

    for (const element of chatMessagesContainer.children) {
        const rect = element.getBoundingClientRect();

        // Check if the element is at least partially visible in the viewport
        // rect.top < window.innerHeight: Element's top is above the viewport bottom
        // rect.bottom > 0: Element's bottom is below the viewport top
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible) {
            // If this element is higher than the previous highest, update
            if (rect.top < smallestTopValue) {
                smallestTopValue = rect.top;
                highestVisibleElement = element;
            }
        }
    }

    // Return the ISO string timestamp from data attribute of the highest visible element
    return highestVisibleElement ? highestVisibleElement.getAttribute('data-timestamp') : null;
}


// Function to scroll to a specific timestamp from URL parameter
function scrollToTimestampFromUrl2() {
    const urlParams = new URLSearchParams(window.location.search);
    const scrollTopTs = urlParams.get('scrollTopTs');
    if (!scrollTopTs) return;

    const targetUnixTs = parseInt(scrollTopTs);
    if (isNaN(targetUnixTs)) {
        console.warn("Invalid scrollTopTs in URL:", scrollTopTs);
        return;
    }

    const MAX_ATTEMPTS = 50;
    const DELAY_MS = 400;
    let attempts = 0;

    const tryScrollToTarget = async () => {
        const messages = document.querySelectorAll('.chat-message');
        for (const msg of messages) {
            const tsStr = msg.getAttribute('data-timestamp');
            const ts = Date.parse(tsStr);
            if (!isNaN(ts) && ts === targetUnixTs) {
                console.log("🎯 Found and scrolling to:", tsStr);
                msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return true;
            }
        }

        // Hedef yoksa aşağı kay ve yeni sayfa yükle
        window.scrollBy(0, 500);

        if (typeof fetchAndAppendResults === 'function') {
            const success = await fetchAndAppendResults(); // async yükleme
            await new Promise(resolve => setTimeout(resolve, DELAY_MS)); // DOM render bekle
        }

        return false;
    };

    const pollScrollRestore = async () => {
        while (attempts < MAX_ATTEMPTS) {
            const found = await tryScrollToTarget();
            if (found) return;
            attempts++;
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
        console.warn("❌ Failed to scroll to timestamp after max attempts.");
    };

    pollScrollRestore();
}




// --- Rate Limit Handling ---

async function queueSearchJob(cursor = null) {
    try {
        const csrfTokenInput = document.querySelector('#search-form input[name="_csrf"]');
        const csrfToken = csrfTokenInput ? csrfTokenInput.value : null;
        if (!csrfToken) throw new Error("CSRF token not found.");

        const usernameFilter = document.getElementById('username-filter');
        const channelFilter = document.getElementById('channel-filter');
        const dateFrom = document.getElementById('date-from');
        const dateTo = document.getElementById('date-to');

        let username = usernameFilter ? usernameFilter.value.trim() : '';
        const channelName = channelFilter ? channelFilter.value.trim() : '';
        let fromDateISO = null;
        let toDateISO = null;

        if (dateFrom && dateFrom.value) {
            try { fromDateISO = new Date(dateFrom.value).toISOString(); } catch (e) { console.warn("Invalid From Date:", dateFrom.value); }
        }
        if (dateTo && dateTo.value) {
            try { toDateISO = new Date(dateTo.value).toISOString(); } catch (e) { console.warn("Invalid To Date:", dateTo.value); }
        }

        const payload = {
            query: currentSearchQuery,
            username: username,
            channelName: channelName,
            dateFrom: fromDateISO,
            dateTo: toDateISO,
            oldUsernames: currentOldUsernames,
            cursor: cursor
        };

        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
             // 429 Rate Limit hatasını özel olarak ele al
            if (response.status === 429) {
                handleRateLimitError();
                // Bu özel durum için boş bir promise döndürerek searchMessages'daki catch'e düşmesini engelle
                return new Promise(() => {}); 
            }
            // Eğer yanıt başarılı değilse (4xx, 5xx), JSON'u oku ve özel bir hata fırlat
            const errorData = await response.json().catch(() => ({ error: `API error: ${response.status}` }));
            const error = new Error(errorData.error);
            error.isApiError = true; // Bu hatanın API'den geldiğini belirtmek için bir işaretçi
            throw error;
        }

        return await response.json();

    } catch (error) {
        // Hata zaten yukarıda oluşturuldu veya bir ağ hatası oluştu.
        // Sadece konsola yazdırıp bir üst fonksiyona tekrar fırlat.
        console.error('Error in queueSearchJob:', error.message);
        throw error;
    }
}


let pollingTimeout = null;
let isPolling = false;

function startPolling(jobId) {
    stopPolling();
    isPolling = true;

    const poll = async () => {
        if (!isPolling) return;

        try {
            const response = await fetch(`/api/search/status/${jobId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Job ${jobId} not found. It may have expired. Stopping poll.`);
                    handleSearchError({ error: 'Arama sonucu zaman aşımına uğradı.' });
                    stopPolling();
                    return;
                }
                throw new Error(`Status check failed: ${response.status}`);
            }

            const result = await response.json();
            updateLoadingMessage(result);
            updateLoadMoreIndicator(result);

            if (result.status === 'completed') {
                stopPolling();
                handleSearchResult(result.data);
            } else if (result.status === 'failed') {
                stopPolling();
                handleSearchError(result);
            } else {
                // Schedule the next poll only after this one is complete
                pollingTimeout = setTimeout(poll, 2000); // Wait 2 seconds before next request
            }
        } catch (error) {
            console.error('Polling error:', error);
            stopPolling();
            handleSearchError({ error: 'Sonuç durumu kontrol edilirken bir hata oluştu.' });
        }
    };

    poll(); // Start the first poll
}

function stopPolling() {
    isPolling = false;
    if (pollingTimeout) {
        clearTimeout(pollingTimeout);
        pollingTimeout = null;
    }
}

function updateLoadingMessage(status) {
    if (!queueModal || !queueModalMessage || !queuePositionText) return;

    const proSuggestion = document.getElementById('queue-pro-suggestion');

    switch (status.status) {
        case 'waiting':
            const waitingText = document.getElementById('search-queueModalWaiting-translation')?.textContent || 'Aramanız sırada bekliyor.';
            let positionText = document.getElementById('search-queueModalPosition-translation')?.textContent || 'Sıradaki yeriniz: {position}';
            positionText = positionText.replace('{position}', status.position);
            queueModalMessage.textContent = waitingText;
            queuePositionText.textContent = positionText;

            if (proSuggestion) {
                const userRole = document.body.dataset.userRole || 'guest';
                const isProOrAdmin = userRole === 'pro' || userRole === 'admin';
                proSuggestion.style.display = isProOrAdmin ? 'none' : 'block';
            }
            break;
        case 'active':
            const activeText = document.getElementById('search-queueModalActive-translation')?.textContent || 'Aramanız şu anda işleniyor...';
            queueModalMessage.textContent = activeText;
            queuePositionText.textContent = ''; // Clear position text
            if (proSuggestion) {
                proSuggestion.style.display = 'none'; // Hide suggestion when active
            }
            break;
        default:
            // Do nothing for other states like 'completed' or 'failed' as the modal will be hidden
            return;
    }
}
function updateLoadMoreIndicator(status) {
    const loadingMoreText = document.getElementById('loading-more-text');
    if (!loadingMoreText) return;

    const t = (key, fallback) => {
        const element = document.getElementById(key.replace(/\./g, '-') + '-translation');
        if (element && element.textContent) return element.textContent;
        if (window.i18next) return window.i18next.t(key, fallback);
        return fallback;
    };

    switch (status.status) {
        case 'waiting':
            let positionText = t('search.queueModalPosition', 'Sıradaki yeriniz: {position}');
            positionText = positionText.replace('{position}', status.position);
            loadingMoreText.textContent = positionText;
            break;
        case 'active':
            loadingMoreText.textContent = t('search.queueModalActive', 'Aramanız şu anda işleniyor...');
            break;
        default:
            loadingMoreText.textContent = t('search.loadingMore', 'Daha fazla sonuç yükleniyor...');
            break;
    }
}


// This function is now called when a 429 is received.
// It directly shows the combined modal.
function handleRateLimitError() {
    console.log("Rate limit hit. Showing combined rate limit modal.");
    if (queueModal) queueModal.style.display = 'none'; // Bu satırı ekleyin
    isLoading = false; // Arama durumunu sıfırlayın
    showCombinedRateLimitModal(); // Directly call the combined modal function
}



// Combined function to show the rate limit modal with dynamic buttons/messages
function showCombinedRateLimitModal() {
    const modalElement = searchWarningModal; // Use the globally defined variable
    if (!modalElement) {
        console.error("Search warning modal not found!");
        alert("Search limit reached."); // Basic fallback alert
        return;
    }

    // Get elements within the modal
    const modalTitleElement = modalElement.querySelector('#modal-title');
    const modalMessageElement = modalElement.querySelector('#modal-message');
    const modalLoginButton = modalElement.querySelector('#modal-login-button');
    const modalUpgradeButton = modalElement.querySelector('#modal-upgrade-button');
    const modalWatchAdButton = modalElement.querySelector('#modal-watch-ad-button');
    const modalDeclineButton = modalElement.querySelector('#modal-decline-button');

    // Get user status from body data attributes
    const isLoggedIn = document.body.dataset.isLoggedIn === 'true';
    const userRole = document.body.dataset.userRole || 'guest';
    const canWatchAd = true; // Assume ads are always possible for now

    // Get translations
    const rateLimitTitle = document.getElementById('rate-limit-title-translation')?.textContent || 'Rate Limit Exceeded';
    const genericMsg = document.getElementById('rate-limit-message-translation')?.textContent || 'Too many requests. Please wait and try again.';
    const guestMsg = document.getElementById('rate-limit-message-guest-translation')?.textContent || "You've hit the rate limit. Please log in for a higher limit (25 searches/hour).";
    const userMsg = document.getElementById('rate-limit-message-user-translation')?.textContent || "You've reached your hourly search limit. Upgrade to Pro for unlimited searches.";
    const rewardMsg = document.getElementById('reward-message-translation')?.textContent || 'Watch a short ad to get 3 extra searches?'; // Use the correct ID for the translated reward message
    const okText = document.getElementById('ok-button-translation')?.textContent || 'OK';
    const loginText = document.getElementById('login-button-translation')?.textContent || 'Login';
    const upgradeText = document.getElementById('upgrade-button-translation')?.textContent || 'Upgrade';
    const watchAdText = document.getElementById('watch-ad-button-translation')?.textContent || 'Watch Ad';
    const declineText = document.getElementById('decline-button-translation')?.textContent || 'No Thanks';
    const orText = document.getElementById('or-text-translation')?.textContent || 'or'; // Get the "or" translation
    // Get reward success translations (needed for grantReward modal display)
    const successTitle = document.getElementById('reward-success-title-translation')?.textContent || 'Success!';
    const successMessage = document.getElementById('reward-success-message-translation')?.textContent || 'You have earned 3 extra searches.';
    // okButton translation is already fetched as okText

    if (modalTitleElement) modalTitleElement.textContent = rateLimitTitle;

    // Hide all action buttons initially
    if (modalLoginButton) modalLoginButton.style.display = 'none';
    if (modalUpgradeButton) modalUpgradeButton.style.display = 'none';
    if (modalWatchAdButton) modalWatchAdButton.style.display = 'none';
    if (modalDeclineButton) modalDeclineButton.style.display = 'none';

    // --- Set Button Actions ---
    // Decline button always just closes the modal
    if (modalDeclineButton) {
        modalDeclineButton.textContent = declineText; // Set text
        modalDeclineButton.onclick = () => modalElement.style.display = 'none';
    }
    // Watch Ad button - Link to FluidPlayer initialization
    if (modalWatchAdButton) {
        modalWatchAdButton.textContent = watchAdText; // Set text
        modalWatchAdButton.onclick = () => {
            modalElement.style.display = 'none'; // Hide this modal first
            initializeAndPlayFluidAd(); // Call the new FluidPlayer function
        };
        // Visibility is controlled below based on user status
    }
    // Login and Upgrade buttons have fixed actions (set in DOMContentLoaded)

    // --- Show appropriate message and buttons based on user status ---
    // Check the data attribute on the body to see if ads are enabled
    const adsEnabled = document.body.dataset.adsEnabled === 'true';
    const showWatchAdOption = adsEnabled; // Only show if enabled via backend flag

    if (!isLoggedIn) {
        // Use the fetched 'orText' translation here
        if (modalMessageElement) modalMessageElement.textContent = guestMsg + (showWatchAdOption ? ` ${orText} ${rewardMsg}` : '');
        if (modalLoginButton) modalLoginButton.style.display = 'inline-block';
        if (showWatchAdOption && modalWatchAdButton) modalWatchAdButton.style.display = 'inline-block';
        if (modalDeclineButton) modalDeclineButton.style.display = 'inline-block';
    } else if (userRole === 'user') {
        // Use the fetched 'orText' translation here
        if (modalMessageElement) modalMessageElement.textContent = userMsg + (showWatchAdOption ? ` ${orText} ${rewardMsg}` : '');
        if (modalUpgradeButton) modalUpgradeButton.style.display = 'inline-block';
        if (showWatchAdOption && modalWatchAdButton) modalWatchAdButton.style.display = 'inline-block';
        if (modalDeclineButton) modalDeclineButton.style.display = 'inline-block';
    } else { // Pro users or other roles might still hit limits (e.g., API error simulation)
        if (modalMessageElement) modalMessageElement.textContent = genericMsg;
        // For Pro users, just show an "OK" button (using the decline button element)
        if (modalDeclineButton) {
            modalDeclineButton.textContent = okText; // Change text to OK
            modalDeclineButton.style.display = 'inline-block';
        }
        // Hide other buttons for Pro users
        if (modalLoginButton) modalLoginButton.style.display = 'none';
        if (modalUpgradeButton) modalUpgradeButton.style.display = 'none';
        if (modalWatchAdButton) modalWatchAdButton.style.display = 'none';
    }

    modalElement.style.display = 'block'; // Show the modal
}


// --- FluidPlayer Ad Integration ---

// Initialize and play the ad using FluidPlayer
function initializeAndPlayFluidAd() {
    console.log("Debug: Entering initializeAndPlayFluidAd function."); // Log entry

    if (!adContainerModal || !adPlayerContent || !adLoadingMessage || !adRewardMessage || !adErrorMessage) {
        console.error("Debug: FluidPlayer ad modal elements not found.");
        showCombinedRateLimitModal(); // Fallback to combined modal
        return;
    }
    console.log("Debug: Ad modal elements found."); // Log success

    // Ensure VAST URL is available (set in index.ejs)
    if (typeof window.vastAdUrl === 'undefined' || !window.vastAdUrl) {
         console.error("Debug: VAST ad URL (window.vastAdUrl) is not defined.");
         showCombinedRateLimitModal(); // Fallback
         return;
    }
    console.log("Debug: VAST ad URL found:", window.vastAdUrl); // Log success

    // Reset messages and player display
    console.log("Debug: Resetting ad modal messages and player display."); // Log reset
    // Show the prompt message immediately
    if (adLoadingMessage) {
        // Use the translation key set in index.ejs
        // adLoadingMessage.textContent = 'Reklamı başlatmak için videoyu oynatın'; // Text set in EJS now
        adLoadingMessage.style.display = 'block';
    }
    adRewardMessage.style.display = 'none';
    adErrorMessage.style.display = 'none';
    // adPlayerContent.style.display = 'none'; // Hide video tag initially - REMOVED, make visible before init

    // Show the ad container modal
    console.log("Debug: Displaying ad container modal."); // Log display
    adContainerModal.style.display = 'block';

    // Ensure previous player instance is disposed
    console.log("Debug: Cleaning up any previous FluidPlayer instance."); // Log cleanup
    cleanupFluidAd();

    // Add a small delay before initializing the player
    console.log("Debug: Setting timeout for FluidPlayer initialization (100ms).");

    // --- Ensure video element exists before initialization ---
    let playerElement = document.getElementById('fluid-ad-player');
    if (!playerElement) {
        console.warn("Debug: #fluid-ad-player not found. Recreating element.");
        const modalContent = adContainerModal.querySelector('.ad-modal-content');
        if (modalContent) {
            playerElement = document.createElement('video');
            playerElement.id = 'fluid-ad-player';
            playerElement.width = 640;
            playerElement.height = 360;
            // Insert before the manual play button if it exists, otherwise before reward message
            const manualPlayButton = document.getElementById('manual-ad-play-button');
            const rewardMessage = document.getElementById('ad-reward-message');
            const insertBeforeElement = manualPlayButton || rewardMessage;
            if (insertBeforeElement) {
                modalContent.insertBefore(playerElement, insertBeforeElement);
            } else {
                modalContent.appendChild(playerElement); // Fallback append
            }
            adPlayerContent = playerElement; // Update the reference
            console.log("Debug: Recreated #fluid-ad-player element.");
        } else {
            console.error("Debug: Cannot recreate player element, modal content not found.");
            adErrorMessage.textContent = "Error: Ad container structure missing.";
            adErrorMessage.style.display = 'block';
            adLoadingMessage.style.display = 'none';
            if (adContainerModal) adContainerModal.style.display = 'none';
            showCombinedRateLimitModal();
            return;
        }
    }
    // Ensure the (potentially recreated) element is visible
    playerElement.style.display = 'block';
    console.log("Debug: Set #fluid-ad-player display to block.");
    // --- End ensure element exists ---


    setTimeout(() => {
        console.log("Debug: Timeout finished, now initializing FluidPlayer.");
        // We already ensured playerElement exists above

        try {
            console.log("Debug: Attempting to initialize FluidPlayer with VAST URL:", window.vastAdUrl); // Log init attempt
            fluidPlayerInstance = fluidPlayer(
                playerElement.id, // Use the potentially recreated element's ID
                {
                layoutControls: {
                    // Customize controls as needed for ads
                    playButtonShowing: true, // Ensure default play button is potentially visible
                    playPauseAnimation: true, // Allow standard play animation
                    allowDownload: false,
                    controlBar: { // Ensure control bar is enabled
                        enabled: true,
                        autoHide: true,
                        animated: true
                    },
                    autoHide: true, // Auto-hide controls after a delay
                    // Consider hiding other controls during ad playback
                    // mute: false, // Allow user to mute?
                    // volume: true,
                    // timeline: false,
                    // fullscreen: false,
                },
                vastOptions: {
                    adList: [ // Existing adList structure retained
                        {
                            roll: 'preRoll', // Play immediately
                            vastTag: window.vastAdUrl
                            // Optional per-ad settings like adText, adTextPosition, adClickable can be added here if needed
                            // Optional per-ad settings like adText, adTextPosition, adClickable can be added here if needed
                        }
                    ],
                    // --- Restoring previously commented out options ---
                    skipButtonCaption: 'Skip ad in [seconds]',          // Default: 'Skip ad in [seconds]'
                    skipButtonClickCaption: 'Skip ad <span class="skip_button_icon"></span>', // Default: 'Skip ad <span class="skip_button_icon"></span>'
                    adText: 'Advertisement',                            // Default: null. Retained previous value.
                    adTextPosition: 'top left',                         // Default: 'top left'. Retained previous value.
                    adCTAText: 'Visit now!',                            // Default: 'Visit now!'
                    adCTATextPosition: 'bottom right',                  // Default: 'bottom right'
                    vastTimeout: 5000,                                  // Default: 5000 (milliseconds)
                    showPlayButton: false,                              // Default: false
                    maxAllowedVastTagRedirects: 3,                      // Default: 3
                    adClickable: true,                                  // Default: true
                    allowVPAID: false,                                  // Default: false
                    // --- End of restored options ---

                    // Enhanced vastAdvanced callbacks for debugging (kept for logging)
                    vastAdvanced: {
                        vastLoadedCallback: function() {
                            console.log('FluidPlayer Debug: vastLoadedCallback triggered.');
                            // Message is already set to the prompt in initializeAndPlayFluidAd
                            if (adLoadingMessage) {
                                adLoadingMessage.style.display = 'block'; // Ensure prompt is visible
                            }
                            console.log('FluidPlayer Debug: Player loaded, prompt should be visible.');
                            // Player controls should be enabled by default layoutControls setting
                            // We wait for the user to click the player's play button.
                        },
                        noVastVideoCallback: function() {
                            console.error('FluidPlayer Debug: noVastVideoCallback triggered.');
                            adErrorMessage.textContent = 'Sorry, no ad video was found in the response.';
                            adErrorMessage.style.display = 'block';
                            adLoadingMessage.style.display = 'none';
                            adPlayerContent.style.display = 'none'; // Hide player on error
                            originalSearchFunction = null; // Clear stored function on ad error
                            cleanupFluidAd();
                            setTimeout(() => {
                                if (adContainerModal) adContainerModal.style.display = 'none';
                                showCombinedRateLimitModal();
                            }, 2000);
                        },
                        vastVideoSkippedCallback: function() {
                            console.log('FluidPlayer Debug: vastVideoSkippedCallback triggered.');
                            adErrorMessage.textContent = 'Ad skipped. No reward granted.';
                            adErrorMessage.style.display = 'block';
                            adPlayerContent.style.display = 'none'; // Hide player on skip
                            originalSearchFunction = null; // Clear stored function on skip
                            cleanupFluidAd();
                            setTimeout(() => {
                                if (adContainerModal) adContainerModal.style.display = 'none';
                                showCombinedRateLimitModal();
                            }, 1500);
                        },
                        vastVideoEndedCallback: function() { // This signifies ad completion
                            console.log('FluidPlayer Debug: vastVideoEndedCallback triggered.');
                            adRewardMessage.style.display = 'block';
                            adPlayerContent.style.display = 'none'; // Hide player after completion
                            cleanupFluidAd();
                            setTimeout(() => {
                                if (adContainerModal) adContainerModal.style.display = 'none';
                                grantReward();
                            }, 1500);
                        }
                        // Consider adding a VAST error callback if the documentation confirms one exists for v3
                        // vastErrorCallback: function(event) { console.error('FluidPlayer Debug: vastErrorCallback triggered.', event); },
                    }
                }
            }
        );

        console.log("Debug: FluidPlayer initialization call completed."); // Log after init call
        console.log("Debug: FluidPlayer instance object:", fluidPlayerInstance); // Log the created instance

        // --- FluidPlayer Event Listeners ---
        // Add listener to hide prompt once playback starts
        if (fluidPlayerInstance) {
            fluidPlayerInstance.on('play', () => {
                console.log('FluidPlayer Debug: Play event triggered.');
                if (adLoadingMessage) {
                    adLoadingMessage.style.display = 'none'; // Hide prompt on play
                }
            });
            // Optional: Add listener for pause to potentially show prompt again? Might be annoying.
            // fluidPlayerInstance.on('pause', () => { ... });
        }
        // NOTE: Relying on vastAdvanced callbacks for ended, skipped, error.

        } catch (error) { // This catch corresponds to the try block starting above fluidPlayerInstance = fluidPlayer(...)
            console.error("Debug: Error during FluidPlayer initialization:", error); // Log init error
            adErrorMessage.textContent = "Error loading ad player.";
            adErrorMessage.style.display = 'block';
            adLoadingMessage.style.display = 'none';
            cleanupFluidAd();
            setTimeout(() => {
                if (adContainerModal) adContainerModal.style.display = 'none';
                showCombinedRateLimitModal();
            }, 2000); // Show rate limit modal after a delay
        }
    }, 100); // 100ms delay
}

// Clean up FluidPlayer instance
function cleanupFluidAd() {
    console.log("Cleaning up FluidPlayer ad resources.");
    if (fluidPlayerInstance) {
        try {
            fluidPlayerInstance.destroy();
            console.log("FluidPlayer instance destroyed.");
        } catch (e) {
            console.error("Error destroying FluidPlayer instance:", e);
        }
        fluidPlayerInstance = null;
    }
    // Reset state
    // originalSearchFunction = null; // Clear the stored function - MOVED TO grantReward/error paths
}

// --- Reward Granting ---

async function grantReward() {
    console.log("Attempting to grant reward...");
    try {
        // Get CSRF token
        const csrfTokenInput = document.querySelector('#search-form input[name="_csrf"]');
        const csrfToken = csrfTokenInput ? csrfTokenInput.value : null;
        if (!csrfToken) throw new Error("CSRF token not found for granting reward.");

        const response = await fetch('/api/user/grant-rewarded-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            // No body needed unless we need to pass specific info
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
            throw new Error(`API error ${response.status}: ${errorData.message || 'Unknown error granting reward'}`);
        }

        const data = await response.json();

        if (data.success) {
            console.log("Reward granted successfully!");

            // --- Show success message in modal ---
            const modalElement = searchWarningModal; // Reuse the existing modal
            if (modalElement) {
                const modalTitleElement = modalElement.querySelector('#modal-title');
                const modalMessageElement = modalElement.querySelector('#modal-message');
                const modalLoginButton = modalElement.querySelector('#modal-login-button');
                const modalUpgradeButton = modalElement.querySelector('#modal-upgrade-button');
                const modalWatchAdButton = modalElement.querySelector('#modal-watch-ad-button');
                const modalDeclineButton = modalElement.querySelector('#modal-decline-button'); // This will act as OK

                // Get translations
                const successTitle = document.getElementById('reward-success-title-translation')?.textContent || 'Success!';
                const successMessage = document.getElementById('reward-success-message-translation')?.textContent || 'You have earned 3 extra searches.';
                const okText = document.getElementById('ok-button-translation')?.textContent || 'OK';

                // Set modal content
                if (modalTitleElement) modalTitleElement.textContent = successTitle;
                if (modalMessageElement) modalMessageElement.textContent = successMessage;

                // Hide all buttons except the "OK" (decline) button
                if (modalLoginButton) modalLoginButton.style.display = 'none';
                if (modalUpgradeButton) modalUpgradeButton.style.display = 'none';
                if (modalWatchAdButton) modalWatchAdButton.style.display = 'none';
                if (modalDeclineButton) {
                    modalDeclineButton.textContent = okText; // Set text to OK
                    modalDeclineButton.style.display = 'inline-block';
                    // Ensure clicking OK closes the modal
                    modalDeclineButton.onclick = () => modalElement.style.display = 'none';
                }
                modalElement.style.display = 'block'; // Show the modal
            } else {
                 // Fallback alert if modal elements aren't found
                 alert("Başarılı! 3 ekstra arama hakkı kazandınız.");
            }
            // --- End modal display ---

            // Retry fetching results after reward grant
            // Directly call the current fetchAndAppendResults function to ensure
            // cursor logic is used, even if the rate limit happened before the update.
            console.log("Reward granted. Triggering fetch for next results...");
            fetchAndAppendResults(); // Directly call the correct function
            originalSearchFunction = null; // Clear the variable anyway

        } else {
            originalSearchFunction = null; // Clear if backend fails to grant
            throw new Error(data.message || 'Backend failed to grant reward.');
        }

    } catch (error) {
        console.error("Error granting reward:", error);
        alert(`Ödül verilirken bir hata oluştu: ${error.message}`);
        originalSearchFunction = null; // Clear on error
        // Show combined rate limit modal as a fallback if reward fails
        showCombinedRateLimitModal();
    } // finally block removed as clearing is handled in try/catch
}


// --- Realtime Timestamp Update (Optional - can be intensive) ---
/*
let timestampUpdateTimerID = null;
function startRealtimeTimestampUpdates() {
    stopRealtimeTimestampUpdates(); // Clear existing timer if any
    function updateAllTimestamps() {
        const timeElements = document.querySelectorAll('.message-time, .event-time');
        timeElements.forEach(element => {
            const container = element.closest('.chat-message, .chat-event');
            if (!container) return;
            const timestamp = container.getAttribute('data-timestamp');
            if (!timestamp) return;

            const messageDate = new Date(timestamp);
            if (isNaN(messageDate.getTime())) return; // Skip invalid dates

            const now = new Date();
            const diffMs = now - messageDate;
            let timeText;

            if (diffMs < 60000) timeText = 'Şimdi';
            else if (diffMs < 3600000) timeText = `${Math.floor(diffMs / 60000)} dk önce`;
            else if (diffMs < 86400000) timeText = `${Math.floor(diffMs / 3600000)} sa önce`;
            else if (diffMs < 172800000) { // Yesterday
                const hours = messageDate.getHours().toString().padStart(2, '0');
                const minutes = messageDate.getMinutes().toString().padStart(2, '0');
                timeText = `Dün ${hours}:${minutes}`;
            } else {
                timeText = formatLocalDateTime(messageDate); // Use standard format for older messages
            }
            element.textContent = timeText;
            element.title = messageDate.toLocaleString(); // Keep full date in title
        });
    }
    updateAllTimestamps(); // Initial update
    timestampUpdateTimerID = setInterval(updateAllTimestamps, 60000); // Update every minute
}

function stopRealtimeTimestampUpdates() {
    if (timestampUpdateTimerID) {
        clearInterval(timestampUpdateTimerID);
        timestampUpdateTimerID = null;
    }
}
// Call startRealtimeTimestampUpdates() after initial results load if desired
// window.addEventListener('beforeunload', stopRealtimeTimestampUpdates); // Cleanup on page leave
*/


// --- Badge SVGs ---
const SUB_GIFTER_SVGS = [
  // 1-4
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_162_470)"><g clip-path="url(#clip1_162_470)"><path d="M22.34 9.5L26 4H18L16 7L14 4H6L9.66 9.5H4V15.1H28V9.5H22.34Z" fill="#53FC18"></path><path d="M26.0799 19.0996H5.8999V28.4996H26.0799V19.0996Z" fill="#53FC18"></path><path d="M26.0799 15.0996H5.8999V19.0996H26.0799V15.0996Z" fill="#32970E"></path></g></g><defs><clipPath id="clip0_162_470"><rect width="24" height="24.5" fill="white" transform="translate(4 4)"></rect></clipPath><clipPath id="clip1_162_470"><rect width="24" height="24.5" fill="white" transform="translate(4 4)"></rect></clipPath></defs></svg>`,
  // 5-9
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><g clip-path="url(#clip0_31_3197)"><path d="M22.34 9.5L26 4H18L16 7L14 4H6L9.66 9.5H4V15.1H28V9.5H22.34Z" fill="#2EFAD1"></path><path d="M26.08 19.1001H5.90002V28.5001H26.08V19.1001Z" fill="#2EFAD1"></path><path d="M26.08 15.1001H5.90002V19.1001H26.08V15.1001Z" fill="#00A18D"></path></g><defs><clipPath id="clip0_31_3197"><rect width="24" height="24.5" fill="white" transform="translate(4 4)"></rect></clipPath></defs></svg>`,
  // 10-49
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><g clip-path="url(#clip0_31_3199)"><path d="M22.34 9.5L26 4H18L16 7L14 4H6L9.66 9.5H4V15.1H28V9.5H22.34Z" fill="#DEB2FF"></path><path d="M26.08 19.1001H5.90002V28.5001H26.08V19.1001Z" fill="#DEB2FF"></path><path d="M26.08 15.1001H5.90002V19.1001H26.08V15.1001Z" fill="#BC66FF"></path></g><defs><clipPath id="clip0_31_3199"><rect width="24" height="24.5" fill="white" transform="translate(4 4)"></rect></clipPath></defs></svg>`,
  // 50-99
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><g clip-path="url(#clip0_31_3196)"><path d="M22.34 9.5L26 4H18L16 7L14 4H6L9.66 9.5H4V15.1H28V9.5H22.34Z" fill="#FFD899"></path><path d="M26.08 19.1001H5.90002V28.5001H26.08V19.1001Z" fill="#FFD899"></path><path d="M26.08 15.1001H5.90002V19.1001H26.08V15.1001Z" fill="#FF9D00"></path></g><defs><clipPath id="clip0_31_3196"><rect width="24" height="24.5" fill="white" transform="translate(4 4)"></rect></clipPath></defs></svg>`,
  // 100-299
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path d="M30 10H2V28H30V10Z" fill="#B9D6F6"></path><path d="M12 10H10L6 4H14L16 7L18 4H26L22 10H20V28H12V10Z" fill="#72ACED"></path></svg>`,
  // 300-349
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path d="M30 10H2V28H30V10Z" fill="#FBCFD8"></path><path d="M12 10H10L6 4H14L16 7L18 4H26L22 10H20V28H12V10Z" fill="#F2708A"></path></svg>`,
  // 350-399
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path d="M30 10H2V28H30V10Z" fill="#FFD899"></path><path d="M12 10H10L6 4H14L16 7L18 4H26L22 10H20V28H12V10Z" fill="#FF9D00"></path></svg>`,
  // 400-499
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path d="M30 18H2V32H30V18Z" fill="#DDFED1"></path><path d="M30 8H2V14H30V8Z" fill="#DDFED1"></path><path d="M10 8H12.5V14H4V18H12.5V32H19.5V18H28V14H19.5V8H22L26 2H18L16 5L14 2H6L10 8Z" fill="#53FC18"></path></svg>`,
  // 500-599
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path d="M30 18H2V32H30V18Z" fill="#DEB2FF"></path><path d="M30 8H2V14H30V8Z" fill="#DEB2FF"></path><path d="M10 8H12.5V14H4V18H12.5V32H19.5V18H28V14H19.5V8H22L26 2H18L16 5L14 2H6L10 8Z" fill="#BC66FF"></path></svg>`,
  // 600-699
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path d="M30 18H2V32H30V18Z" fill="#FBCFD8"></path><path d="M30 8H2V14H30V8Z" fill="#FBCFD8"></path><path d="M10 8H12.5V14H4V18H12.5V32H19.5V18H28V14H19.5V8H22L26 2H18L16 5L14 2H6L10 8Z" fill="#F2708A"></path></svg>`,
  // 700-799
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path d="M30 18H2V32H30V18Z" fill="#FFD899"></path><path d="M30 8H2V14H30V8Z" fill="#FFD899"></path><path d="M10 8H12.5V14H4V18H12.5V32H19.5V18H28V14H19.5V8H22L26 2H18L16 5L14 2H6L10 8Z" fill="#FF9D00"></path></svg>`,
  // 800-999
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><g clip-path="url(#clip0_31_3220)"><path d="M0.02 6H32.02V14H0.02V6Z" fill="#53FC18"></path><path d="M0.02 18H32.02V32H0.02V18Z" fill="#53FC18"></path><path d="M30.02 14H2.02V18H30.02V14Z" fill="#32970E"></path><path d="M22.02 6H20.02V32H12.02V6H14.02L18.02 0H26.02L22.02 6Z" fill="#BC66FF"></path><path d="M14.02 6L16.02 3L14.02 0H6.02L10.02 6H12.02H14.02Z" fill="white"></path><path d="M3.02 9L2.14 7.16C2.14 6.98 1.84 6.88 1.84 6.88L0 6L1.84 5.12L2.14 4.82L3.02 2.98L3.9 4.82C3.9 4.92 4 5.02 4.2 5.12L6.04 5.9L4.2 6.78C4 6.86 3.9 6.96 3.9 7.16L3.02 9Z" fill="white"></path><path d="M30.02 16L29.44 14.78C29.44 14.64 29.24 14.58 29.24 14.58L28.02 14L29.24 13.42L29.44 13.22L30.02 12L30.6 13.22C30.6 13.22 30.68 13.36 30.8 13.42L32.02 13.94L30.8 14.52C30.66 14.58 30.6 14.66 30.6 14.78L30.02 16Z" fill="white"></path></g><defs><clipPath id="clip0_31_3220"><rect width="32" height="32" fill="white"></rect></clipPath></defs></svg>`,
  // 1000+
  `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><g clip-path="url(#clip0_31_3220)"><path d="M0.02 6H32.02V14H0.02V6Z" fill="#53FC18"></path><path d="M0.02 18H32.02V32H0.02V18Z" fill="#53FC18"></path><path d="M30.02 14H2.02V18H30.02V14Z" fill="#32970E"></path><path d="M22.02 6H20.02V32H12.02V6H14.02L18.02 0H26.02L22.02 6Z" fill="#BC66FF"></path><path d="M14.02 6L16.02 3L14.02 0H6.02L10.02 6H12.02H14.02Z" fill="white"></path><path d="M3.02 9L2.14 7.16C2.14 6.98 1.84 6.88 1.84 6.88L0 6L1.84 5.12L2.14 4.82L3.02 2.98L3.9 4.82C3.9 4.92 4 5.02 4.2 5.12L6.04 5.9L4.2 6.78C4 6.86 3.9 6.96 3.9 7.16L3.02 9Z" fill="white"></path><path d="M30.02 16L29.44 14.78C29.44 14.64 29.24 14.58 29.24 14.58L28.02 14L29.24 13.42L29.44 13.22L30.02 12L30.6 13.22C30.6 13.22 30.68 13.36 30.8 13.42L32.02 13.94L30.8 14.52C30.66 14.58 30.6 14.66 30.6 14.78L30.02 16Z" fill="white"></path></g><defs><clipPath id="clip0_31_3220"><rect width="32" height="32" fill="white"></rect></clipPath></defs></svg>`
];

const BADGE_SVGS = {
    broadcaster: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" width="1em" height="1em"><defs><linearGradient id="HostBadgeA" x1="16" x2="16" y1="-197.5" y2="118.7" gradientUnits="userSpaceOnUse"><stop stop-color="#FF1CD2"></stop><stop offset="1" stop-color="#B20DFF"></stop></linearGradient><linearGradient id="HostBadgeB" x1="16" x2="16" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#FF1CD2"></stop><stop offset="1" stop-color="#B20DFF"></stop></linearGradient><linearGradient id="HostBadgeC" x1="16" x2="16" y1="-64" y2="-64" gradientUnits="userSpaceOnUse"><stop stop-color="#FF1CD2"></stop><stop offset="1" stop-color="#B20DFF"></stop></linearGradient><linearGradient id="HostBadgeD" x1="16" x2="16" y1="-197.5" y2="118.7" gradientUnits="userSpaceOnUse"><stop stop-color="#FF1CD2"></stop><stop offset="1" stop-color="#B20DFF"></stop></linearGradient><linearGradient id="HostBadgeE" x1="16" x2="16" y1="-74.7" y2="-74.7" gradientUnits="userSpaceOnUse"><stop stop-color="#FF1CD2"></stop><stop offset="1" stop-color="#B20DFF"></stop></linearGradient><linearGradient id="HostBadgeF" x1="27.2" x2="27.2" y1="-.5" y2="31.1" gradientUnits="userSpaceOnUse"><stop stop-color="#FF1CD2"></stop><stop offset="1" stop-color="#B20DFF"></stop></linearGradient></defs><path fill="url(#HostBadgeA)" d="M9.6 19.2H6.4v3.2h3.2v-3.2Z"></path><path fill="url(#HostBadgeB)" d="M12.8 19.2h6.4V16h3.2V3.2h-3.2V0h-6.4v3.2H9.6V16h3.2v3.2Z"></path><path fill="url(#HostBadgeC)" d="M6.4 12.8H3.2v6.4h3.2v-6.4Z"></path><path fill="url(#HostBadgeD)" d="M25.6 19.2h-3.2v3.2h3.2v-3.2Z"></path><path fill="url(#HostBadgeE)" d="M9.6 22.4v3.2h3.2v3.2H9.6V32h12.8v-3.2h-3.2v-3.2h3.2v-3.2H9.6Z"></path><path fill="url(#HostBadgeF)" d="M25.6 12.8v6.4h3.2v-6.4h-3.2Z"></path></svg>`,
    og: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" width="1em" height="1em"><g clip-path="url(#OGBadgeA)"><path fill="url(#OGBadgeB)" d="M32 32H18.3v-1.6h-1.5v-16h1.5v-1.6H32v6.4h-9v9.6h3v-3.2h-1.6v-3.2H32V32Z"></path><path fill="url(#OGBadgeC)" d="M13.6 17.6v1.6h-12v-1.6H0v-16h1.5V0h12.2v1.6h1.5v16h-1.6Zm-4.5-4.8V3.2H6v9.6h3Z"></path><path fill="#00FFF2" d="M13.6 30.4V32h-12v-1.6H0V17.6h1.5V16h12.2v1.6h1.5v12.8h-1.6Zm-4.5-1.6v-9.6H6v9.6h3ZM32 16H18.3v-1.6h-1.5V1.6h1.5V0H32v3.2h-9v9.6h3V9.6h-1.6V6.4H32V16Z"></path></g><defs><linearGradient id="OGBadgeB" x1="16" x2="16" y1="32" y2="2.5" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFF2"></stop><stop offset="1" stop-color="#006399"></stop></linearGradient><linearGradient id="OGBadgeC" x1="15.5" x2="16.1" y1=".4" y2="31.7" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFF2"></stop><stop offset="1" stop-color="#006399"></stop></linearGradient><clipPath id="OGBadgeA"><path fill="#fff" d="M0 0h32v32H0z"></path></clipPath></defs></svg>`,
    vip: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" width="1em" height="1em"><path fill="url(#VIPBadgeA)" d="M27.8 4.8V7h-2.5v4.5h-2.1v2.3h-2.3V9.3h-2.4V2.6h-5v6.7H11v4.5H8.8v-2.3H6.7V7H4.2V4.8H0v24.6h32V4.8h-4.2Z"></path><path fill="url(#VIPBadgeA)" d="M27.8 4.8V7h-2.5v4.5h-2.1v2.3h-2.3V9.3h-2.4V2.6h-5v6.7H11v4.5H8.8v-2.3H6.7V7H4.2V4.8H0v24.6h32V4.8h-4.2Z"></path><defs><linearGradient id="VIPBadgeA" x1="16" x2="16" y1="-1" y2="35.1" gradientUnits="userSpaceOnUse"><stop stop-color="#FFC900"></stop><stop offset="1" stop-color="#FF9500"></stop></linearGradient></defs></svg>`,
    founder: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" width="1em" height="1em"><g clip-path="url(#FounderBadgeA)"><path fill="url(#FounderBadgeB)" fill-rule="evenodd" d="M29.3 8V5.4h-2.7V2.7H24V0H8v2.7H5.4v2.7H2.6V8H0v16h2.6v2.6h2.8v2.7H8V32h16v-2.7h2.6v-2.7h2.7V24H32V8h-2.7Zm-9.5 17.7h-6.5V12.8H9v-2.4h2V8.2h2v-2h7v19.5Z" clip-rule="evenodd"></path></g><defs><linearGradient id="FounderBadgeB" x1="15.7" x2="16.3" y1="-4.5" y2="36.7" gradientUnits="userSpaceOnUse"><stop stop-color="#FFC900"></stop><stop offset="1" stop-color="#FF9500"></stop></linearGradient><clipPath id="FounderBadgeA"><path fill="#fff" d="M0 0h32v32H0z"></path></clipPath></defs></svg>`,
    moderator:  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" width="1em" height="1em"><path fill="#00C7FF" d="M23.5 2.5v3h-3v3h-3v3h-3v3h-3v-3h-6v6h3v3h-3v3h-3v6h6v-3h3v-3h3v3h6v-6h-3v-3h3v-3h3v-3h3v-3h3v-6h-6Z"></path></svg>`,
    subscriber: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" width="1em" height="1em" class="size-6 lg:size-7"><defs><linearGradient id="SubscriberBadgeB" x1="-4.7" x2="84.5" y1="-25.5" y2="152.9" gradientUnits="userSpaceOnUse"><stop stop-color="#E1FF00"></stop><stop offset="1" stop-color="#2AA300"></stop></linearGradient><linearGradient id="SubscriberBadgeC" x1=".8" x2="41.4" y1="-19" y2="42.6" gradientUnits="userSpaceOnUse"><stop stop-color="#E1FF00"></stop><stop offset="1" stop-color="#2AA300"></stop></linearGradient><linearGradient id="SubscriberBadgeD" x1="16" x2="16" y1="-6.6" y2="40.2" gradientUnits="userSpaceOnUse"><stop stop-color="#E1FF00"></stop><stop offset="1" stop-color="#2AA300"></stop></linearGradient><linearGradient id="SubscriberBadgeE" x1="45.9" x2="-10.6" y1="16" y2="16" gradientUnits="userSpaceOnUse"><stop stop-color="#E1FF00"></stop><stop offset="1" stop-color="#2AA300"></stop></linearGradient><linearGradient id="SubscriberBadgeF" x1="16" x2="16" y1="47.2" y2="-4.8" gradientUnits="userSpaceOnUse"><stop stop-color="#E1FF00"></stop><stop offset="1" stop-color="#2AA300"></stop></linearGradient><linearGradient id="SubscriberBadgeG" x1="-13.1" x2="42.7" y1="16" y2="16" gradientUnits="userSpaceOnUse"><stop stop-color="#E1FF00"></stop><stop offset="1" stop-color="#2AA300"></stop></linearGradient><linearGradient id="SubscriberBadgeH" x1="13.4" x2="24.5" y1="10.9" y2="32.9" gradientUnits="userSpaceOnUse"><stop stop-color="#E1FF00"></stop><stop offset="1" stop-color="#2AA300"></stop></linearGradient><clipPath id="SubscriberBadgeA"><path fill="#fff" d="M0 0h32v32H0z"></path></clipPath></defs><g clip-path="url(#SubscriberBadgeA)"><path fill="url(#SubscriberBadgeB)" d="M29.5 14.6v-2.4h-4.9V9.7h-2.5V7.3h-2.4v-5h-2.4V0h-2.6v2.4h-2.4v5H9.9v2.3H7.4v2.5h-5v2.4H0v2.8h2.5v2.4h4.9v2.5h2.5v2.4h2.4v5h2.4V32h2.6v-2.4h2.4v-5h2.4v-2.3h2.5v-2.5h5v-2.4H32v-2.8h-2.5Z"></path><path fill="url(#SubscriberBadgeC)" d="M14.7 14.6v15h-2.4v-5H9.9v-2.3H7.4v-2.5h-5v-2.4H0v-2.8h14.7Z"></path><path fill="url(#SubscriberBadgeD)" d="M14.7 14.6v15h-2.4v-5H9.9v-2.3H7.4v-2.5h-5v-2.4H0v-2.8h14.7Z"></path><path fill="url(#SubscriberBadgeE)" d="M17.3 0v14.6H2.5v-2.4h4.9V9.7h2.5V7.3h2.4v-5h2.4V0h2.6Z"></path><path fill="url(#SubscriberBadgeF)" d="M17.3 17.4v-15h2.4v5h2.4v2.3h2.5v2.5h5v2.4H32v2.8H17.3Z"></path><path fill="url(#SubscriberBadgeG)" d="M14.7 32V17.4h14.8v2.4h-4.9v2.5h-2.5v2.4h-2.4v5h-2.4V32h-2.6Z"></path><path fill="url(#SubscriberBadgeH)" d="M17.3 14.6h-2.6v2.8h2.6v-2.8Z"></path></g></svg>`

};

function getSubGifterSVG(count) {
  if (typeof count !== "number" || isNaN(count)) return SUB_GIFTER_SVGS[0];
  if (count >= 1 && count <= 4) return SUB_GIFTER_SVGS[0];
  if (count >= 5 && count <= 9) return SUB_GIFTER_SVGS[1];
  if (count >= 10 && count <= 49) return SUB_GIFTER_SVGS[2];
  if (count >= 50 && count <= 99) return SUB_GIFTER_SVGS[3];
  if (count >= 100 && count <= 299) return SUB_GIFTER_SVGS[4];
  if (count >= 300 && count <= 349) return SUB_GIFTER_SVGS[5];
  if (count >= 350 && count <= 399) return SUB_GIFTER_SVGS[6];
  if (count >= 400 && count <= 499) return SUB_GIFTER_SVGS[7];
  if (count >= 500 && count <= 599) return SUB_GIFTER_SVGS[8];
  if (count >= 600 && count <= 699) return SUB_GIFTER_SVGS[9];
  if (count >= 700 && count <= 799) return SUB_GIFTER_SVGS[10];
  if (count >= 800 && count <= 999) return SUB_GIFTER_SVGS[11];
  if (count >= 1000) return SUB_GIFTER_SVGS[12];
  return SUB_GIFTER_SVGS[0];
}

function renderBadges(badges) {
    if (!badges) return '';
    let badgeArr = [];
    try {
        if (typeof badges === 'string') {
            badgeArr = JSON.parse(badges);
        } else if (Array.isArray(badges)) {
            badgeArr = badges;
        }
    } catch (e) {
        // Invalid JSON, ignore badges
        return '';
    }
    return badgeArr.map(b => {
      if (b.type === "sub_gifter") {
        return getSubGifterSVG(Number(b.count));
      }
      return BADGE_SVGS[b.type] || '';
    }).join('');
}

// Create HTML element for a single chat message
function createMessageElement(message) {
    console.log("sadsadasd23232")
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.setAttribute('data-timestamp', message.created_at); // Store ISO timestamp

    const channelName = message.channel_slug || 'unknown-channel';
    const channelProfilePic = message.channel_profilepic;
    const timestamp = new Date(message.created_at);
    const localTimeStr = formatLocalDateTime(timestamp); // Use utility function
    const userColor = message.color || '#FFFFFF';
    let messageContent = message.content || '';
    messageContent = parseEmotes(messageContent); // Use utility function
    const isDeleted = message.deleted === true || message.deleted === 1;
    const isAIModerated = message.ai_moderated === true;
    const username = message.username || 'Anonim'; // Get username

    if (isDeleted) {
        messageElement.classList.add('deleted-message');
    }

    // Channel link remains the same
    let channelHtml = `
        <div class="message-channel-inline">
            ${channelProfilePic ? `<img src="${channelProfilePic}" alt="${channelName}" class="channel-avatar-inline">` : ''}
            <a href="/streamer/${channelName}" title="${channelName}">${channelName}</a>
        </div>`;

    // User link points to kick-profile
    let userHtml = `<a href="/kick-profile/${encodeURIComponent(username)}" style="color: ${userColor}; text-decoration: none;" class="message-user-link">${username}</a>`;

    // --- BADGES ---
    let badgesHtml = renderBadges(message.badges);

    let replyHtml = '';
    // Only show reply section if message.type is 'reply' and necessary fields are present
    if (message.type === 'reply' && typeof message.reply_to_username !== 'undefined' && typeof message.reply_to_content !== 'undefined') {
        const replyToUsername = message.reply_to_username;
        const replyToContentText = parseEmotes(message.reply_to_content); // Assuming parseEmotes is available

        replyHtml = `
            <div class="message-reply">
                <i class="fas fa-reply message-reply-icon"></i>
                <span class="reply-to-user">${replyToUsername}:</span>
                <span class="reply-content-text"> ${replyToContentText}</span>
            </div>`;
    }

    let statusHtml = '';
    if (isDeleted) {
        statusHtml = `<div class="message-status"><i class="fas fa-ban"></i> ${isAIModerated ? 'AI Moderasyonuyla Silindi' : 'Silindi'}</div>`;
    }

    // Set the main structure of the message element first
    messageElement.innerHTML = `
        ${channelHtml}
        <div class="message-time" title="${timestamp.toLocaleString()}">
            ${localTimeStr}
        </div>
        <div class="message-body">
            <div class="message-user" style="color: ${userColor}">${badgesHtml} ${userHtml}</div>
            <div class="message-content ${isDeleted ? 'deleted-content' : ''}">${messageContent || '<i style="color: #ADADB8;">(boş mesaj)</i>'}</div>
        </div>
        ${replyHtml}
        ${statusHtml}
    `;

    // Add broadcast info icon and functionality programmatically
    // The icon is added if message.id is present, as it's needed for the API call.
    console.log(message)
    if (message.id) { 
        const timeDiv = messageElement.querySelector('.message-time');
        if (timeDiv) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'broadcast-info-icon';
            iconSpan.title = 'Yayın Bilgisini Göster'; // Tooltip for the icon
            iconSpan.style.cursor = 'pointer';
            iconSpan.style.marginLeft = '8px'; // Add some spacing
            iconSpan.innerHTML = '<i class="fas fa-info-circle"></i>';

            iconSpan.addEventListener('click', async (event) => {
                event.stopPropagation(); // Prevent triggering other click events

                if (iconSpan.classList.contains('loading-details')) return; // Prevent multiple clicks

                iconSpan.classList.add('loading-details');
                iconSpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Loading indicator

                try {
                    // Fetch ALL broadcast details on demand
                    // Pass channel_id and created_at from the message object to avoid extra DB lookups on the backend
                    // More explicit check for null, undefined, or empty string
                    if (message.channel_id == null || String(message.channel_id).trim() === "" || message.created_at == null || String(message.created_at).trim() === "") {
                        console.error("Message object is missing channel_id or created_at, or they are empty. channel_id:", message.channel_id, "created_at:", message.created_at);
                        alert('Yayın detayları için gerekli bilgi eksik (kanal ID veya zaman bilgisi bulunamadı).');
                        iconSpan.classList.remove('loading-details');
                        iconSpan.innerHTML = '<i class="fas fa-info-circle"></i>'; // Reset icon
                        return;
                    }
                    const response = await fetch(`/api/message/${message.id}/broadcast-details?channelId=${encodeURIComponent(String(message.channel_id).trim())}&createdAt=${encodeURIComponent(String(message.created_at).trim())}`);
                    
                    let fetchedBroadcastTitle = '';
                    let fetchedBroadcastStartTime = '';
                    let fetchedTimeIntoBroadcast = '';

                    if (response.ok) {
                        const detailsData = await response.json();
                        fetchedBroadcastTitle = detailsData.broadcast_title || '';
                        fetchedBroadcastStartTime = detailsData.broadcast_start_time || '';
                        fetchedTimeIntoBroadcast = detailsData.time_into_broadcast || '';
                    } else {
                        console.error(`API error fetching broadcast details: ${response.status}`);
                        alert('Yayın detayları yüklenirken bir hata oluştu.');
                        iconSpan.classList.remove('loading-details');
                        iconSpan.innerHTML = '<i class="fas fa-info-circle"></i>'; // Reset icon
                        return;
                    }

                    const t_modal = (key, options) => {
                        // 1. Try to get from pre-rendered HTML element
                        const elementId = key.replace(/\./g, '-') + '-translation';
                        const element = document.getElementById(elementId);
                        if (element && element.textContent && element.textContent.trim() !== '') {
                            let text = element.textContent.trim();
                            if (options && typeof options.count !== 'undefined' && text.includes('{count}')) {
                                text = text.replace('{count}', options.count);
                            }
                            return text;
                        } else {
                        }

                        // 2. If not in HTML, try client-side i18next
                        if (window.i18next) {
                            const i18nText = window.i18next.t(key, options);
                            if (i18nText !== key) { // i18next returns the key if not found (unless configured otherwise)
                                return i18nText;
                            } else {;
                            }
                        } else {
                        }
                        
                        // 3. Final fallback
                        const fallbackValue = options && options.defaultValue ? options.defaultValue : key;
                        return fallbackValue;
                    };

                    const titleLabel = t_modal('broadcastDetails.titleLabel', { defaultValue: 'Title:' });
                    const startTimeLabel = t_modal('broadcastDetails.startTimeLabel', { defaultValue: 'Start:' });
                    const timeIntoBroadcastLabel = t_modal('broadcastDetails.timeIntoBroadcastLabel', { defaultValue: 'Time Into Broadcast:' });
                    
                    let modalDetails = [];
                    if (fetchedBroadcastTitle) modalDetails.push(`${titleLabel} ${fetchedBroadcastTitle}`);
                    if (fetchedBroadcastStartTime) modalDetails.push(`${startTimeLabel} ${formatLocalDateTime(new Date(fetchedBroadcastStartTime))}`);
                    if (fetchedTimeIntoBroadcast) modalDetails.push(`${timeIntoBroadcastLabel} ${fetchedTimeIntoBroadcast}`);

                    const modalElement = searchWarningModal; 
                    if (modalElement) {
                        const modalTitleElement = modalElement.querySelector('#modal-title');
                        const modalMessageElement = modalElement.querySelector('#modal-message');
                        const modalLoginButton = modalElement.querySelector('#modal-login-button');
                        const modalUpgradeButton = modalElement.querySelector('#modal-upgrade-button');
                        const modalWatchAdButton = modalElement.querySelector('#modal-watch-ad-button');
                        const modalDeclineButton = modalElement.querySelector('#modal-decline-button'); 

                        const okText = t_modal('common.ok', { defaultValue: 'OK' });
                        const broadcastDetailsTitleText = t_modal('broadcastDetails.modalTitle', { defaultValue: 'Broadcast Details' });
                        const notFoundMessage = t_modal('broadcastDetails.notFound', { defaultValue: 'No broadcast details found for this message.' });

                        if (modalTitleElement) modalTitleElement.textContent = broadcastDetailsTitleText;

                        if (modalDetails.length > 0) {
                            if (modalMessageElement) modalMessageElement.innerHTML = modalDetails.join('<br>');
                        } else {
                            if (modalMessageElement) modalMessageElement.textContent = notFoundMessage;
                        }

                        if (modalLoginButton) modalLoginButton.style.display = 'none';
                        if (modalUpgradeButton) modalUpgradeButton.style.display = 'none';
                        if (modalWatchAdButton) modalWatchAdButton.style.display = 'none';

                        if (modalDeclineButton) {
                            modalDeclineButton.textContent = okText;
                            modalDeclineButton.style.display = 'inline-block';
                            modalDeclineButton.onclick = () => modalElement.style.display = 'none';
                        }
                        modalElement.style.display = 'block';
                    } else {
                        // Fallback to alert if modal is not found (should ideally not happen)
                        // This alert will use the English default from t_modal if HTML/i18next fails
                        const alertTitleLabel = t_modal('broadcastDetails.titleLabel', { defaultValue: 'Title:' });
                        const alertStartTimeLabel = t_modal('broadcastDetails.startTimeLabel', { defaultValue: 'Start:' });
                        const alertTimeIntoLabel = t_modal('broadcastDetails.timeIntoBroadcastLabel', { defaultValue: 'Time Into Broadcast:' });
                        let alertMsgDetails = [];
                        if (fetchedBroadcastTitle) alertMsgDetails.push(`${alertTitleLabel} ${fetchedBroadcastTitle}`);
                        if (fetchedBroadcastStartTime) alertMsgDetails.push(`${alertStartTimeLabel} ${formatLocalDateTime(new Date(fetchedBroadcastStartTime))}`);
                        if (fetchedTimeIntoBroadcast) alertMsgDetails.push(`${alertTimeIntoLabel} ${fetchedTimeIntoBroadcast}`);

                        if (alertMsgDetails.length > 0) {
                            alert(alertMsgDetails.join('\n'));
                        } else {
                            alert(t_modal('broadcastDetails.notFound', { defaultValue: 'No broadcast details found for this message.' }));
                        }
                    }

                } catch (error) {
                    console.error("Error fetching or processing broadcast details:", error);
                    const t_modal_error = (key, options) => { // Renamed to avoid conflict in this specific catch block
                        const elementId = key.replace(/\./g, '-') + '-translation';
                        const element = document.getElementById(elementId);
                        if (element && element.textContent && element.textContent.trim() !== '') return element.textContent.trim();
                        if (window.i18next) return window.i18next.t(key, options);
                        return options && options.defaultValue ? options.defaultValue : key;
                    };
                    const modalElement = searchWarningModal;

                    if (modalElement) {
                        const modalTitleElement = modalElement.querySelector('#modal-title');
                        const modalMessageElement = modalElement.querySelector('#modal-message');
                        const modalLoginButton = modalElement.querySelector('#modal-login-button');
                        const modalUpgradeButton = modalElement.querySelector('#modal-upgrade-button');
                        const modalWatchAdButton = modalElement.querySelector('#modal-watch-ad-button');
                        const modalDeclineButton = modalElement.querySelector('#modal-decline-button');
                        
                        const okText = t_modal_error('common.ok', { defaultValue: 'OK' });
                        const errorTitleText = t_modal_error('common.error', { defaultValue: 'Error' });
                        const errorLoadingMessage = t_modal_error('broadcastDetails.errorLoading', { defaultValue: 'An error occurred while loading broadcast details.' });

                        if (modalTitleElement) modalTitleElement.textContent = errorTitleText;
                        if (modalMessageElement) modalMessageElement.textContent = errorLoadingMessage;
                        
                        if (modalLoginButton) modalLoginButton.style.display = 'none';
                        if (modalUpgradeButton) modalUpgradeButton.style.display = 'none';
                        if (modalWatchAdButton) modalWatchAdButton.style.display = 'none';
                        
                        if (modalDeclineButton) {
                            modalDeclineButton.textContent = okText;
                            modalDeclineButton.style.display = 'inline-block';
                            modalDeclineButton.onclick = () => modalElement.style.display = 'none';
                        }
                        modalElement.style.display = 'block';
                    } else {
                         alert(t_modal_error('broadcastDetails.errorLoading', { defaultValue: 'An error occurred while loading broadcast details.' }));
                    }
                } finally {
                    iconSpan.classList.remove('loading-details');
                    iconSpan.innerHTML = '<i class="fas fa-info-circle"></i>'; // Reset icon
                }
            });
            timeDiv.appendChild(iconSpan);
        }
    }

    return messageElement;
}


// --- Share Search Functionality ---
async function handleShareSearch() {
    if (isLoading) return; // Don't share while loading

    const shareButton = document.getElementById('share-search-button');
    if (shareButton) shareButton.disabled = true; // Disable button during API call

    try {
        // Gather current parameters
        const query = document.getElementById('search-query')?.value || '';
        const username = document.getElementById('username-filter')?.value.trim().replace(/-/g, '_') || '';
        const channelName = document.getElementById('channel-filter')?.value.trim()|| '';
        const dateFrom = document.getElementById('date-from')?.value || '';
        const dateTo = document.getElementById('date-to')?.value || '';
        const topTimestamp = getTopmostVisibleElementTimestamp(); // Get current scroll position timestamp

        const paramsToShare = {
            query: query,
            username: username,
            channelName: channelName,
            dateFrom: dateFrom,
            dateTo: dateTo,
            // scrollPage: currentPage, // Removed page number
            scrollTopTs: topTimestamp ? new Date(topTimestamp).getTime() : null // Send Unix timestamp or null
        };

        // Get CSRF token
        const csrfTokenInput = document.querySelector('#search-form input[name="_csrf"]');
        const csrfToken = csrfTokenInput ? csrfTokenInput.value : null;
        if (!csrfToken) throw new Error("CSRF token not found for sharing.");

        console.log("Sharing search with params:", paramsToShare);
console.log("zzzzzzzzzzzzz1")
        // Call the backend API
        const response = await fetch('/api/share/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify(paramsToShare)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
            throw new Error(`API error ${response.status}: ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();

        if (data.success && data.shortUrl) {
            const fullShortUrl = `${window.location.origin}${data.shortUrl}`;
            // Show prompt with the short URL and copy functionality
            const userResponse = prompt(`Share this link:\n${fullShortUrl}\n\nClick OK to copy to clipboard.`, fullShortUrl);
            if (userResponse !== null) { // User didn't click Cancel
                copyToClipboard(fullShortUrl);
                // Optionally show a small confirmation message
                // alert('Link copied to clipboard!');
            }
        } else {
            throw new Error(data.message || 'Failed to get short URL from server.');
        }

    } catch (error) {
        console.error('Error sharing search:', error);
        alert(`Could not create share link: ${error.message}`); // Show error to user
    } finally {
        if (shareButton) shareButton.disabled = false; // Re-enable button
    }
}

// Simple copy to clipboard function
function copyToClipboard(text) {
    if (!navigator.clipboard) {
        // Fallback for older browsers
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            console.log('Fallback: Copied to clipboard');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            alert('Could not copy link automatically. Please copy it manually.');
        }
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        console.log('Async: Copied to clipboard!');
    }).catch(err => {
        console.error('Async: Could not copy text: ', err);
        alert('Could not copy link automatically. Please copy it manually.');
    });
}
