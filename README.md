# Zomato Analytics Dashboard - Streamlit Version

A comprehensive restaurant analytics dashboard built with Streamlit, converted from the original HTML/CSS/JavaScript version.

## Features

- 📊 Interactive charts and visualizations
- 🔍 Advanced filtering (city, price range, rating, search)
- 📈 Key metrics and statistics
- 🏪 Detailed restaurant table with sorting
- 📱 Responsive design

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure `zomato.csv` is in the same directory as `app.py`

## Running the Application

```bash
streamlit run app.py
```

The dashboard will open in your browser at `http://localhost:8501`

## Deployment Options

### Streamlit Cloud (Recommended)
1. Push your code to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your GitHub repository
4. Deploy with one click

### Local Development
```bash
streamlit run app.py --server.port 8501
```

### Docker (Optional)
```bash
# Build image
docker build -t zomato-dashboard .

# Run container
docker run -p 8501:8501 zomato-dashboard
```

## File Structure
```
├── app.py              # Main Streamlit application
├── requirements.txt    # Python dependencies
├── zomato.csv         # Dataset
└── README.md          # This file
```

## Charts Included
- Rating Distribution (Pie Chart)
- Top Cities by Restaurant Count (Bar Chart)
- Price Range Distribution (Pie Chart)
- Popular Cuisines (Horizontal Bar Chart)
- Online Services Availability (Bar Chart)
- Average Cost by City (Line Chart)

## Data Processing
The app automatically handles:
- Missing data cleaning
- Data type conversions
- Boolean field processing
- Cuisine splitting and counting