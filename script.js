// API Configuration
const API_KEY = '89ce29e3f588213a695f4c6badc9284e';
const API_BASE_URL = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

// Google Places API - FREE $200/month credit = ~100,000 autocomplete requests
// Get free key: https://console.cloud.google.com/google/maps-apis/start
const GOOGLE_PLACES_API_KEY = 'AIzaSyB0FDrhjBjzFqQNrucHOeIuM4mFkhDYCG8';
const USE_GOOGLE_PLACES = true; // Using Google Places SDK only

// Google Places Service instances (initialized when API loads)
let googleAutocompleteService = null;
let googlePlacesService = null;

// Initialize Google Places services when API loads
window.initGooglePlaces = function() {
    console.log('✅ Google Places API loaded');
    console.log('📦 Checking google object:', typeof google);
    console.log('📦 Checking google.maps:', typeof google?.maps);
    console.log('📦 Checking google.maps.places:', typeof google?.maps?.places);
    
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        // Always use AutocompleteService (works for both old and new customers)
        if (google.maps.places.AutocompleteService) {
            googleAutocompleteService = new google.maps.places.AutocompleteService();
            console.log('✅ AutocompleteService created successfully');
            console.log('📦 googleAutocompleteService:', googleAutocompleteService);
        } else {
            console.error('❌ AutocompleteService not available');
        }
        
        // Create PlacesService for getting place details (including ZIP code)
        if (google.maps.places.PlacesService) {
            // PlacesService needs a map or div element
            const dummyDiv = document.createElement('div');
            googlePlacesService = new google.maps.places.PlacesService(dummyDiv);
            console.log('✅ PlacesService created successfully for ZIP code lookup');
        }
        
        console.log('✅ Google Places services initialized');
    } else {
        console.error('❌ Google Places API not available');
        console.error('google:', typeof google);
        console.error('google.maps:', typeof google?.maps);
        console.error('google.maps.places:', typeof google?.maps?.places);
    }
};

// US States data
const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'District of Columbia' }
];

// Form elements
const form = document.getElementById('propertyForm');
const resultsDiv = document.getElementById('results');
const errorDiv = document.getElementById('error');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const stateSelect = document.getElementById('state');
const cityInput = document.getElementById('city');
const addressInput = document.getElementById('address');
const zipcodeInput = document.getElementById('zipcode');
const cityDropdown = document.getElementById('cityDropdown');
const addressDropdown = document.getElementById('addressDropdown');

// Check if all required elements exist
if (!form) {
    console.warn('propertyForm not found on this page');
}
if (!resultsDiv) {
    console.warn('results div not found on this page');
}
if (!errorDiv) {
    console.warn('error div not found on this page');
}
if (!addressInput) {
    console.error('❌ addressInput element NOT FOUND!');
} else {
    console.log('✅ addressInput element found:', addressInput);
}
if (!addressDropdown) {
    console.error('❌ addressDropdown element NOT FOUND!');
} else {
    console.log('✅ addressDropdown element found:', addressDropdown);
}

// Initialize states dropdown
function initializeStates() {
    US_STATES.forEach(state => {
        const option = document.createElement('option');
        option.value = state.code;
        option.textContent = `${state.name} (${state.code})`;
        stateSelect.appendChild(option);
    });
}

// City autocomplete
let cityTimeout;
cityInput.addEventListener('input', function() {
    console.log('🎯 City input changed:', this.value);
    clearTimeout(cityTimeout);
    const query = this.value.trim();
    const selectedState = stateSelect.value;
    
    console.log('📝 Query:', query, '| State:', selectedState, '| Min length: 1');
    
    // Show suggestions starting from 1 character
    if (query.length < 1) {
        console.log('⚠️ Query empty, hiding dropdown');
        cityDropdown.style.display = 'none';
        return;
    }
    
    // Show loading indicator
    cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">Searching...</div>';
    cityDropdown.style.display = 'block';
    console.log('⏳ Loading indicator shown');
    
    // Reduced timeout for faster response
    cityTimeout = setTimeout(() => {
        console.log('🚀 Timeout triggered, checking Google Places availability');
        console.log('USE_GOOGLE_PLACES:', USE_GOOGLE_PLACES);
        console.log('googleAutocompleteService:', googleAutocompleteService ? 'READY' : 'NOT READY');
        
        if (USE_GOOGLE_PLACES && googleAutocompleteService) {
            console.log('✅ Using Google Places SDK');
            fetchCitySuggestionsGoogle(query, selectedState);
        } else {
            console.error('❌ Google Places not available!');
            cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #f44;">Google Places API not loaded</div>';
            cityDropdown.style.display = 'block';
        }
    }, 150);
});

// Address autocomplete with full street names and numbers
let addressTimeout;
if (addressInput && addressDropdown) {
    console.log('🏠 Setting up address autocomplete listener...');
    
    addressInput.addEventListener('input', function() {
    console.log('🏠 Address input changed:', this.value);
    clearTimeout(addressTimeout);
    const query = this.value.trim();
    const selectedCity = cityInput.value.trim();
    const selectedState = stateSelect.value;
    
    console.log('📝 Address Query:', query);
    console.log('📝 City:', selectedCity, '| State:', selectedState);
    
    // Start searching from 1 character for fast results
    if (query.length < 1 || !selectedCity || !selectedState) {
        console.log('⚠️ Missing data - Query:', query.length, 'City:', selectedCity, 'State:', selectedState);
        addressDropdown.style.display = 'none';
        return;
    }
    
    console.log('⏳ Starting address search...');
    
    // Reduced timeout for faster response (150ms instead of 300ms)
    addressTimeout = setTimeout(() => {
        console.log('🚀 Address timeout triggered');
        console.log('USE_GOOGLE_PLACES:', USE_GOOGLE_PLACES);
        console.log('googleAutocompleteService:', googleAutocompleteService ? 'READY' : 'NOT READY');
        
        if (USE_GOOGLE_PLACES && googleAutocompleteService) {
            console.log('✅ Using Google Places SDK for addresses');
            fetchAddressSuggestionsGoogle(query, selectedCity, selectedState);
        } else {
            console.error('❌ Google Places not available!');
            addressDropdown.innerHTML = '<div class="autocomplete-item" style="color: #f44;">Google Places API not loaded</div>';
            addressDropdown.style.display = 'block';
        }
    }, 150);
    });
} else {
    console.error('❌ Address autocomplete setup FAILED - elements missing!');
    console.error('   addressInput:', !!addressInput);
    console.error('   addressDropdown:', !!addressDropdown);
}

// Fetch city suggestions using Google Places SDK - NO CORS ISSUES!
async function fetchCitySuggestionsGoogle(query, stateCode) {
    console.log('🔍 fetchCitySuggestionsGoogle called');
    console.log('   Query:', query);
    console.log('   State code:', stateCode);
    console.log('   Service ready:', !!googleAutocompleteService);
    
    try {
        if (!googleAutocompleteService) {
            console.error('❌ Google Autocomplete service not ready');
            cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #f44;">Google API not ready</div>';
            cityDropdown.style.display = 'block';
            return;
        }
        
        const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;
        
        // Search just the query in USA, filter by state on client side
        // Google works better with simple queries
        const searchQuery = query;
        
        console.log('🔍 Google Places SDK cities search:', query, '(will filter for', stateName, ')');
        console.log('   Search query:', searchQuery);
        
        // Use Google Places Autocomplete Service (no CORS!)
        const request = {
            input: searchQuery,
            types: ['(cities)'],
            componentRestrictions: { country: 'us' },
            language: 'en'  // Force English results
        };
        
        console.log('📤 Sending request to Google:', request);
        
        googleAutocompleteService.getPlacePredictions(request, (predictions, status) => {
            console.log('📥 Google response received');
            console.log('   Status:', status);
            console.log('   Raw predictions:', predictions);
            console.log('   Predictions count:', predictions?.length || 0);
            
            if (status === 'OK' && predictions && predictions.length > 0) {
                console.log('✅ Google SDK found:', predictions.length, 'cities total');
                console.log('📋 Sample predictions:', predictions.slice(0, 3).map(p => p.description));
                
                // Extract and filter cities by state
                const allCities = predictions.map(p => {
                    console.log('🔍 Parsing:', p.description);
                    const parts = p.description.split(', ');
                    const cityName = parts[0] || '';
                    const cityState = parts[1] || '';
                    
                    console.log('   Parts:', parts);
                    console.log('   City:', cityName, '| State part:', cityState);
                    
                    // Try to match state - check both code and name
                    const stateObj = US_STATES.find(s => {
                        const match = cityState === s.code || 
                                     cityState === s.name ||
                                     cityState.toLowerCase() === s.code.toLowerCase() ||
                                     cityState.toLowerCase() === s.name.toLowerCase();
                        if (match) console.log('   ✅ Matched state:', s.code, s.name);
                        return match;
                    });
                    
                    if (!stateObj) console.log('   ❌ No state match for:', cityState);
                    
                    const matchesState = stateObj && stateObj.code === stateCode;
                    console.log('   Matches target state', stateCode, '?', matchesState);
                    
                    return {
                        name: cityName,
                        state: stateObj ? stateObj.code : cityState,
                        stateName: cityState,
                        postcode: '',
                        display_name: p.description,
                        place_id: p.place_id,
                        matchesState: matchesState
                    };
                });
                
                console.log('📋 All cities parsed:', allCities.map(c => `${c.name} (${c.state}) [match:${c.matchesState}]`).join(', '));
                
                // Filter by selected state
                const citiesInState = allCities.filter(c => c.matchesState);
                
                console.log('🎯 Cities in', stateName, '(', stateCode, '):', citiesInState.length);
                if (citiesInState.length > 0) {
                    console.log('   Cities:', citiesInState.map(c => c.name).join(', '));
                }
                
                if (citiesInState.length > 0) {
                    // Sort by city name
                    citiesInState.sort((a, b) => a.name.localeCompare(b.name));
                    displayCitySuggestions(citiesInState);
                } else {
                    console.log('⚠️ No cities found in', stateName);
                    cityDropdown.innerHTML = `<div class="autocomplete-item" style="color: #999;">No cities starting with "${query}" in ${stateName}</div>`;
                    cityDropdown.style.display = 'block';
                }
            } else if (status === 'ZERO_RESULTS') {
                console.log('⚠️ Zero results from Google');
                cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">No cities found</div>';
                cityDropdown.style.display = 'block';
            } else {
                console.error('❌ Google Places error status:', status);
                cityDropdown.innerHTML = `<div class="autocomplete-item" style="color: #f44;">Error: ${status}</div>`;
                cityDropdown.style.display = 'block';
            }
        });
    } catch (error) {
        console.error('❌ Google Places SDK error:', error);
        console.error('   Error stack:', error.stack);
        cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #f44;">Error loading cities</div>';
        cityDropdown.style.display = 'block';
    }
}

// OpenStreetMap Nominatim (free, no API key needed, no CORS issues)
async function fetchCitySuggestionsNominatim(query, stateCode) {
    try {
        const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;
        
        // Use Nominatim with optimized query for cities
        const searchQuery = stateCode ? `${query}, ${stateName}, USA` : `${query}, USA`;
        const url = `https://nominatim.openstreetmap.org/search?` +
                    `q=${encodeURIComponent(searchQuery)}&` +
                    `format=json&` +
                    `addressdetails=1&` +
                    `limit=30&` +
                    `countrycodes=us`;
        
        console.log('Searching cities with Nominatim:', query, 'in', stateName);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'PropertyValuationApp/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error('Nominatim API error');
        }
        
        const data = await response.json();
        console.log('Nominatim response:', data);
        
        if (data && data.length > 0) {
            // Extract unique cities from the results
            const cities = [];
            const seenCities = new Set();
            const queryLower = query.toLowerCase();
            
            data.forEach(place => {
                const addr = place.address;
                if (!addr) return;
                
                // Get city name from various possible fields
                const city = addr.city || addr.town || addr.village || addr.municipality;
                const state = addr.state;
                const postcode = addr.postcode;
                
                // Check if this is a city-type place and matches our criteria
                if (city && state) {
                    const cityLower = city.toLowerCase();
                    
                    // Skip if we already have this city
                    if (seenCities.has(cityLower)) return;
                    
                    // If state is selected, filter by state
                    if (stateCode && state.toLowerCase() !== stateName.toLowerCase()) {
                        return;
                    }
                    
                    // Check if city name contains the query (more flexible matching)
                    if (!cityLower.includes(queryLower)) return;
                    
                    seenCities.add(cityLower);
                    
                    // Add relevance score: 2 if starts with query, 1 if contains
                    const relevance = cityLower.startsWith(queryLower) ? 2 : 1;
                    
                    // Find state code
                    const stateObj = US_STATES.find(s => s.name.toLowerCase() === state.toLowerCase());
                    const stateCodeFound = stateObj ? stateObj.code : stateCode;
                    
                    cities.push({
                        name: city,
                        state: stateCodeFound,
                        postcode: postcode,
                        display_name: `${city}, ${state}`,
                        relevance: relevance
                    });
                }
            });
            
            console.log('Extracted cities:', cities);
            
            // Sort by relevance (starting with query first), then alphabetically
            cities.sort((a, b) => {
                if (a.relevance !== b.relevance) return b.relevance - a.relevance;
                return a.name.localeCompare(b.name);
            });
            
            if (cities.length > 0) {
                displayCitySuggestions(cities);
            } else {
                cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">No cities found in this state</div>';
                cityDropdown.style.display = 'block';
            }
        } else {
            cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">No cities found</div>';
            cityDropdown.style.display = 'block';
        }
    } catch (error) {
        console.error('City suggestions error:', error);
        cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #f44;">❌ Error loading cities</div>';
        cityDropdown.style.display = 'block';
    }
}

// Fetch city suggestions using Mapbox (requires API key)
async function fetchCitySuggestionsMapbox(query, stateCode) {
    try {
        const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=US&types=place&limit=10&access_token=${MAPBOX_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const cities = data.features
                .filter(f => {
                    const context = f.context || [];
                    const state = context.find(c => c.id.startsWith('region'));
                    return state && state.short_code === `US-${stateCode}`;
                })
                .map(f => ({
                    name: f.text,
                    state: stateCode,
                    postcode: f.context?.find(c => c.id.startsWith('postcode'))?.text,
                    display_name: f.place_name
                }));
            
            if (cities.length > 0) {
                displayCitySuggestions(cities);
            } else {
                cityDropdown.style.display = 'none';
            }
        } else {
            cityDropdown.style.display = 'none';
        }
    } catch (error) {
        console.log('Mapbox city suggestions error:', error);
        cityDropdown.style.display = 'none';
    }
}

// Display city suggestions
function displayCitySuggestions(cities) {
    console.log('🎨 displayCitySuggestions called with', cities.length, 'cities');
    console.log('   Cities:', cities);
    
    cityDropdown.innerHTML = '';
    
    // Add count header if many results
    if (cities.length > 5) {
        const header = document.createElement('div');
        header.style.padding = '8px 15px';
        header.style.fontSize = '0.85em';
        header.style.color = '#5288c1';
        header.style.fontWeight = '600';
        header.style.borderBottom = '1px solid #2b3847';
        header.textContent = `Found ${cities.length} cities`;
        cityDropdown.appendChild(header);
        console.log('   Added header');
    }
    
    // Show max 20 cities
    const displayCities = cities.slice(0, 20);
    const query = cityInput.value.trim().toLowerCase();
    
    console.log('   Displaying', displayCities.length, 'cities');
    
    displayCities.forEach((city, index) => {
        console.log(`   Creating item ${index + 1}:`, city.name, city.state);
        
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        
        // Simple display without highlighting issues
        div.innerHTML = `<strong>${city.name}</strong>, ${city.state}`;
        
        div.addEventListener('click', function() {
            console.log('   City clicked:', city.name);
            cityInput.value = city.name;
            cityDropdown.style.display = 'none';
            
            // Auto-fill zipcode if available
            if (city.postcode && zipcodeInput) {
                zipcodeInput.value = city.postcode;
                console.log('   Auto-filled ZIP:', city.postcode);
            }
            
            // Focus on address field
            if (addressInput) {
                addressInput.focus();
                console.log('   Focused on address field');
            }
        });
        
        cityDropdown.appendChild(div);
    });
    
    console.log('✅ City dropdown displayed with', displayCities.length, 'items');
    cityDropdown.style.display = 'block';
}

// Fetch address suggestions using Google Places SDK - NO CORS ISSUES!
async function fetchAddressSuggestionsGoogle(query, city, state) {
    console.log('🏠 fetchAddressSuggestionsGoogle called');
    console.log('   Query:', query);
    console.log('   City:', city);
    console.log('   State:', state);
    console.log('   Service ready:', !!googleAutocompleteService);
    
    try {
        if (!googleAutocompleteService) {
            console.error('❌ Google Autocomplete service not ready');
            addressDropdown.innerHTML = '<div class="autocomplete-item" style="color: #f44;">Google API not ready</div>';
            addressDropdown.style.display = 'block';
            return;
        }
        
        const stateName = US_STATES.find(s => s.code === state)?.name || state;
        const searchQuery = `${query}, ${city}, ${stateName}, USA`;
        
        console.log('🔍 Google Places SDK address search:', query);
        console.log('   Full search query:', searchQuery);
        
        // Use Google Places Autocomplete Service (no CORS!)
        const request = {
            input: searchQuery,
            types: ['address'],
            componentRestrictions: { country: 'us' },
            language: 'en'  // Force English results
        };
        
        console.log('📤 Sending address request to Google:', request);
        
        googleAutocompleteService.getPlacePredictions(request, (predictions, status) => {
            console.log('📥 Google address response received');
            console.log('   Status:', status);
            console.log('   Predictions:', predictions);
            console.log('   Predictions count:', predictions?.length || 0);
            
            if (status === 'OK' && predictions) {
                console.log('✅ Google SDK found:', predictions.length, 'addresses');
                
                const addresses = predictions.map(p => {
                    console.log('📍 Raw prediction:', p);
                    console.log('   Description:', p.description);
                    console.log('   Terms:', p.terms);
                    console.log('   Types:', p.types);
                    
                    const parts = p.description.split(', ');
                    console.log('   Parts:', parts);
                    
                    // Format can be:
                    // "Street, City, State ZIP, Country"
                    // "Street, City, State, Country"
                    const street = parts[0] || '';
                    const cityName = parts[1] || city;
                    const stateZipPart = parts[2] || '';
                    
                    console.log('   Street:', street);
                    console.log('   City:', cityName);
                    console.log('   StateZipPart:', stateZipPart);
                    
                    // Try multiple patterns to extract ZIP
                    let statePart = state;
                    let zipcode = '';
                    
                    // Pattern 1: "OH 44305" or "Ohio 44305"
                    const pattern1 = stateZipPart.match(/([A-Za-z\s]+)\s+(\d{5}(-\d{4})?)/);
                    if (pattern1) {
                        statePart = pattern1[1].trim();
                        zipcode = pattern1[2];
                        console.log('   ✅ Pattern 1 matched - State:', statePart, 'ZIP:', zipcode);
                    } else {
                        // Pattern 2: Just state code at start "OH" or "Ohio"
                        const pattern2 = stateZipPart.match(/^([A-Z]{2}|[A-Za-z\s]+)/);
                        if (pattern2) {
                            statePart = pattern2[1].trim();
                        }
                        
                        // Try to find ZIP in any part of description
                        const zipPattern = p.description.match(/\b(\d{5}(-\d{4})?)\b/);
                        if (zipPattern) {
                            zipcode = zipPattern[1];
                            console.log('   ✅ Pattern 2 - Found ZIP in description:', zipcode);
                        } else {
                            console.log('   ⚠️ No ZIP found in:', p.description);
                        }
                    }
                    
                    // Convert state name to code if needed
                    if (statePart.length > 2) {
                        const stateObj = US_STATES.find(s => s.name.toLowerCase() === statePart.toLowerCase());
                        if (stateObj) {
                            statePart = stateObj.code;
                        }
                    }
                    
                    console.log('   📦 Final parsed - State:', statePart, 'ZIP:', zipcode);
                    
                    return {
                        street: street,
                        city: cityName,
                        state: statePart,
                        zipcode: zipcode,
                        full: p.description,
                        place_id: p.place_id
                    };
                }).slice(0, 10);
                
                console.log('📋 All addresses parsed:');
                addresses.forEach((a, i) => {
                    console.log(`   ${i+1}. ${a.street} - ZIP: ${a.zipcode || 'MISSING'}`);
                });
                
                if (addresses.length > 0) {
                    console.log('✅ Displaying', addresses.length, 'addresses');
                    displayAddressSuggestions(addresses);
                } else {
                    console.log('⚠️ No addresses to display');
                    addressDropdown.style.display = 'none';
                }
            } else if (status === 'ZERO_RESULTS') {
                console.log('⚠️ Zero address results from Google');
                addressDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">No addresses found</div>';
                addressDropdown.style.display = 'block';
            } else {
                console.error('❌ Google Places address error status:', status);
                addressDropdown.innerHTML = `<div class="autocomplete-item" style="color: #f44;">Error: ${status}</div>`;
                addressDropdown.style.display = 'block';
            }
        });
    } catch (error) {
        console.error('❌ Google Places SDK address error:', error);
        console.error('   Error stack:', error.stack);
        addressDropdown.innerHTML = '<div class="autocomplete-item" style="color: #f44;">Error loading addresses</div>';
        addressDropdown.style.display = 'block';
    }
}

// Fetch address suggestions using Nominatim (includes house numbers and streets)
async function fetchAddressSuggestionsNominatim(query, city, state) {
    try {
        const stateName = US_STATES.find(s => s.code === state)?.name || state;
        const searchQuery = `${query}, ${city}, ${stateName}, USA`;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=10`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'PropertyValuationApp/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error('Nominatim API error');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const addresses = data
                .filter(place => {
                    const addr = place.address;
                    return addr && (addr.house_number || addr.road);
                })
                .map(place => {
                    const addr = place.address;
                    const houseNumber = addr.house_number || '';
                    const road = addr.road || '';
                    const cityName = addr.city || addr.town || addr.village || city;
                    const postcode = addr.postcode || '';
                    
                    return {
                        street: `${houseNumber} ${road}`.trim(),
                        city: cityName,
                        state: state,
                        zipcode: postcode,
                        full: `${houseNumber} ${road}, ${cityName}, ${state} ${postcode}`.trim()
                    };
                })
                .filter(addr => addr.street.length > 0);
            
            if (addresses.length > 0) {
                displayAddressSuggestions(addresses);
            } else {
                addressDropdown.style.display = 'none';
            }
        } else {
            addressDropdown.style.display = 'none';
        }
    } catch (error) {
        console.log('Address suggestions error:', error);
        addressDropdown.style.display = 'none';
    }
}

// Fetch address suggestions using Mapbox - FAST and accurate for USA
async function fetchAddressSuggestionsMapbox(query, city, state) {
    try {
        // Proximity search centered on selected city for better results
        const searchQuery = `${query}`;
        const proximity = `&proximity=ip`; // Use user's IP location for better ordering
        const bbox = ``; // Could add bounding box for state/city if needed
        
        // Optimized Mapbox query with types=address for street-level results
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
                    `country=US&types=address&autocomplete=true&` +
                    `limit=10${proximity}&` +
                    `access_token=${MAPBOX_API_KEY}`;
        
        console.log('🔍 Mapbox address search:', query);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('Mapbox API error:', response.status);
            // Fallback to Nominatim if Mapbox fails
            fetchAddressSuggestionsNominatim(query, city, state);
            return;
        }
        
        const data = await response.json();
        console.log('📍 Mapbox results:', data.features?.length || 0);
        
        if (data.features && data.features.length > 0) {
            // Filter results to match selected city and state
            const stateFilter = state ? state.toUpperCase() : null;
            const cityFilter = city ? city.toLowerCase() : null;
            
            const addresses = data.features
                .map(f => {
                    const address = f.address ? `${f.address} ${f.text}` : f.text;
                    const context = f.context || [];
                    const postcode = context.find(c => c.id.startsWith('postcode'))?.text || '';
                    const placeCity = context.find(c => c.id.startsWith('place'))?.text || '';
                    const regionCode = context.find(c => c.id.startsWith('region'))?.short_code?.replace('US-', '') || '';
                    
                    return {
                        street: address,
                        city: placeCity || city,
                        state: regionCode || state,
                        zipcode: postcode,
                        full: f.place_name,
                        relevance: f.relevance // Mapbox provides relevance score
                    };
                })
                .filter(addr => {
                    // Filter by selected city and state
                    const matchesState = !stateFilter || addr.state === stateFilter;
                    const matchesCity = !cityFilter || addr.city.toLowerCase().includes(cityFilter);
                    return matchesState && matchesCity;
                })
                .slice(0, 10); // Limit to 10 results
            
            if (addresses.length > 0) {
                displayAddressSuggestions(addresses);
            } else {
                // No matches in selected city/state, show all results anyway
                const allAddresses = data.features.map(f => {
                    const address = f.address ? `${f.address} ${f.text}` : f.text;
                    const context = f.context || [];
                    const postcode = context.find(c => c.id.startsWith('postcode'))?.text || '';
                    const placeCity = context.find(c => c.id.startsWith('place'))?.text || city;
                    const regionCode = context.find(c => c.id.startsWith('region'))?.short_code?.replace('US-', '') || state;
                    
                    return {
                        street: address,
                        city: placeCity,
                        state: regionCode,
                        zipcode: postcode,
                        full: f.place_name
                    };
                }).slice(0, 10);
                
                displayAddressSuggestions(allAddresses);
            }
        } else {
            addressDropdown.style.display = 'none';
        }
    } catch (error) {
        console.error('Mapbox address error:', error);
        // Fallback to Nominatim
        fetchAddressSuggestionsNominatim(query, city, state);
    }
}

// Display address suggestions
function displayAddressSuggestions(addresses) {
    console.log('🎨 displayAddressSuggestions called with', addresses.length, 'addresses');
    
    addressDropdown.innerHTML = '';
    
    addresses.forEach(addr => {
        console.log('   Creating suggestion:', addr.street, 'ZIP:', addr.zipcode);
        
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        
        // Show ZIP code prominently if available
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #e4e4e4; margin-bottom: 3px;">${addr.street}</div>
                    <div style="font-size: 0.85em; color: #aaaaaa;">
                        ${addr.city}, ${addr.state}
                    </div>
                </div>
                ${addr.zipcode ? `
                    <div style="background: linear-gradient(135deg, #5288c1 0%, #3a6b9e 100%); padding: 6px 12px; border-radius: 6px; font-weight: 700; color: #fff; font-size: 0.95em; white-space: nowrap;">
                        ${addr.zipcode}
                    </div>
                ` : ''}
            </div>
        `;
        
        div.addEventListener('click', function() {
            console.log('   Address clicked:', addr.street);
            console.log('   place_id:', addr.place_id);
            
            addressInput.value = addr.street;
            addressDropdown.style.display = 'none';
            
            // Fetch ZIP code using Place Details API
            if (addr.place_id && googlePlacesService && zipcodeInput) {
                console.log('   🔍 Fetching place details for ZIP code...');
                
                googlePlacesService.getDetails({
                    placeId: addr.place_id,
                    fields: ['address_components']
                }, function(place, status) {
                    console.log('   📍 Place details status:', status);
                    
                    if (status === google.maps.places.PlacesServiceStatus.OK && place && place.address_components) {
                        console.log('   🏘️ Address components:', place.address_components);
                        
                        // Find postal_code component
                        const postalComponent = place.address_components.find(component => 
                            component.types.includes('postal_code')
                        );
                        
                        if (postalComponent) {
                            const zipCode = postalComponent.short_name;
                            console.log('   ✅ ZIP code found:', zipCode);
                            
                            // Fill ZIP code field
                            zipcodeInput.removeAttribute('readonly');
                            zipcodeInput.value = zipCode;
                            zipcodeInput.style.background = '#17212b';
                            zipcodeInput.style.color = '#e4e4e4';
                            zipcodeInput.style.cursor = 'default';
                            zipcodeInput.setAttribute('readonly', 'readonly');
                            
                            // Visual feedback
                            zipcodeInput.style.border = '2px solid #5288c1';
                            setTimeout(() => {
                                zipcodeInput.style.border = '';
                            }, 1000);
                        } else {
                            console.log('   ⚠️ No postal_code component found');
                        }
                    } else {
                        console.log('   ❌ Failed to fetch place details:', status);
                    }
                });
            } else {
                if (!addr.place_id) console.log('   ⚠️ No place_id available');
                if (!googlePlacesService) console.log('   ⚠️ PlacesService not initialized');
            }
        });
        
        addressDropdown.appendChild(div);
    });
    
    addressDropdown.style.display = 'block';
    console.log('✅ Address suggestions displayed');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (cityInput && cityDropdown && !cityInput.contains(e.target) && !cityDropdown.contains(e.target)) {
        cityDropdown.style.display = 'none';
    }
    if (addressInput && addressDropdown && !addressInput.contains(e.target) && !addressDropdown.contains(e.target)) {
        addressDropdown.style.display = 'none';
    }
});

// Add focus handler for city input
cityInput.addEventListener('focus', function() {
    if (!stateSelect.value) {
        cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">⚠️ Please select a state first</div>';
        cityDropdown.style.display = 'block';
    } else if (this.value.length === 0) {
        cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">💡 Start typing city name...</div>';
        cityDropdown.style.display = 'block';
    }
});

// Initialize on page load
initializeStates();

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide previous results/errors
    resultsDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    document.getElementById('squareFeetSection').style.display = 'none';
    
    // Show loader
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    
    // Get form data (WITHOUT square feet initially)
    const formData = {
        address: document.getElementById('address').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value,
        zipcode: document.getElementById('zipcode').value.trim()
    };
    
    try {
        // Get property details and valuation
        const propertyData = await getPropertyData(formData);
        console.log('📦 Full property data received:', propertyData);
        displayResults(propertyData, formData);
        console.log('✅ Display results completed');
    } catch (error) {
        console.error('🔴 Error in form submission:', error);
        showError(error.message);
    } finally {
        // Hide loader
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
});

// Handler for calculate button (when square feet is entered)
const calculateBtn = document.getElementById('calculateBtn');
if (calculateBtn) {
    calculateBtn.addEventListener('click', async function() {
    const squareFeetInput = document.getElementById('squareFeetInput');
    const squareFeet = parseInt(squareFeetInput.value);
    
    if (!squareFeet || squareFeet <= 0) {
        alert('Please enter a valid square footage');
        return;
    }
    
    // Hide square feet section
    document.getElementById('squareFeetSection').style.display = 'none';
    
    // Show loading
    resultsDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    
    try {
        const nearbyData = window.nearbyPropertyData;
        if (!nearbyData) {
            throw new Error('Area data lost. Please try the search again.');
        }
        
        // Calculate value
        const estimatedValue = nearbyData.avgPricePerSqft * squareFeet;
        
        console.log('💰 Calculated value:', estimatedValue, 'for', squareFeet, 'sqft');
        
        // Display calculated results
        const calculatedData = {
            property: null,
            avm: null,
            sales: null,
            assessment: null,
            schools: null,
            expanded: null,
            inputSquareFeet: squareFeet,
            calculatedValue: {
                value: estimatedValue,
                avgPricePerSqft: nearbyData.avgPricePerSqft,
                propertiesUsed: nearbyData.propertiesUsed,
                radius: nearbyData.radius,
                location: nearbyData.location,
                sampleProperties: nearbyData.sampleProperties
            }
        };
        
        displayResults(calculatedData, nearbyData.formData);
        
    } catch (error) {
        console.error('🔴 Error calculating value:', error);
        showError(error.message);
    }
    });
}

// Fetch property data from ATTOM API
async function getPropertyData(formData) {
    // Construct address string for API
    const addressString = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipcode}`;
    
    console.log('🔍 Searching for property:', addressString);
    
    try {
        // First, try to get property details using the address
        const propertyUrl = `${API_BASE_URL}/property/address?address1=${encodeURIComponent(formData.address)}&address2=${encodeURIComponent(formData.city + ', ' + formData.state + ' ' + formData.zipcode)}`;
        
        console.log('📡 API Request URL:', propertyUrl);
        
        const propertyResponse = await fetch(propertyUrl, {
            headers: {
                'apikey': API_KEY,
                'Accept': 'application/json'
            }
        });
        
        console.log('📥 API Response Status:', propertyResponse.status);
        
        if (!propertyResponse.ok || propertyResponse.status === 404) {
            console.warn('⚠️ Property not found at exact address, will show nearby data...');
            // If exact address not found, return info about nearby properties
            return await getNearbyPropertiesInfo(formData);
        }
        
        const propertyData = await propertyResponse.json();
        console.log('✅ Property Data:', propertyData);
        
        if (!propertyData.property || propertyData.property.length === 0) {
            console.warn('⚠️ No properties found in response, will show nearby data...');
            return await getNearbyPropertiesInfo(formData);
        }
        
        // Get the first property from results
        const property = propertyData.property[0];
        const attomId = property.identifier?.attomId;
        
        console.log('🆔 ATTOM ID:', attomId);
        console.log('🏠 Property found:', property.address);
        
        // Fetch all available data in parallel
        const [avmData, salesData, assessmentData, schoolData, expandedData] = await Promise.all([
            fetchAVM(attomId),
            fetchSalesHistory(attomId),
            fetchAssessmentHistory(attomId),
            fetchSchoolData(attomId),
            fetchExpandedProfile(attomId)
        ]);
        
        console.log('💰 AVM Data:', avmData);
        console.log('📊 Sales Data:', salesData);
        console.log('📋 Assessment Data:', assessmentData);
        console.log('🏫 School Data:', schoolData);
        console.log('📈 Expanded Data:', expandedData);
        
        return {
            property: property,
            avm: avmData,
            sales: salesData,
            assessment: assessmentData,
            schools: schoolData,
            expanded: expandedData,
            inputSquareFeet: formData.squareFeet
        };
        
    } catch (error) {
        console.error('🔴 Error in getPropertyData:', error);
        throw error;
    }
}

// Get info about nearby properties (without calculating yet)
async function getNearbyPropertiesInfo(formData) {
    try {
        console.log('🌐 Geocoding address for nearby search...');
        
        // First, geocode the address to get coordinates
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address + ', ' + formData.city + ', ' + formData.state + ' ' + formData.zipcode)}&format=json&limit=1`;
        
        const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
                'User-Agent': 'PropertyValuationApp/1.0'
            }
        });
        
        if (!geocodeResponse.ok) {
            throw new Error('Failed to geocode address');
        }
        
        const geocodeData = await geocodeResponse.json();
        
        if (!geocodeData || geocodeData.length === 0) {
            throw new Error('Could not find coordinates for this address. Please verify the address is correct.');
        }
        
        const lat = parseFloat(geocodeData[0].lat);
        const lon = parseFloat(geocodeData[0].lon);
        
        console.log('📍 Coordinates found:', lat, lon);
        console.log('🔎 Searching properties in ZIP code area...');
        
        // Instead of snapshot API, use ZIP code search for better data
        // Try to find properties in the same ZIP code
        const zipSearchUrl = `${API_BASE_URL}/property/address?address2=${encodeURIComponent(formData.city + ', ' + formData.state + ' ' + formData.zipcode)}`;
        
        console.log('🔍 ZIP Search URL:', zipSearchUrl);
        
        const zipResponse = await fetch(zipSearchUrl, {
            headers: {
                'apikey': API_KEY,
                'Accept': 'application/json'
            }
        });
        
        let nearbyData = null;
        
        if (zipResponse.ok) {
            nearbyData = await zipResponse.json();
            console.log('🏘️ Properties found by ZIP:', nearbyData);
        } else {
            console.log('⚠️ ZIP search failed, trying snapshot API...');
            
            // Fallback to snapshot API
            const radius = 1; // 1 mile
            const nearbyUrl = `${API_BASE_URL}/property/snapshot?latitude=${lat}&longitude=${lon}&radius=${radius}`;
            
            console.log('📡 Snapshot API URL:', nearbyUrl);
            
            const nearbyResponse = await fetch(nearbyUrl, {
                headers: {
                    'apikey': API_KEY,
                    'Accept': 'application/json'
                }
            });
            
            if (!nearbyResponse.ok) {
                const errorText = await nearbyResponse.text();
                console.log('❌ Snapshot API Error:', errorText);
                throw new Error(`Failed to find properties in the area. Status: ${nearbyResponse.status}`);
            }
            
            nearbyData = await nearbyResponse.json();
            console.log('🏘️ Nearby properties found by snapshot:', nearbyData);
            console.log('📊 Snapshot API status:', nearbyData.status);
        }
        
        console.log('📦 Total properties in response:', nearbyData.property?.length || 0);
        
        if (!nearbyData.property || nearbyData.property.length === 0) {
            throw new Error('No properties found within 1 mile radius of this address.');
        }
        
        // Filter out non-residential properties (hospitals, commercial, etc.)
        const residentialProperties = nearbyData.property.filter(prop => {
            const propType = prop.summary?.proptype?.toLowerCase() || '';
            const propClass = prop.summary?.propclass?.toLowerCase() || '';
            
            // Include residential types, exclude commercial/institutional
            const isResidential = (
                propType.includes('residential') || 
                propType.includes('single family') ||
                propType.includes('condo') ||
                propType.includes('townhouse') ||
                propClass === 'residential' ||
                propClass === 'r' ||
                (!propType.includes('commercial') && 
                 !propType.includes('industrial') && 
                 !propType.includes('hospital') &&
                 !propType.includes('institutional'))
            );
            
            return isResidential;
        });
        
        console.log(`🏘️ Filtered to ${residentialProperties.length} residential properties out of ${nearbyData.property.length} total`);
        
        if (residentialProperties.length === 0) {
            console.warn('⚠️ No residential properties found, using all properties');
            // Use all properties if no residential ones found
        } else {
            // Use residential properties only
            nearbyData.property = residentialProperties;
        }
        
        // Calculate average price per square foot from nearby properties
        const propertiesWithData = [];
        const propertiesDetails = [];
        
        nearbyData.property.forEach((prop, index) => {
            const building = prop.building;
            const sale = prop.sale;
            const assessment = prop.assessment;
            const avm = prop.avm; // AVM data might be in snapshot
            
            console.log(`🏠 Property ${index + 1}:`, {
                address: prop.address?.oneLine,
                building: building,
                sale: sale,
                assessment: assessment,
                avm: avm
            });
            
            // Get square footage
            const sqft = building?.size?.universalsize || building?.size?.livingsize;
            
            // Get price from multiple sources (priority order)
            const salePrice = sale?.amount?.saleamt;
            const avmValue = avm?.amount?.value; // AVM valuation
            const assessmentValue = assessment?.assessed?.assdttlvalue;
            const marketValue = assessment?.market?.mktttlvalue;
            
            // Use most reliable source: AVM > Recent Sale > Market Value > Assessment
            const price = avmValue || salePrice || marketValue || assessmentValue;
            
            propertiesDetails.push({
                address: prop.address?.oneLine || 'Unknown',
                sqft: sqft,
                salePrice: salePrice,
                avmValue: avmValue,
                assessmentValue: assessmentValue,
                marketValue: marketValue,
                finalPrice: price,
                source: avmValue ? 'AVM' : (salePrice ? 'Sale' : (marketValue ? 'Market' : (assessmentValue ? 'Assessment' : 'None')))
            });
            
            if (sqft && price && sqft > 0 && price > 0) {
                const pricePerSqft = price / sqft;
                propertiesWithData.push({
                    address: prop.address,
                    sqft: sqft,
                    price: price,
                    pricePerSqft: pricePerSqft,
                    source: avmValue ? 'AVM' : (salePrice ? 'Sale' : (marketValue ? 'Market' : 'Assessment'))
                });
            }
        });
        
        console.log('📋 All properties details:', propertiesDetails);
        console.log('💵 Properties with pricing data:', propertiesWithData);
        console.log(`✅ Found ${propertiesWithData.length} properties with valid price data out of ${nearbyData.property.length} total`);
        
        // If no properties with pricing data, try to fetch detailed data for each property
        if (propertiesWithData.length === 0 && nearbyData.property.length > 0) {
            console.log('⚠️ No pricing data in snapshot, fetching detailed AVM data for properties...');
            
            // Try to get detailed data for up to 10 properties
            const propertiesToFetch = nearbyData.property.slice(0, 10);
            console.log(`📞 Fetching detailed data for ${propertiesToFetch.length} properties...`);
            
            const detailedPromises = propertiesToFetch.map(async (prop, idx) => {
                const address = prop.address;
                if (!address) {
                    console.log(`  Property ${idx + 1}: No address data`);
                    return null;
                }
                
                try {
                    // Extract address components
                    const street = address.line1 || address.oneLine;
                    const city = address.locality;
                    const state = address.countrySubd;
                    const zip = address.postal1;
                    
                    if (!street || !city || !state) {
                        console.log(`  Property ${idx + 1}: Incomplete address - street: ${street}, city: ${city}, state: ${state}`);
                        return null;
                    }
                    
                    console.log(`  Property ${idx + 1}: ${street}, ${city}, ${state} ${zip}`);
                    
                    // Try AVM Detail endpoint with address parameters (CORRECT per documentation)
                    const address1 = street;
                    const address2 = `${city}, ${state}${zip ? ' ' + zip : ''}`;
                    const avmUrl = `${API_BASE_URL}/attomavm/detail?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`;
                    
                    console.log(`  → Trying AVM Detail: ${avmUrl}`);
                    
                    const avmResponse = await fetch(avmUrl, {
                        headers: {
                            'apikey': API_KEY,
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (avmResponse.ok) {
                        const avmData = await avmResponse.json();
                        const property = avmData.property?.[0];
                        
                        if (property) {
                            const sqft = property.building?.size?.universalsize || property.building?.size?.livingsize || property.building?.size?.bldgsize;
                            const avmValue = property.avm?.amount?.value;
                            const salePrice = property.sale?.amount?.saleamt;
                            const marketValue = property.assessment?.market?.mktttlvalue;
                            const assessedValue = property.assessment?.assessed?.assdttlvalue;
                            const price = avmValue || salePrice || marketValue || assessedValue;
                            
                            if (price && sqft && sqft > 0) {
                                const pricePerSqft = price / sqft;
                                const source = avmValue ? 'AVM' : (salePrice ? 'Sale' : (marketValue ? 'Market' : 'Assessment'));
                                
                                console.log(`  ✅ Property ${idx + 1}: $${price.toLocaleString()} (${sqft} sqft, $${pricePerSqft.toFixed(2)}/sqft) [${source}]`);
                                
                                return {
                                    address: property.address,
                                    sqft: sqft,
                                    price: price,
                                    pricePerSqft: pricePerSqft,
                                    source: source
                                };
                            } else {
                                console.log(`  ⚠️ Property ${idx + 1}: AVM returned but missing pricing - price: ${price}, sqft: ${sqft}`);
                            }
                        } else {
                            console.log(`  ⚠️ Property ${idx + 1}: AVM response has no property data`);
                        }
                    } else {
                        console.log(`  ⚠️ Property ${idx + 1}: AVM Detail failed (${avmResponse.status})`);
                        const errorText = await avmResponse.text();
                        console.log(`  Error details:`, errorText);
                    }
                    
                    // Try Assessment Detail endpoint as fallback
                    console.log(`  → Trying Assessment Detail...`);
                    const assessUrl = `${API_BASE_URL}/assessment/detail?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`;
                    
                    const assessResponse = await fetch(assessUrl, {
                        headers: {
                            'apikey': API_KEY,
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (assessResponse.ok) {
                        const assessData = await assessResponse.json();
                        const property = assessData.property?.[0];
                        
                        if (property) {
                            const sqft = property.building?.size?.universalsize || property.building?.size?.livingsize || property.building?.size?.bldgsize;
                            const marketValue = property.assessment?.market?.mktttlvalue;
                            const assessedValue = property.assessment?.assessed?.assdttlvalue;
                            const salePrice = property.sale?.amount?.saleamt;
                            const price = salePrice || marketValue || assessedValue;
                            
                            if (price && sqft && sqft > 0) {
                                const pricePerSqft = price / sqft;
                                const source = salePrice ? 'Sale' : (marketValue ? 'Market' : 'Assessment');
                                
                                console.log(`  ✅ Property ${idx + 1}: $${price.toLocaleString()} (${sqft} sqft, $${pricePerSqft.toFixed(2)}/sqft) [${source}]`);
                                
                                return {
                                    address: property.address,
                                    sqft: sqft,
                                    price: price,
                                    pricePerSqft: pricePerSqft,
                                    source: source
                                };
                            }
                        }
                    } else {
                        console.log(`  ⚠️ Property ${idx + 1}: Assessment Detail failed (${assessResponse.status})`);
                    }
                    
                } catch (error) {
                    console.log(`  ❌ Property ${idx + 1}: Error:`, error.message);
                }
                return null;
            });
            
            const detailedResults = await Promise.all(detailedPromises);
            const validDetailed = detailedResults.filter(r => r !== null);
            
            console.log(`📊 Detailed pricing data fetched: ${validDetailed.length} valid out of ${propertiesToFetch.length}`);
            
            if (validDetailed.length > 0) {
                propertiesWithData.push(...validDetailed);
            }
        }
        
        if (propertiesWithData.length === 0) {
            // Show more helpful error with what we found
            const propertiesCount = nearbyData.property.length;
            console.log('📋 All property details:', propertiesDetails);
            console.log('⚠️ ATTOM API Issue: Found properties but no price data available');
            console.log('🔍 Sample property structure:', nearbyData.property[0]);
            console.log('🔍 Check if properties have: avm, sale, assessment, or market values');
            console.log('💡 Tip: Some areas may only have partial data. Try a different major city address.');
            throw new Error(`Found ${propertiesCount} properties in the area, but pricing data is not available. This area may not have sufficient data in ATTOM database. Please try a different address in a major city.`);
        }
        
        // Calculate average price per sqft
        const avgPricePerSqft = propertiesWithData.reduce((sum, p) => sum + p.pricePerSqft, 0) / propertiesWithData.length;
        
        console.log('📊 Average price per sqft:', avgPricePerSqft);
        
        // Return data WITHOUT calculating final value (no squareFeet yet)
        return {
            property: null,
            avm: null,
            sales: null,
            assessment: null,
            schools: null,
            expanded: null,
            needsSquareFeet: true, // Flag that we need square feet input
            nearbyData: {
                avgPricePerSqft: avgPricePerSqft,
                propertiesUsed: propertiesWithData.length,
                radius: 1, // Always 1 mile radius
                location: {
                    lat: lat,
                    lon: lon
                },
                sampleProperties: propertiesWithData.slice(0, 5), // First 5 for display
                formData: formData // Store for later calculation
            }
        };
        
    } catch (error) {
        console.error('🔴 Error getting nearby properties info:', error);
        throw error;
    }
}

// Calculate property value based on nearby properties (within 1 mile radius)
async function calculateFromNearbyProperties(formData) {
    try {
        console.log('🌐 Geocoding address for nearby search...');
        
        // First, geocode the address to get coordinates
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address + ', ' + formData.city + ', ' + formData.state + ' ' + formData.zipcode)}&format=json&limit=1`;
        
        const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
                'User-Agent': 'PropertyValuationApp/1.0'
            }
        });
        
        if (!geocodeResponse.ok) {
            throw new Error('Failed to geocode address');
        }
        
        const geocodeData = await geocodeResponse.json();
        
        if (!geocodeData || geocodeData.length === 0) {
            throw new Error('Could not find coordinates for this address. Please verify the address is correct.');
        }
        
        const lat = parseFloat(geocodeData[0].lat);
        const lon = parseFloat(geocodeData[0].lon);
        
        console.log('📍 Coordinates found:', lat, lon);
        console.log('🔎 Searching properties within 1 mile radius...');
        
        // Search for properties within 1 mile radius using ATTOM API
        const radius = 1; // 1 mile
        const nearbyUrl = `${API_BASE_URL}/property/snapshot?latitude=${lat}&longitude=${lon}&radius=${radius}`;
        
        const nearbyResponse = await fetch(nearbyUrl, {
            headers: {
                'apikey': API_KEY,
                'Accept': 'application/json'
            }
        });
        
        if (!nearbyResponse.ok) {
            throw new Error(`Failed to find properties in the area. Status: ${nearbyResponse.status}`);
        }
        
        const nearbyData = await nearbyResponse.json();
        console.log('🏘️ Nearby properties found:', nearbyData);
        
        if (!nearbyData.property || nearbyData.property.length === 0) {
            throw new Error('No properties found within 1 mile radius of this address.');
        }
        
        // Calculate average price per square foot from nearby properties
        const propertiesWithData = [];
        
        nearbyData.property.forEach(prop => {
            const building = prop.building;
            const sale = prop.sale;
            const assessment = prop.assessment;
            
            // Get square footage
            const sqft = building?.size?.universalsize || building?.size?.livingsize;
            
            // Get latest sale price or assessment value
            const salePrice = sale?.amount?.saleamt;
            const assessmentValue = assessment?.assessed?.assdttlvalue;
            const price = salePrice || assessmentValue;
            
            if (sqft && price && sqft > 0) {
                const pricePerSqft = price / sqft;
                propertiesWithData.push({
                    address: prop.address,
                    sqft: sqft,
                    price: price,
                    pricePerSqft: pricePerSqft
                });
            }
        });
        
        console.log('💵 Properties with pricing data:', propertiesWithData);
        
        if (propertiesWithData.length === 0) {
            throw new Error('No pricing data found for properties in the area.');
        }
        
        // Calculate average price per sqft
        const avgPricePerSqft = propertiesWithData.reduce((sum, p) => sum + p.pricePerSqft, 0) / propertiesWithData.length;
        
        console.log('📊 Average price per sqft:', avgPricePerSqft);
        console.log('📐 Input square feet:', formData.squareFeet);
        
        // Calculate estimated value
        const estimatedValue = avgPricePerSqft * formData.squareFeet;
        
        console.log('💰 Estimated value:', estimatedValue);
        
        return {
            property: null,
            avm: null,
            sales: null,
            assessment: null,
            schools: null,
            expanded: null,
            inputSquareFeet: formData.squareFeet,
            calculatedValue: {
                value: estimatedValue,
                avgPricePerSqft: avgPricePerSqft,
                propertiesUsed: propertiesWithData.length,
                radius: radius,
                location: {
                    lat: lat,
                    lon: lon
                },
                sampleProperties: propertiesWithData.slice(0, 5) // First 5 for display
            }
        };
        
    } catch (error) {
        console.error('🔴 Error calculating from nearby properties:', error);
        throw error;
    }
}

// Fetch AVM (Automated Valuation Model) data
async function fetchAVM(attomId) {
    if (!attomId) {
        console.log('ℹ️ No ATTOM ID for AVM request');
        return null;
    }
    try {
        const avmUrl = `${API_BASE_URL}/attomavm/detail?id=${attomId}`;
        
        const response = await fetch(avmUrl, {
            headers: {
                'apikey': API_KEY,
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ AVM Data available');
            return data;
        } else if (response.status === 404) {
            console.log('ℹ️ AVM not available for this property (404) - це нормально, використовуємо інші джерела');
        } else {
            console.log('ℹ️ AVM not available, status:', response.status);
        }
    } catch (error) {
        console.log('ℹ️ AVM fetch error:', error.message);
    }
    return null;
}

// Fetch sales history
async function fetchSalesHistory(attomId) {
    if (!attomId) return null;
    try {
        const salesUrl = `${API_BASE_URL}/saleshistory/detail?id=${attomId}`;
        const response = await fetch(salesUrl, {
            headers: {
                'apikey': API_KEY,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            console.log('✅ Sales history available');
            return await response.json();
        } else if (response.status === 404) {
            console.log('ℹ️ Sales history not available (404)');
        }
    } catch (error) {
        console.log('ℹ️ Sales history fetch error:', error.message);
    }
    return null;
}

// Fetch assessment history
async function fetchAssessmentHistory(attomId) {
    if (!attomId) return null;
    try {
        const assessmentUrl = `${API_BASE_URL}/assessmenthistory/detail?id=${attomId}`;
        const response = await fetch(assessmentUrl, {
            headers: {
                'apikey': API_KEY,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            console.log('✅ Assessment history available');
            return await response.json();
        } else if (response.status === 404) {
            console.log('ℹ️ Assessment history not available (404)');
        }
    } catch (error) {
        console.log('ℹ️ Assessment history fetch error:', error.message);
    }
    return null;
}

// Fetch school data
async function fetchSchoolData(attomId) {
    if (!attomId) return null;
    try {
        const schoolUrl = `https://api.gateway.attomdata.com/propertyapi/v4/property/detailwithschools?id=${attomId}`;
        const response = await fetch(schoolUrl, {
            headers: {
                'apikey': API_KEY,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            console.log('✅ School data available');
            return await response.json();
        } else if (response.status === 404) {
            console.log('ℹ️ School data not available (404)');
        }
    } catch (error) {
        console.log('ℹ️ School data fetch error:', error.message);
    }
    return null;
}

// Fetch expanded property profile
async function fetchExpandedProfile(attomId) {
    if (!attomId) return null;
    try {
        const expandedUrl = `${API_BASE_URL}/property/expandedprofile?id=${attomId}`;
        const response = await fetch(expandedUrl, {
            headers: {
                'apikey': API_KEY,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            console.log('✅ Expanded profile available');
            return await response.json();
        } else if (response.status === 404) {
            console.log('ℹ️ Expanded profile not available (404)');
        }
    } catch (error) {
        console.log('ℹ️ Expanded profile fetch error:', error.message);
    }
    return null;
}

// Display results
async function displayResults(data, formData) {
    console.log('🎨 Starting displayResults function');
    console.log('📥 Data received:', data);
    
    const { property, avm, sales, assessment, schools, expanded, calculatedValue, needsSquareFeet, nearbyData } = data;
    
    // Check if we need to show area-based preliminary results
    if (needsSquareFeet && nearbyData) {
        console.log('📝 Calling showPreliminaryResults with nearby data');
        
        // Check if showPreliminaryResults exists (from HTML file)
        if (typeof window.showPreliminaryResults === 'function') {
            window.showPreliminaryResults(data);
            return;
        }
        
        // Fallback: show basic square feet input section if showPreliminaryResults not available
        const squareFeetSection = document.getElementById('squareFeetSection');
        const squareFeetMessage = document.getElementById('squareFeetMessage');
        
        if (squareFeetSection && squareFeetMessage) {
            const formattedPricePerSqft = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(nearbyData.avgPricePerSqft);
            
            squareFeetMessage.innerHTML = `
                ⚠️ <strong>Exact address not found in database.</strong><br>
                We found <strong>${nearbyData.propertiesUsed} properties</strong> within ${nearbyData.radius} mile radius of the address.<br>
                Average area price: <strong>${formattedPricePerSqft} per sq ft</strong>.<br><br>
                Enter your property's square footage to calculate estimated value.
            `;
            
            squareFeetSection.style.display = 'block';
            squareFeetSection.scrollIntoView({ behavior: 'smooth' });
            
            // Store nearby data for later use
            window.nearbyPropertyData = nearbyData;
        } else {
            console.error('❌ Neither showPreliminaryResults nor squareFeetSection available');
        }
        
        return;
    }
    
    // Check if this is a calculated value (user entered square feet)
    if (calculatedValue) {
        let calcHTML = '<div class="section-card"><h2>💰 Розрахована оцінка вартості</h2>';
        calcHTML += '<div class="alert info">⚠️ Точну адресу не знайдено в базі. Вартість розрахована на основі середніх цін у районі.</div>';
        
        const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(calculatedValue.value);
        const formattedPricePerSqft = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(calculatedValue.avgPricePerSqft);
        
        calcHTML += `
            <div class="value-display">
                <div class="value-amount">${formattedValue}</div>
                <div class="value-label">Розрахована вартість</div>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Площа будинку:</span>
                    <span class="info-value">${data.inputSquareFeet.toLocaleString()} кв. футів</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Середня ціна за кв. фут:</span>
                    <span class="info-value">${formattedPricePerSqft}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Проаналізовано будинків:</span>
                    <span class="info-value">${calculatedValue.propertiesUsed} шт.</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Радіус пошуку:</span>
                    <span class="info-value">${calculatedValue.radius} миля</span>
                </div>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #17212b; border-radius: 8px; border: 1px solid #2b3847;">
                <h4 style="margin: 0 0 10px 0; color: #5288c1;">📐 Формула розрахунку:</h4>
                <p style="margin: 0; font-size: 1.1em; color: #e4e4e4;">${formattedValue} = ${data.inputSquareFeet.toLocaleString()} кв. фт. × ${formattedPricePerSqft}/кв. фт.</p>
            </div>
        `;
        
        // Show sample properties used in calculation
        if (calculatedValue.sampleProperties && calculatedValue.sampleProperties.length > 0) {
            calcHTML += '<h4 style="margin-top: 20px; color: #e4e4e4;">🏘️ Приклади будинків, використаних для розрахунку:</h4>';
            calcHTML += '<div style="display: grid; gap: 15px;">';
            calculatedValue.sampleProperties.forEach(prop => {
                const propPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(prop.price);
                const propPricePerSqft = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(prop.pricePerSqft);
                
                calcHTML += `
                    <div style="border-left: 3px solid #5288c1; padding: 10px 15px; background: #17212b; border-radius: 4px; border: 1px solid #2b3847;">
                        <div style="font-weight: 600; margin-bottom: 5px; color: #e4e4e4;">${prop.address?.oneLine || 'N/A'}</div>
                        <div style="font-size: 0.9em; color: #aaaaaa;">
                            ${prop.sqft.toLocaleString()} кв. фт. • ${propPrice} • ${propPricePerSqft}/кв. фт.
                        </div>
                    </div>
                `;
            });
            calcHTML += '</div>';
        }
        
        calcHTML += '</div>';
        document.getElementById('valuationInfo').innerHTML = calcHTML;
        
        // Hide other sections since we don't have specific property data
        document.getElementById('propertyInfo').innerHTML = '';
        document.getElementById('salesInfo').innerHTML = '';
        document.getElementById('assessmentInfo').innerHTML = '';
        document.getElementById('schoolInfo').innerHTML = '';
        document.getElementById('neighborhoodInfo').innerHTML = '';
        document.getElementById('ownerInfo').innerHTML = '';
        
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth' })
        return;
    }
    
    console.log('🏠 Property:', property);
    console.log('🎨 Displaying results for property:', property?.address);
    
    // Get valuation
    let estimatedValue = null;
    let pricePerSqFt = null;
    let avmConfidence = null;
    let valueSource = 'Unknown';
    
    if (avm && avm.property && avm.property[0] && avm.property[0].avm) {
        // Use AVM value if available
        const avmAmount = avm.property[0].avm.amount;
        if (avmAmount && avmAmount.value) {
            estimatedValue = avmAmount.value;
            avmConfidence = avm.property[0].avm.eventDate || null;
            valueSource = 'AVM (Automated Valuation Model)';
            console.log('💰 Using AVM value:', estimatedValue);
        }
    }
    
    if (!estimatedValue && property.assessment && property.assessment.market) {
        // Fallback to assessment market value
        estimatedValue = property.assessment.market.mktttlvalue;
        valueSource = 'Tax Assessment';
        console.log('💰 Using tax assessment value:', estimatedValue);
    }
    
    if (!estimatedValue && property.sale && property.sale.amount && property.sale.amount.saleamt) {
        // Fallback to last sale amount
        estimatedValue = property.sale.amount.saleamt;
        valueSource = 'Last Sale Price';
        console.log('💰 Using last sale price:', estimatedValue);
    }
    
    // Calculate price per square foot - витягуємо ВСІ можливі джерела площі
    console.log('🔍 Full property object:', property);
    console.log('🔍 Building data:', property.building);
    console.log('🔍 Summary data:', property.summary);
    
    const squareFeet = property.building?.size?.bldgsize 
        || property.building?.size?.grosssize
        || property.building?.size?.grosssizeadjusted
        || property.building?.size?.livingsize
        || property.building?.size?.universalsize
        || property.summary?.bldgsqft
        || property.lot?.lotsize2  // Іноді площа може бути тут
        || formData.squareFeet;
    
    console.log('📐 Square feet:', squareFeet, 'Sources:', {
        bldgsize: property.building?.size?.bldgsize,
        grosssize: property.building?.size?.grosssize,
        livingsize: property.building?.size?.livingsize,
        universalsize: property.building?.size?.universalsize,
        summary: property.summary?.bldgsqft,
        lotsize2: property.lot?.lotsize2
    });
    
    if (estimatedValue && squareFeet) {
        pricePerSqFt = (estimatedValue / squareFeet).toFixed(2);
        console.log('📊 Price per sq ft:', pricePerSqFt);
    }
    
    // If still no value, show error instead of fake estimation
    if (!estimatedValue) {
        console.error('❌ No valuation data available from any source');
        console.log('📊 Property data:', property);
        console.log('💰 AVM:', avm);
        console.log('📋 Assessment:', property.assessment);
        console.log('🏷️ Sale:', property.sale);
        showError('Не вдалося отримати оцінку вартості для цієї нерухомості. Дані оцінки недоступні в базі ATTOM. Спробуйте іншу адресу або зверніться до професійного оцінювача.');
        return;
    }
    
    console.log('✅ Estimated value found:', estimatedValue, 'Source:', valueSource);
    
    // Отримуємо середню ціну в районі (1.5 милі)
    let avgAreaPricePerSqft = null;
    let areaPropertiesCount = 0;
    
    try {
        const lat = property.location?.latitude;
        const lon = property.location?.longitude;
        
        console.log('📍 Property coordinates:', lat, lon);
        
        if (lat && lon) {
            console.log('🌍 Fetching area average price (1.5 mile radius)...');
            const radius = 1.5; // 1.5 miles
            const nearbyUrl = `${API_BASE_URL}/property/snapshot?latitude=${lat}&longitude=${lon}&radius=${radius}`;
            console.log('🔗 Nearby URL:', nearbyUrl);
            
            const nearbyResponse = await fetch(nearbyUrl, {
                headers: {
                    'apikey': API_KEY,
                    'Accept': 'application/json'
                }
            });
            
            console.log('📡 Nearby response status:', nearbyResponse.status);
            
            if (nearbyResponse.ok) {
                const nearbyData = await nearbyResponse.json();
                console.log('📦 Nearby data:', nearbyData);
                console.log('🏘️ Properties found:', nearbyData.property?.length || 0);
                
                const pricesPerSqft = [];
                
                // Для кожного сусіднього будинку отримуємо детальні дані
                if (nearbyData.property && nearbyData.property.length > 0) {
                    const detailPromises = nearbyData.property.slice(0, 10).map(async (prop) => {
                        try {
                            const attomId = prop.identifier?.attomId;
                            if (!attomId) return null;
                            
                            // Отримуємо AVM дані для кожного будинку
                            const avmUrl = `${API_BASE_URL}/attomavm/detail?id=${attomId}`;
                            const avmResp = await fetch(avmUrl, {
                                headers: {
                                    'apikey': API_KEY,
                                    'Accept': 'application/json'
                                }
                            });
                            
                            if (avmResp.ok) {
                                const avmData = await avmResp.json();
                                const sqft = prop.building?.size?.universalsize || prop.building?.size?.livingsize || prop.building?.size?.bldgsize;
                                const avmValue = avmData.property?.[0]?.avm?.amount?.value;
                                
                                if (sqft && avmValue && sqft > 0 && avmValue > 0) {
                                    return { sqft, price: avmValue };
                                }
                            }
                        } catch (e) {
                            console.log('⚠️ Failed to fetch AVM for property:', e.message);
                        }
                        return null;
                    });
                    
                    const results = await Promise.all(detailPromises);
                    console.log('📊 AVM results:', results);
                    
                    results.forEach((result, index) => {
                        if (result) {
                            const pricePerSqft = result.price / result.sqft;
                            pricesPerSqft.push(pricePerSqft);
                            console.log(`Property ${index + 1}: sqft=${result.sqft}, price=${result.price}, $/sqft=${pricePerSqft.toFixed(2)}`);
                        }
                    });
                }
                
                console.log('📊 Valid prices collected:', pricesPerSqft.length);
                
                if (pricesPerSqft.length > 0) {
                    avgAreaPricePerSqft = (pricesPerSqft.reduce((a, b) => a + b, 0) / pricesPerSqft.length).toFixed(2);
                    areaPropertiesCount = pricesPerSqft.length;
                    console.log('💵 Average area price:', avgAreaPricePerSqft, 'from', areaPropertiesCount, 'properties');
                } else {
                    console.warn('⚠️ No valid properties found with both price and square footage data');
                }
            } else {
                console.error('❌ Nearby API failed with status:', nearbyResponse.status);
            }
        } else {
            console.warn('⚠️ No coordinates available for this property');
        }
    } catch (error) {
        console.error('⚠️ Could not fetch area average:', error);
    }
    
    // Format address
    const address = property.address;
    const fullAddress = `${address.line1 || formData.address}, ${address.locality || formData.city}, ${address.countrySubd || formData.state} ${address.postal1 || formData.zipcode}`;
    
    // Get property details
    const propertyType = property.summary?.proptype || 'N/A';
    const yearBuilt = property.summary?.yearbuilt || 'N/A';
    const lotSize = property.lot?.lotsize1 || 'N/A';
    const bedrooms = property.building?.rooms?.beds || 'N/A';
    const bathrooms = property.building?.rooms?.bathstotal || 'N/A';
    const stories = property.building?.construction?.stories || 'N/A';
    const parking = property.building?.parking?.prkgSpaces || 'N/A';
    const pool = property.building?.interior?.pooldesc || 'Немає';
    const heating = property.utilities?.heatingtype || 'N/A';
    const cooling = property.utilities?.coolingtype || 'N/A';
    
    // Build main valuation HTML - АКЦЕНТ НА ВАРТОСТІ
    let valuationHTML = '<div class="section-card valuation-main">';
    valuationHTML += `
        <div class="value-display-large">
            <div class="value-amount-large">$${Number(estimatedValue).toLocaleString('en-US')}</div>
            <div class="value-label-large">Орієнтовна вартість нерухомості</div>
        </div>
        <div class="value-secondary-info">
            ${squareFeet ? `
            <div class="secondary-item">
                <span class="secondary-label">Площа:</span>
                <span class="secondary-value">${Number(squareFeet).toLocaleString('en-US')} кв. фт</span>
            </div>
            ` : ''}
            ${pricePerSqFt ? `
            <div class="secondary-item">
                <span class="secondary-label">Ціна за кв. фут:</span>
                <span class="secondary-value">$${Number(pricePerSqFt).toLocaleString('en-US')}</span>
            </div>
            ` : ''}
            ${avgAreaPricePerSqft ? `
            <div class="secondary-item">
                <span class="secondary-label">Середня ціна в районі (1.5 милі):</span>
                <span class="secondary-value">$${Number(avgAreaPricePerSqft).toLocaleString('en-US')}/кв.фт</span>
            </div>
            <div class="secondary-item">
                <span class="secondary-label">Проаналізовано будинків:</span>
                <span class="secondary-value">${areaPropertiesCount} шт</span>
            </div>
            ` : ''}
            <div class="secondary-item">
                <span class="secondary-label">Джерело оцінки:</span>
                <span class="secondary-value">${valueSource}</span>
            </div>
        </div>
        <div class="address-info">
            <span class="address-icon">📍</span>
            <span class="address-text">${fullAddress}</span>
        </div>
    </div>`;
    
    document.getElementById('valuationInfo').innerHTML = valuationHTML;
    
    // Build property info HTML - другорядна інформація
    let propertyHTML = '<div class="section-card property-details-secondary"><h3>🏠 Додаткові деталі</h3>';
    propertyHTML += '<div class="info-grid">';
    propertyHTML += `
        <div class="info-item">
            <span class="info-label">Тип нерухомості:</span>
            <span class="info-value">${propertyType}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Рік побудови:</span>
            <span class="info-value">${yearBuilt}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Спальні:</span>
            <span class="info-value">${bedrooms}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Ванні кімнати:</span>
            <span class="info-value">${bathrooms}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Поверхів:</span>
            <span class="info-value">${stories}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Паркувальні місця:</span>
            <span class="info-value">${parking}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Розмір ділянки:</span>
            <span class="info-value">${lotSize} кв. футів</span>
        </div>
        <div class="info-item">
            <span class="info-label">Басейн:</span>
            <span class="info-value">${pool}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Опалення:</span>
            <span class="info-value">${heating}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Кондиціонування:</span>
            <span class="info-value">${cooling}</span>
        </div>
    `;
    
    // Додаткові характеристики з різних джерел
    if (property.building?.construction) {
        const constr = property.building.construction;
        if (constr.walltype) {
            propertyHTML += `
            <div class="info-item">
                <span class="info-label">Тип стін:</span>
                <span class="info-value">${constr.walltype}</span>
            </div>`;
        }
        if (constr.roofcover) {
            propertyHTML += `
            <div class="info-item">
                <span class="info-label">Покрівля:</span>
                <span class="info-value">${constr.roofcover}</span>
            </div>`;
        }
        if (constr.foundationtype) {
            propertyHTML += `
            <div class="info-item">
                <span class="info-label">Фундамент:</span>
                <span class="info-value">${constr.foundationtype}</span>
            </div>`;
        }
    }
    
    if (property.building?.interior) {
        const interior = property.building.interior;
        if (interior.fplccount && interior.fplccount > 0) {
            propertyHTML += `
            <div class="info-item">
                <span class="info-label">Камінів:</span>
                <span class="info-value">${interior.fplccount}</span>
            </div>`;
        }
    }
    
    if (property.utilities) {
        if (property.utilities.watertype) {
            propertyHTML += `
            <div class="info-item">
                <span class="info-label">Водопостачання:</span>
                <span class="info-value">${property.utilities.watertype}</span>
            </div>`;
        }
        if (property.utilities.sewertype) {
            propertyHTML += `
            <div class="info-item">
                <span class="info-label">Каналізація:</span>
                <span class="info-value">${property.utilities.sewertype}</span>
            </div>`;
        }
    }
    
    propertyHTML += '</div></div>';
    
    document.getElementById('propertyInfo').innerHTML = propertyHTML;
    
    console.log('✅ Results displayed successfully');
    
    // Display sales history
    displaySalesHistory(sales);
    
    // Display assessment history
    displayAssessmentHistory(assessment);
    
    // Display school information
    displaySchoolInfo(schools);
    
    // Display neighborhood data
    displayNeighborhoodData(expanded, property);
    
    // Display owner information
    displayOwnerInfo(property);
    displayOwnerInfo(property);
    
    // Show results
    resultsDiv.style.display = 'block';
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Display extended property details
function displayExtendedDetails(property, lotSize, bedrooms, bathrooms, stories, parking, pool, heating, cooling) {
    const extendedHTML = `
        <div class="section-card">
            <h3>📋 Детальна інформація про нерухомість</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">🛏️ Спальні:</span>
                    <span class="info-value">${bedrooms}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🚿 Ванні:</span>
                    <span class="info-value">${bathrooms}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📏 Площа ділянки:</span>
                    <span class="info-value">${lotSize !== 'N/A' ? Number(lotSize).toLocaleString('en-US') + ' кв. футів' : 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🏢 Поверхів:</span>
                    <span class="info-value">${stories}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🚗 Паркувальних місць:</span>
                    <span class="info-value">${parking}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🏊 Басейн:</span>
                    <span class="info-value">${pool}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🔥 Опалення:</span>
                    <span class="info-value">${heating}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">❄️ Кондиціонування:</span>
                    <span class="info-value">${cooling}</span>
                </div>
            </div>
        </div>
    `;
    document.getElementById('extendedDetails').innerHTML = extendedHTML;
}

// Display sales history
function displaySalesHistory(sales) {
    if (!sales || !sales.property || !sales.property[0] || !sales.property[0].salehistory) {
        document.getElementById('salesInfo').innerHTML = '';
        return;
    }
    
    const salesData = sales.property[0].salehistory;
    
    // Перевірка чи є хоч якісь дані
    const hasData = salesData.some(sale => sale.amount?.saleamt);
    
    if (!hasData) {
        document.getElementById('salesInfo').innerHTML = '';
        return;
    }
    
    let salesHTML = '<div class="section-card"><h3>📊 Історія продажів</h3><div class="table-container"><table class="data-table"><thead><tr><th>Дата</th><th>Ціна</th><th>Тип угоди</th></tr></thead><tbody>';
    
    salesData.forEach(sale => {
        const date = sale.amount?.salerecdate || 'N/A';
        const price = sale.amount?.saleamt ? `$${Number(sale.amount.saleamt).toLocaleString('en-US')}` : 'N/A';
        const type = sale.amount?.saletranstype || 'N/A';
        salesHTML += `<tr><td>${date}</td><td>${price}</td><td>${type}</td></tr>`;
    });
    
    salesHTML += '</tbody></table></div></div>';
    document.getElementById('salesInfo').innerHTML = salesHTML;
}

// Display assessment history
function displayAssessmentHistory(assessment) {
    if (!assessment || !assessment.property || !assessment.property[0] || !assessment.property[0].assessmenthistory) {
        document.getElementById('assessmentInfo').innerHTML = '';
        return;
    }
    
    const assessmentData = assessment.property[0].assessmenthistory;
    
    // Перевірка чи є хоч якісь дані
    const hasData = assessmentData.some(assess => 
        assess.assessed?.assdlandvalue || 
        assess.assessed?.assdimpvalue || 
        assess.assessed?.assdttlvalue
    );
    
    if (!hasData) {
        document.getElementById('assessmentInfo').innerHTML = '';
        return;
    }
    
    let assessHTML = '<div class="section-card"><h3>💰 Історія податкових оцінок</h3><div class="table-container"><table class="data-table"><thead><tr><th>Рік</th><th>Оцінка землі</th><th>Оцінка будівлі</th><th>Загальна оцінка</th></tr></thead><tbody>';
    
    assessmentData.forEach(assess => {
        const year = assess.tax?.taxyear || 'N/A';
        const land = assess.assessed?.assdlandvalue ? `$${Number(assess.assessed.assdlandvalue).toLocaleString('en-US')}` : 'N/A';
        const building = assess.assessed?.assdimpvalue ? `$${Number(assess.assessed.assdimpvalue).toLocaleString('en-US')}` : 'N/A';
        const total = assess.assessed?.assdttlvalue ? `$${Number(assess.assessed.assdttlvalue).toLocaleString('en-US')}` : 'N/A';
        assessHTML += `<tr><td>${year}</td><td>${land}</td><td>${building}</td><td>${total}</td></tr>`;
    });
    
    assessHTML += '</tbody></table></div></div>';
    document.getElementById('assessmentInfo').innerHTML = assessHTML;
}

// Display school information
function displaySchoolInfo(schools) {
    if (!schools || !schools.school || schools.school.length === 0) {
        document.getElementById('schoolInfo').innerHTML = '';
        return;
    }
    
    let schoolHTML = '<div class="section-card"><h3>🏫 Школи поблизу</h3><div class="schools-grid">';
    
    schools.school.forEach(school => {
        const name = school.schoolname || 'N/A';
        const district = school.districtname || 'N/A';
        const grade = school.fipisgrade || 'N/A';
        const distance = school.distance ? `${Number(school.distance).toFixed(2)} миль` : 'N/A';
        const rating = school.greatschoolrating || 'N/A';
        
        schoolHTML += `
            <div class="school-card">
                <h4>${name}</h4>
                <p><strong>Район:</strong> ${district}</p>
                <p><strong>Класи:</strong> ${grade}</p>
                <p><strong>Відстань:</strong> ${distance}</p>
                ${rating !== 'N/A' ? `<p><strong>Рейтинг:</strong> ⭐ ${rating}/10</p>` : ''}
            </div>
        `;
    });
    
    schoolHTML += '</div></div>';
    document.getElementById('schoolInfo').innerHTML = schoolHTML;
}

// Display neighborhood data
function displayNeighborhoodData(expanded, property) {
    let neighborhoodHTML = '<div class="section-card"><h3>🏘️ Інформація про район</h3>';
    
    if (expanded && expanded.property && expanded.property[0]) {
        const prop = expanded.property[0];
        const area = prop.area;
        
        if (area) {
            neighborhoodHTML += '<div class="info-grid">';
            
            if (area.medianhouseholdincomecy) {
                neighborhoodHTML += `
                    <div class="info-item">
                        <span class="info-label">💵 Середній дохід:</span>
                        <span class="info-value">$${Number(area.medianhouseholdincomecy).toLocaleString('en-US')}</span>
                    </div>
                `;
            }
            
            if (area.medianage) {
                neighborhoodHTML += `
                    <div class="info-item">
                        <span class="info-label">👥 Середній вік:</span>
                        <span class="info-value">${area.medianage} років</span>
                    </div>
                `;
            }
            
            if (area.population) {
                neighborhoodHTML += `
                    <div class="info-item">
                        <span class="info-label">👨‍👩‍👧‍👦 Населення:</span>
                        <span class="info-value">${Number(area.population).toLocaleString('en-US')}</span>
                    </div>
                `;
            }
            
            neighborhoodHTML += '</div>';
        }
    }
    
    // Add location data from main property
    if (property.location) {
        const loc = property.location;
        neighborhoodHTML += '<div class="info-grid" style="margin-top: 15px;">';
        
        if (loc.latitude && loc.longitude) {
            neighborhoodHTML += `
                <div class="info-item">
                    <span class="info-label">📍 Координати:</span>
                    <span class="info-value">${loc.latitude}, ${loc.longitude}</span>
                </div>
            `;
        }
        
        if (loc.elevation) {
            neighborhoodHTML += `
                <div class="info-item">
                    <span class="info-label">⛰️ Висота:</span>
                    <span class="info-value">${loc.elevation} футів</span>
                </div>
            `;
        }
        
        neighborhoodHTML += '</div>';
    }
    
    neighborhoodHTML += '</div>';
    document.getElementById('neighborhoodInfo').innerHTML = neighborhoodHTML;
}

// Display owner information
function displayOwnerInfo(property) {
    if (!property.owner || !property.owner.owner1) {
        document.getElementById('ownerInfo').innerHTML = '';
        return;
    }
    
    const owner = property.owner.owner1;
    let ownerHTML = '<div class="section-card"><h3>👤 Інформація про власника</h3><div class="info-grid">';
    
    if (owner.firstname || owner.lastname) {
        const fullName = `${owner.firstname || ''} ${owner.lastname || ''}`.trim();
        ownerHTML += `
            <div class="info-item">
                <span class="info-label">Ім'я:</span>
                <span class="info-value">${fullName}</span>
            </div>
        `;
    }
    
    if (property.sale?.amount?.salerecdate) {
        ownerHTML += `
            <div class="info-item">
                <span class="info-label">Дата покупки:</span>
                <span class="info-value">${property.sale.amount.salerecdate}</span>
            </div>
        `;
    }
    
    ownerHTML += '</div></div>';
    document.getElementById('ownerInfo').innerHTML = ownerHTML;
}

// Show error message
// Show error message
function showError(message) {
    if (!errorDiv) {
        console.error('Error div not found');
        alert(`❌ ${message}`);
        return;
    }
    errorDiv.textContent = `❌ ${message}`;
    errorDiv.style.display = 'block';
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
