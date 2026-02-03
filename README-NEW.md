# Cash Home Buyer - Property Valuation System

Modern property valuation website for cash home buyers with instant property estimates.

## 🚀 Features

- **Residential Property Valuation** - Get instant cash offers for houses
- **Land Valuation** - Evaluate vacant land and lots
- **Google Places Autocomplete** - Easy address input with ZIP auto-fill
- **ATTOM Data Integration** - Real property data and AVM valuations
- **Area Analysis** - Average pricing based on nearby properties
- **Mobile Responsive** - Works on all devices

## 📋 Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd "ALEX USA"
```

### 2. Configure API Keys

Copy the example config file:
```bash
copy config.example.js config.js
```

Edit `config.js` and add your API keys:
```javascript
const CONFIG = {
    ATTOM_API_KEY: 'your-attom-api-key-here',
    GOOGLE_PLACES_API_KEY: 'your-google-places-api-key-here'
};
```

### 3. Get API Keys

**ATTOM Data API:**
- Sign up at https://api.developer.attomdata.com/
- Free tier available with limited requests
- Get your API key from dashboard

**Google Places API:**
- Go to https://console.cloud.google.com/google/maps-apis/start
- Enable Places API
- Create API key (restrict to your domain)
- Free $200/month credit (~100,000 autocomplete requests)

### 4. Run Local Server

```bash
python -m http.server 8080
```

Or use any web server. Open http://localhost:8080

## 📁 Project Structure

```
├── config.js              # API keys (NOT in Git)
├── config.example.js      # Example config template
├── script.js             # Main application logic
├── styles.css            # Global styles
├── valuation-residential.html  # Residential property page
├── valuation-land.html         # Land valuation page
└── README.md             # This file
```

## 🔒 Security

- **config.js** is in .gitignore - never commit API keys
- Use **config.example.js** as template
- Restrict API keys to your domain in Google Cloud Console
- Monitor API usage in ATTOM dashboard

## 🛠️ How It Works

1. User enters property address
2. Google Places API provides autocomplete and ZIP codes
3. System geocodes address via Nominatim
4. ATTOM API searches for property data
5. If exact address found: Shows property details with AVM valuation
6. If not found: Analyzes nearby properties and calculates area average
7. Displays price estimate and lead form

## 📊 API Endpoints Used

**ATTOM Data API:**
- `/property/address` - Search by address
- `/property/snapshot` - Nearby properties
- `/attomavm/detail` - AVM valuation
- `/assessment/detail` - Tax assessment data

**Google Places API:**
- Autocomplete Service - Address suggestions
- Place Details - ZIP code extraction

## ⚙️ Configuration

Edit `script.js` to customize:
- Search radius (default: 1 mile)
- Price calculation logic
- UI text and labels

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions, contact the development team.
