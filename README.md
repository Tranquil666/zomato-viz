# 🍽️ Zomato Analytics Dashboard - Modern Web Application

A comprehensive restaurant analytics dashboard built with Flask backend and modern vanilla JavaScript frontend. This application provides powerful insights into restaurant data with interactive visualizations, real-time filtering, and export capabilities.

## ✨ Features

### 📊 Interactive Analytics
- **Real-time Charts**: Dynamic visualizations using Chart.js
- **Smart Filtering**: City, price range, rating, and text search
- **Live Updates**: Instant data refresh without page reload
- **Responsive Design**: Works perfectly on desktop and mobile

### 🎯 Advanced Insights
- **Rating Distribution**: Comprehensive breakdown of restaurant ratings
- **Geographic Analysis**: Top cities by restaurant count
- **Price Analysis**: Cost distribution and city-wise averages
- **Cuisine Trends**: Most popular cuisine types
- **Service Analytics**: Online delivery and booking availability

### 💡 Smart Features
- **AI-Powered Insights**: Automatic trend detection and recommendations
- **Data Export**: CSV, JSON, and printable reports
- **Search & Sort**: Advanced table functionality
- **Error Handling**: Robust error management with user feedback

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone or download the project**
   ```bash
   cd "c:\Users\faisa\Downloads\zomato viz"
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Ensure data file exists**
   - Make sure `zomato.csv` is in the project directory
   - The file should contain restaurant data with proper headers

### Running the Application

1. **Start the Flask server**
   ```bash
   python server.py
   ```

2. **Open your browser**
   - Navigate to `http://localhost:5000`
   - The dashboard will load automatically

## 📁 Project Structure

```
zomato-viz/
├── server.py           # Flask backend API server
├── app.js             # Modern JavaScript frontend
├── index.html         # Main HTML template
├── styles.css         # Enhanced CSS styling
├── requirements.txt   # Python dependencies
├── zomato.csv        # Restaurant dataset
├── README.md         # This documentation
└── legacy files/     # Original Streamlit implementation
    ├── app.py        # (Legacy Streamlit app)
    └── script.js     # (Legacy vanilla JS)
```

## 🔧 API Endpoints

The Flask backend provides RESTful API endpoints:

- `GET /` - Main dashboard page
- `GET /api/data` - Restaurant data with filtering
- `GET /api/stats` - Dashboard statistics
- `GET /api/analytics/rating-distribution` - Rating breakdown
- `GET /api/analytics/top-cities` - City rankings
- `GET /api/analytics/price-distribution` - Price analysis
- `GET /api/analytics/popular-cuisines` - Cuisine trends
- `GET /api/analytics/services` - Service availability
- `GET /api/analytics/cost-by-city` - Cost analysis
- `GET /api/filters/cities` - Available cities
- `GET /api/insights` - AI-generated insights

## 🎨 UI/UX Improvements

### Modern Design
- **Glass-morphism Effects**: Frosted glass appearance with backdrop blur
- **Gradient Backgrounds**: Beautiful color transitions
- **Smooth Animations**: Hover effects and transitions
- **Typography**: Inter font for better readability

### Enhanced Interactions
- **Debounced Search**: Optimized search with 300ms delay
- **Loading States**: Visual feedback during data loading
- **Error Messages**: User-friendly error notifications
- **Responsive Tables**: Mobile-optimized data tables

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Friendly**: Proper ARIA labels
- **High Contrast**: Excellent color contrast ratios
- **Print Optimization**: Clean print layouts

## 📊 Data Processing

The application handles:
- **Multiple Encodings**: Automatic detection (latin-1, utf-8, etc.)
- **Data Cleaning**: Missing value handling and type conversion
- **Boolean Processing**: Service availability flags
- **Cuisine Parsing**: Multi-cuisine restaurant support
- **Real-time Filtering**: Server-side filtering for performance

## 🔍 Advanced Features

### Smart Insights Engine
- Automatically identifies top-rated restaurants
- Detects most expensive cities
- Highlights popular cuisine trends
- Provides actionable recommendations

### Export Capabilities
- **CSV Export**: Complete dataset download
- **JSON Export**: API-friendly format
- **Print Reports**: Professional PDF-ready layouts
- **Custom Filtering**: Export filtered data only

### Performance Optimizations
- **Caching**: Server-side data caching
- **Debouncing**: Optimized user input handling
- **Lazy Loading**: Progressive data loading
- **Compression**: Gzipped responses

## 🛠️ Development

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run in development mode
python server.py

# The server will run on http://localhost:5000
# Debug mode is enabled by default
```

### Customization
- **Colors**: Modify CSS variables in `styles.css`
- **Charts**: Customize Chart.js configurations in `app.js`
- **API**: Extend endpoints in `server.py`
- **Insights**: Add custom insight logic in the insights endpoint

## 🐛 Troubleshooting

### Common Issues

1. **CSV File Not Found**
   - Ensure `zomato.csv` is in the project root
   - Check file permissions

2. **Port Already in Use**
   - Change port in `server.py` (default: 5000)
   - Kill existing processes: `taskkill /f /im python.exe`

3. **Data Loading Errors**
   - Verify CSV file encoding
   - Check for malformed data rows

4. **Charts Not Loading**
   - Ensure internet connection for CDN resources
   - Check browser console for JavaScript errors

### Performance Tips
- Use modern browsers for best performance
- Close unnecessary browser tabs
- Ensure adequate system memory (2GB+ recommended)

## 📈 Future Enhancements

- **Real-time Data**: WebSocket integration for live updates
- **Machine Learning**: Predictive analytics and recommendations
- **User Authentication**: Multi-user support with saved preferences
- **Advanced Filters**: Date ranges, custom queries
- **Data Visualization**: 3D charts and geographic maps
- **Mobile App**: Progressive Web App (PWA) support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Chart.js** for beautiful visualizations
- **Flask** for the robust backend framework
- **Font Awesome** for icons
- **Inter Font** for typography
- **Zomato** for the dataset

---

**Built with ❤️ for data visualization and restaurant analytics**
