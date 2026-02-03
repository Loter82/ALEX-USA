// API Configuration
const API_KEY = '89ce29e3f588213a695f4c6badc9284e';
const API_BASE_URL = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

// Mapbox API for geocoding (free tier available - you can replace with your own key)
// Register at https://www.mapbox.com/ to get your free API key
const MAPBOX_API_KEY = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example'; // Replace with real key
const USE_MAPBOX = false; // Set to true when you have Mapbox key

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
    clearTimeout(cityTimeout);
    const query = this.value.trim();
    const selectedState = stateSelect.value;
    
    // Clear dropdown if state not selected
    if (!selectedState) {
        cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">Спочатку оберіть штат</div>';
        cityDropdown.style.display = 'block';
        return;
    }
    
    // Show suggestions starting from 1 character
    if (query.length < 1) {
        cityDropdown.style.display = 'none';
        return;
    }
    
    // Show loading indicator
    cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">⏳ Пошук міст...</div>';
    cityDropdown.style.display = 'block';
    
    cityTimeout = setTimeout(() => {
        if (USE_MAPBOX) {
            fetchCitySuggestionsMapbox(query, selectedState);
        } else {
            fetchCitySuggestionsNominatim(query, selectedState);
        }
    }, 200);
});

// Address autocomplete with full street names and numbers
let addressTimeout;
addressInput.addEventListener('input', function() {
    clearTimeout(addressTimeout);
    const query = this.value.trim();
    const selectedCity = cityInput.value.trim();
    const selectedState = stateSelect.value;
    
    if (query.length < 3 || !selectedCity || !selectedState) {
        addressDropdown.style.display = 'none';
        return;
    }
    
    addressTimeout = setTimeout(() => {
        if (USE_MAPBOX) {
            fetchAddressSuggestionsMapbox(query, selectedCity, selectedState);
        } else {
            fetchAddressSuggestionsNominatim(query, selectedCity, selectedState);
        }
    }, 300);
});

// OpenStreetMap Nominatim (free, no API key needed)
async function fetchCitySuggestionsNominatim(query, stateCode) {
    try {
        const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;
        
        // Use Photon API - optimized for autocomplete
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=30&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`;
        
        console.log('Searching cities with Photon:', query, 'in', stateName);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Photon API error');
        }
        
        const data = await response.json();
        console.log('Photon response:', data);
        
        if (data && data.features && data.features.length > 0) {
            // Extract unique cities from the selected state
            const cities = [];
            const seenCities = new Set();
            const queryLower = query.toLowerCase();
            
            data.features.forEach(feature => {
                const props = feature.properties;
                const city = props.name;
                const state = props.state;
                const postcode = props.postcode;
                const countryCode = props.countrycode;
                
                // Filter by USA and selected state
                if (city && state && countryCode === 'US' && 
                    state.toLowerCase() === stateName.toLowerCase() && 
                    !seenCities.has(city.toLowerCase())) {
                    
                    seenCities.add(city.toLowerCase());
                    
                    // Add relevance score: 1 if starts with query, 0 otherwise
                    const relevance = city.toLowerCase().startsWith(queryLower) ? 1 : 0;
                    
                    cities.push({
                        name: city,
                        state: stateCode,
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
                cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">Міста не знайдені в цьому штаті</div>';
                cityDropdown.style.display = 'block';
            }
        } else {
            cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">Міста не знайдені</div>';
            cityDropdown.style.display = 'block';
        }
    } catch (error) {
        console.error('City suggestions error:', error);
        cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #f44;">❌ Помилка завантаження</div>';
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
    cityDropdown.innerHTML = '';
    
    // Add count header if many results
    if (cities.length > 5) {
        const header = document.createElement('div');
        header.style.padding = '8px 15px';
        header.style.fontSize = '0.85em';
        header.style.color = '#667eea';
        header.style.fontWeight = '600';
        header.style.borderBottom = '1px solid #e0e0e0';
        header.textContent = `Знайдено міст: ${cities.length}`;
        cityDropdown.appendChild(header);
    }
    
    // Show max 15 cities
    const displayCities = cities.slice(0, 15);
    const query = cityInput.value.trim().toLowerCase();
    
    displayCities.forEach(city => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        
        // Highlight matching text
        const cityName = city.name;
        const lowerCityName = cityName.toLowerCase();
        const matchIndex = lowerCityName.indexOf(query);
        
        if (matchIndex !== -1 && query.length > 0) {
            const before = cityName.substring(0, matchIndex);
            const match = cityName.substring(matchIndex, matchIndex + query.length);
            const after = cityName.substring(matchIndex + query.length);
            div.innerHTML = `${before}<strong style="color: #667eea;">${match}</strong>${after}, ${city.state}`;
        } else {
            div.textContent = `${cityName}, ${city.state}`;
        }
        
        div.addEventListener('click', function() {
            cityInput.value = city.name;
            cityDropdown.style.display = 'none';
            
            // Auto-fill zipcode if available
            if (city.postcode) {
                zipcodeInput.value = city.postcode;
            }
            
            // Focus on next field
            zipcodeInput.focus();
        });
        
        cityDropdown.appendChild(div);
    });
    
    cityDropdown.style.display = 'block';
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

// Fetch address suggestions using Mapbox
async function fetchAddressSuggestionsMapbox(query, city, state) {
    try {
        const searchQuery = `${query} ${city} ${state}`;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?country=US&types=address&limit=10&access_token=${MAPBOX_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const addresses = data.features.map(f => {
                const address = f.address ? `${f.address} ${f.text}` : f.text;
                const context = f.context || [];
                const postcode = context.find(c => c.id.startsWith('postcode'))?.text || '';
                const cityName = context.find(c => c.id.startsWith('place'))?.text || city;
                
                return {
                    street: address,
                    city: cityName,
                    state: state,
                    zipcode: postcode,
                    full: f.place_name
                };
            });
            
            displayAddressSuggestions(addresses);
        } else {
            addressDropdown.style.display = 'none';
        }
    } catch (error) {
        console.log('Mapbox address suggestions error:', error);
        addressDropdown.style.display = 'none';
    }
}

// Display address suggestions
function displayAddressSuggestions(addresses) {
    addressDropdown.innerHTML = '';
    
    addresses.forEach(addr => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.innerHTML = `
            <div style="font-weight: 600;">${addr.street}</div>
            <div style="font-size: 0.85em; color: #666;">${addr.city}, ${addr.state} ${addr.zipcode}</div>
        `;
        
        div.addEventListener('click', function() {
            addressInput.value = addr.street;
            if (addr.zipcode && !zipcodeInput.value) {
                zipcodeInput.value = addr.zipcode;
            }
            addressDropdown.style.display = 'none';
        });
        
        addressDropdown.appendChild(div);
    });
    
    addressDropdown.style.display = 'block';
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!cityInput.contains(e.target) && !cityDropdown.contains(e.target)) {
        cityDropdown.style.display = 'none';
    }
    if (!addressInput.contains(e.target) && !addressDropdown.contains(e.target)) {
        addressDropdown.style.display = 'none';
    }
});

// Add focus handler for city input
cityInput.addEventListener('focus', function() {
    if (!stateSelect.value) {
        cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">⚠️ Спочатку оберіть штат</div>';
        cityDropdown.style.display = 'block';
    } else if (this.value.length === 0) {
        cityDropdown.innerHTML = '<div class="autocomplete-item" style="color: #999;">💡 Почніть вводити назву міста...</div>';
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
document.getElementById('calculateBtn').addEventListener('click', async function() {
    const squareFeetInput = document.getElementById('squareFeetInput');
    const squareFeet = parseInt(squareFeetInput.value);
    
    if (!squareFeet || squareFeet <= 0) {
        alert('Будь ласка, введіть коректну площу будинку');
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
            throw new Error('Дані про район втрачено. Спробуйте пошук ще раз.');
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
            throw new Error('Не вдалося геокодувати адресу');
        }
        
        const geocodeData = await geocodeResponse.json();
        
        if (!geocodeData || geocodeData.length === 0) {
            throw new Error('Не вдалося знайти координати для даної адреси. Перевірте правильність написання.');
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
            
            const nearbyResponse = await fetch(nearbyUrl, {
                headers: {
                    'apikey': API_KEY,
                    'Accept': 'application/json'
                }
            });
            
            if (!nearbyResponse.ok) {
                throw new Error(`Не вдалося знайти будинки в районі. Статус: ${nearbyResponse.status}`);
            }
            
            nearbyData = await nearbyResponse.json();
            console.log('🏘️ Nearby properties found by snapshot:', nearbyData);
        }
        
        console.log('📦 Total properties in response:', nearbyData.property?.length || 0);
        
        if (!nearbyData.property || nearbyData.property.length === 0) {
            throw new Error('Не знайдено будинків в радіусі 1 милі від даної адреси.');
        }
        
        // Calculate average price per square foot from nearby properties
        const propertiesWithData = [];
        const propertiesDetails = [];
        
        nearbyData.property.forEach((prop, index) => {
            const building = prop.building;
            const sale = prop.sale;
            const assessment = prop.assessment;
            
            console.log(`🏠 Property ${index + 1}:`, {
                address: prop.address?.oneLine,
                building: building,
                sale: sale,
                assessment: assessment
            });
            
            // Get square footage
            const sqft = building?.size?.universalsize || building?.size?.livingsize;
            
            // Get latest sale price or assessment value
            const salePrice = sale?.amount?.saleamt;
            const assessmentValue = assessment?.assessed?.assdttlvalue;
            const marketValue = assessment?.market?.mktttlvalue;
            const price = salePrice || assessmentValue || marketValue;
            
            propertiesDetails.push({
                address: prop.address?.oneLine || 'Unknown',
                sqft: sqft,
                salePrice: salePrice,
                assessmentValue: assessmentValue,
                marketValue: marketValue,
                finalPrice: price
            });
            
            if (sqft && price && sqft > 0 && price > 0) {
                const pricePerSqft = price / sqft;
                propertiesWithData.push({
                    address: prop.address,
                    sqft: sqft,
                    price: price,
                    pricePerSqft: pricePerSqft
                });
            }
        });
        
        console.log('📋 All properties details:', propertiesDetails);
        console.log('💵 Properties with pricing data:', propertiesWithData);
        console.log(`✅ Found ${propertiesWithData.length} properties with valid price data out of ${nearbyData.property.length} total`);
        
        // If no properties with pricing data, try to fetch detailed data for each property
        if (propertiesWithData.length === 0 && nearbyData.property.length > 0) {
            console.log('⚠️ No pricing data in snapshot, fetching detailed data for properties...');
            
            // Try to get detailed data for first 5 properties
            const detailedPromises = nearbyData.property.slice(0, 5).map(async (prop) => {
                const attomId = prop.identifier?.attomId;
                if (!attomId) return null;
                
                try {
                    // Fetch AVM data which usually has valuation
                    const avmUrl = `${API_BASE_URL}/attomavm/detail?id=${attomId}`;
                    const avmResponse = await fetch(avmUrl, {
                        headers: {
                            'apikey': API_KEY,
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (avmResponse.ok) {
                        const avmData = await avmResponse.json();
                        const avmValue = avmData.property?.[0]?.avm?.amount?.value;
                        const building = prop.building;
                        const sqft = building?.size?.universalsize || building?.size?.livingsize;
                        
                        if (avmValue && sqft && sqft > 0) {
                            return {
                                address: prop.address,
                                sqft: sqft,
                                price: avmValue,
                                pricePerSqft: avmValue / sqft
                            };
                        }
                    }
                } catch (error) {
                    console.log('Failed to fetch AVM for property:', attomId, error);
                }
                return null;
            });
            
            const detailedResults = await Promise.all(detailedPromises);
            const validDetailed = detailedResults.filter(r => r !== null);
            
            console.log('📊 Detailed pricing data fetched:', validDetailed);
            
            if (validDetailed.length > 0) {
                propertiesWithData.push(...validDetailed);
            }
        }
        
        if (propertiesWithData.length === 0) {
            // Show more helpful error with what we found
            const propertiesCount = nearbyData.property.length;
            throw new Error(`Знайдено ${propertiesCount} будинків в районі, але не вдалося отримати дані про ціни. Цей район може не мати достатньо даних в базі ATTOM. Спробуйте іншу адресу.`);
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
            throw new Error('Не вдалося геокодувати адресу');
        }
        
        const geocodeData = await geocodeResponse.json();
        
        if (!geocodeData || geocodeData.length === 0) {
            throw new Error('Не вдалося знайти координати для даної адреси. Перевірте правильність написання.');
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
            throw new Error(`Не вдалося знайти будинки в районі. Статус: ${nearbyResponse.status}`);
        }
        
        const nearbyData = await nearbyResponse.json();
        console.log('🏘️ Nearby properties found:', nearbyData);
        
        if (!nearbyData.property || nearbyData.property.length === 0) {
            throw new Error('Не знайдено будинків в радіусі 1 милі від даної адреси.');
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
            throw new Error('Не знайдено даних про ціни будинків в районі.');
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
function displayResults(data, formData) {
    console.log('🎨 Starting displayResults function');
    console.log('📥 Data received:', data);
    
    const { property, avm, sales, assessment, schools, expanded, calculatedValue, needsSquareFeet, nearbyData } = data;
    
    // Check if we need to show square feet input form
    if (needsSquareFeet && nearbyData) {
        console.log('📝 Showing square feet input form');
        
        // Show the square feet input section
        const squareFeetSection = document.getElementById('squareFeetSection');
        const squareFeetMessage = document.getElementById('squareFeetMessage');
        
        const formattedPricePerSqft = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(nearbyData.avgPricePerSqft);
        
        squareFeetMessage.innerHTML = `
            ⚠️ <strong>Точну адресу не знайдено в базі даних.</strong><br>
            Ми знайшли <strong>${nearbyData.propertiesUsed} будинків</strong> в радіусі ${nearbyData.radius} милі від вказаної адреси.<br>
            Середня ціна в районі: <strong>${formattedPricePerSqft} за кв. фут</strong>.<br><br>
            Введіть площу вашого будинку для розрахунку орієнтовної вартості.
        `;
        
        squareFeetSection.style.display = 'block';
        squareFeetSection.scrollIntoView({ behavior: 'smooth' });
        
        // Store nearby data for later use
        window.nearbyPropertyData = nearbyData;
        
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
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0;">📐 Формула розрахунку:</h4>
                <p style="margin: 0; font-size: 1.1em;">${formattedValue} = ${data.inputSquareFeet.toLocaleString()} кв. фт. × ${formattedPricePerSqft}/кв. фт.</p>
            </div>
        `;
        
        // Show sample properties used in calculation
        if (calculatedValue.sampleProperties && calculatedValue.sampleProperties.length > 0) {
            calcHTML += '<h4 style="margin-top: 20px;">🏘️ Приклади будинків, використаних для розрахунку:</h4>';
            calcHTML += '<div style="display: grid; gap: 15px;">';
            calculatedValue.sampleProperties.forEach(prop => {
                const propPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(prop.price);
                const propPricePerSqft = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(prop.pricePerSqft);
                
                calcHTML += `
                    <div style="border-left: 3px solid #667eea; padding: 10px 15px; background: white; border-radius: 4px;">
                        <div style="font-weight: 600; margin-bottom: 5px;">${prop.address?.oneLine || 'N/A'}</div>
                        <div style="font-size: 0.9em; color: #666;">
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
    
    // Calculate price per square foot
    const squareFeet = property.building && property.building.size && property.building.size.bldgsize 
        ? property.building.size.bldgsize 
        : formData.squareFeet;
    
    console.log('📐 Square feet:', squareFeet);
    
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
    
    // Format address
    const address = property.address;
    const fullAddress = `${address.line1 || formData.address}, ${address.locality || formData.city}, ${address.countrySubd || formData.state} ${address.postal1 || formData.zipcode}`;
    
    // Get property details
    const propertyType = property.summary?.proptype || 'N/A';
    const yearBuilt = property.summary?.yearbuilt || 'N/A';
    const lotSize = property.lot?.lotsize1 || 'N/A';
    const bedrooms = property.building?.rooms?.beds || formData.bedrooms || 'N/A';
    const bathrooms = property.building?.rooms?.bathstotal || formData.bathrooms || 'N/A';
    const stories = property.building?.construction?.stories || 'N/A';
    const parking = property.building?.parking?.prkgSpaces || 'N/A';
    const pool = property.building?.interior?.pooldesc || 'Немає';
    const heating = property.utilities?.heatingtype || 'N/A';
    const cooling = property.utilities?.coolingtype || 'N/A';
    
    // Update main values
    document.getElementById('estimatedValue').textContent = estimatedValue 
        ? `$${Number(estimatedValue).toLocaleString('en-US')}` 
        : 'Недоступно';
    document.getElementById('resultAddress').textContent = fullAddress;
    document.getElementById('resultSquareFeet').textContent = `${Number(squareFeet).toLocaleString('en-US')} кв. футів`;
    document.getElementById('pricePerSqFt').textContent = pricePerSqFt 
        ? `$${Number(pricePerSqFt).toLocaleString('en-US')}/кв. фут` 
        : 'N/A';
    document.getElementById('propertyType').textContent = propertyType;
    document.getElementById('yearBuilt').textContent = yearBuilt;
    
    console.log('✅ Results displayed successfully');
    
    // Display extended property details
    displayExtendedDetails(property, lotSize, bedrooms, bathrooms, stories, parking, pool, heating, cooling);
    
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
        document.getElementById('salesHistory').innerHTML = '<div class="section-card"><p>📊 Історія продажів недоступна</p></div>';
        return;
    }
    
    const salesData = sales.property[0].salehistory;
    let salesHTML = '<div class="section-card"><h3>📊 Історія продажів</h3><div class="table-container"><table class="data-table"><thead><tr><th>Дата</th><th>Ціна</th><th>Тип угоди</th></tr></thead><tbody>';
    
    salesData.forEach(sale => {
        const date = sale.amount?.salerecdate || 'N/A';
        const price = sale.amount?.saleamt ? `$${Number(sale.amount.saleamt).toLocaleString('en-US')}` : 'N/A';
        const type = sale.amount?.saletranstype || 'N/A';
        salesHTML += `<tr><td>${date}</td><td>${price}</td><td>${type}</td></tr>`;
    });
    
    salesHTML += '</tbody></table></div></div>';
    document.getElementById('salesHistory').innerHTML = salesHTML;
}

// Display assessment history
function displayAssessmentHistory(assessment) {
    if (!assessment || !assessment.property || !assessment.property[0] || !assessment.property[0].assessmenthistory) {
        document.getElementById('assessmentHistory').innerHTML = '<div class="section-card"><p>💰 Історія оцінок недоступна</p></div>';
        return;
    }
    
    const assessmentData = assessment.property[0].assessmenthistory;
    let assessHTML = '<div class="section-card"><h3>💰 Історія податкових оцінок</h3><div class="table-container"><table class="data-table"><thead><tr><th>Рік</th><th>Оцінка землі</th><th>Оцінка будівлі</th><th>Загальна оцінка</th></tr></thead><tbody>';
    
    assessmentData.forEach(assess => {
        const year = assess.tax?.taxyear || 'N/A';
        const land = assess.assessed?.assdlandvalue ? `$${Number(assess.assessed.assdlandvalue).toLocaleString('en-US')}` : 'N/A';
        const building = assess.assessed?.assdimpvalue ? `$${Number(assess.assessed.assdimpvalue).toLocaleString('en-US')}` : 'N/A';
        const total = assess.assessed?.assdttlvalue ? `$${Number(assess.assessed.assdttlvalue).toLocaleString('en-US')}` : 'N/A';
        assessHTML += `<tr><td>${year}</td><td>${land}</td><td>${building}</td><td>${total}</td></tr>`;
    });
    
    assessHTML += '</tbody></table></div></div>';
    document.getElementById('assessmentHistory').innerHTML = assessHTML;
}

// Display school information
function displaySchoolInfo(schools) {
    if (!schools || !schools.school || schools.school.length === 0) {
        document.getElementById('schoolInfo').innerHTML = '<div class="section-card"><p>🏫 Інформація про школи недоступна</p></div>';
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
    document.getElementById('neighborhoodData').innerHTML = neighborhoodHTML;
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
function showError(message) {
    errorDiv.textContent = `❌ ${message}`;
    errorDiv.style.display = 'block';
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
