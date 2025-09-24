from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
from data_imputation import impute_missing_services
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Global variable to store processed data
restaurant_data = None

def load_data_on_startup():
    """Load data when the application starts up"""
    global restaurant_data
    
    logger.info("Loading restaurant data on application startup...")
    
    if not os.path.exists('zomato.csv'):
        logger.error("zomato.csv file not found! Data cannot be loaded.")
        return False
    
    success = load_and_process_data()
    if success:
        logger.info("Data successfully loaded on startup!")
    else:
        logger.error("Failed to load data on startup. Will attempt to load on first API request.")
    
    return success

# Load data when the app starts
load_data_on_startup()

def ensure_data_loaded():
    """Ensure data is loaded, loading it if necessary"""
    global restaurant_data
    
    if restaurant_data is None:
        logger.info("Data not loaded, attempting to load now...")
        load_data_on_startup()
        
        # If still None after loading attempt, return False
        if restaurant_data is None:
            return False
    
    return True

def load_and_process_data():
    """Load and process the Zomato dataset"""
    global restaurant_data
    
    try:
        logger.info("Starting data loading process...")
        
        # Check if file exists
        if not os.path.exists('zomato.csv'):
            raise Exception("zomato.csv file not found in the current directory")
        
        # Try different encodings
        encodings = ['latin-1', 'utf-8', 'iso-8859-1', 'cp1252']
        df = None
        
        for encoding in encodings:
            try:
                logger.info(f"Attempting to load CSV with {encoding} encoding...")
                df = pd.read_csv('zomato.csv', encoding=encoding)
                logger.info(f"Data loaded successfully using {encoding} encoding. Shape: {df.shape}")
                break
            except UnicodeDecodeError as e:
                logger.warning(f"Failed to load with {encoding} encoding: {e}")
                continue
            except Exception as e:
                logger.error(f"Error loading CSV with {encoding} encoding: {e}")
                continue
        
        if df is None:
            raise Exception("Could not read CSV with any supported encoding")
        
        logger.info("Starting data cleaning and processing...")
        
        # Clean and process data
        initial_count = len(df)
        df = df.dropna(subset=['Restaurant Name'])
        logger.info(f"Removed {initial_count - len(df)} rows with missing restaurant names")
        
        df['Restaurant Name'] = df['Restaurant Name'].fillna('Unknown')
        df['City'] = df['City'].fillna('Unknown')
        df['Cuisines'] = df['Cuisines'].fillna('Unknown')
        df['Aggregate rating'] = pd.to_numeric(df['Aggregate rating'], errors='coerce').fillna(0)
        df['Votes'] = pd.to_numeric(df['Votes'], errors='coerce').fillna(0)
        df['Average Cost for two'] = pd.to_numeric(df['Average Cost for two'], errors='coerce').fillna(0)
        df['Price range'] = pd.to_numeric(df['Price range'], errors='coerce').fillna(0)
        
        logger.info("Processing service columns...")
        
        # Preserve original service columns to identify true NaNs later
        original_services = df[['Has Table booking', 'Has Online delivery', 'Is delivering now']].copy()

        # Boolean columns - fill NaNs before converting to boolean
        df['Has Table booking'] = df['Has Table booking'].fillna('No').str.lower() == 'yes'
        df['Has Online delivery'] = df['Has Online delivery'].fillna('No').str.lower() == 'yes'
        df['Is delivering now'] = df['Is delivering now'].fillna('No').str.lower() == 'yes'
        
        logger.info("Starting data imputation...")
        
        # Impute missing services data using the original state
        df = impute_missing_services(df, original_services)

        restaurant_data = df
        logger.info(f"Data processing completed successfully! Processed {len(df)} restaurants")
        return True
        
    except Exception as e:
        logger.error(f"Critical error during data loading: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

@app.route('/')
def index():
    """Serve the main dashboard page"""
    return send_from_directory('.', 'index.html')

@app.route('/styles.css')
def styles():
    """Serve the CSS file"""
    return send_from_directory('.', 'styles.css', mimetype='text/css')

@app.route('/app.js')
def app_js():
    """Serve the JavaScript file"""
    return send_from_directory('.', 'app.js', mimetype='application/javascript')

@app.route('/favicon.ico')
def favicon():
    """Serve an empty response for favicon requests"""
    return ('', 204)

@app.route('/api/health')
def health_check():
    """Health check endpoint to diagnose server status"""
    global restaurant_data
    
    status = {
        'server_running': True,
        'data_loaded': restaurant_data is not None,
        'csv_file_exists': os.path.exists('zomato.csv'),
        'current_directory': os.getcwd(),
        'restaurant_count': len(restaurant_data) if restaurant_data is not None else 0
    }
    
    return jsonify(status)

@app.route('/api/reload-data')
def reload_data():
    """Manually reload the data and return detailed status"""
    global restaurant_data
    
    logger.info("Manual data reload requested...")
    
    # Reset the data
    restaurant_data = None
    
    # Attempt to load data
    success = load_and_process_data()
    
    status = {
        'reload_attempted': True,
        'reload_successful': success,
        'data_loaded': restaurant_data is not None,
        'csv_file_exists': os.path.exists('zomato.csv'),
        'current_directory': os.getcwd(),
        'restaurant_count': len(restaurant_data) if restaurant_data is not None else 0
    }
    
    if success:
        return jsonify(status)
    else:
        return jsonify(status), 500

@app.route('/script.js')
def script_js():
    """Serve the legacy JavaScript file if needed"""
    return send_from_directory('.', 'script.js', mimetype='application/javascript')

@app.route('/api/data')
def get_data():
    """Get all restaurant data with optional filtering"""
    if not ensure_data_loaded():
        return jsonify({'error': 'Data not loaded'}), 500
    
    # Get filter parameters
    city = request.args.get('city')
    price_range = request.args.get('price_range')
    min_rating = request.args.get('min_rating')
    search = request.args.get('search', '').lower()
    
    # Start with all data
    filtered_df = restaurant_data.copy()
    
    # Apply filters
    if city and city != 'all':
        filtered_df = filtered_df[filtered_df['City'] == city]
    
    if price_range and price_range != 'all':
        filtered_df = filtered_df[filtered_df['Price range'] == int(price_range)]
    
    if min_rating:
        filtered_df = filtered_df[filtered_df['Aggregate rating'] >= float(min_rating)]
    
    if search:
        mask = (
            filtered_df['Restaurant Name'].str.lower().str.contains(search, na=False) |
            filtered_df['Cuisines'].str.lower().str.contains(search, na=False) |
            filtered_df['City'].str.lower().str.contains(search, na=False)
        )
        filtered_df = filtered_df[mask]
    
    # Convert to JSON-serializable format
    result = []
    for _, row in filtered_df.iterrows():
        result.append({
            'name': row['Restaurant Name'],
            'city': row['City'],
            'cuisines': row['Cuisines'],
            'rating': float(row['Aggregate rating']) if pd.notna(row['Aggregate rating']) else 0,
            'votes': int(row['Votes']) if pd.notna(row['Votes']) else 0,
            'cost': int(row['Average Cost for two']) if pd.notna(row['Average Cost for two']) else 0,
            'price_range': int(row['Price range']) if pd.notna(row['Price range']) else 0,
            'has_booking': bool(row['Has Table booking']),
            'has_delivery': bool(row['Has Online delivery']),
            'is_delivering': bool(row['Is delivering now'])
        })
    
    return jsonify(result)

@app.route('/api/stats')
def get_stats():
    """Get dashboard statistics"""
    if not ensure_data_loaded():
        return jsonify({'error': 'Data not loaded'}), 500
    
    # Apply same filters as data endpoint
    city = request.args.get('city')
    price_range = request.args.get('price_range')
    min_rating = request.args.get('min_rating')
    search = request.args.get('search', '').lower()
    
    filtered_df = restaurant_data.copy()
    
    if city and city != 'all':
        filtered_df = filtered_df[filtered_df['City'] == city]
    
    if price_range and price_range != 'all':
        filtered_df = filtered_df[filtered_df['Price range'] == int(price_range)]
    
    if min_rating:
        filtered_df = filtered_df[filtered_df['Aggregate rating'] >= float(min_rating)]
    
    if search:
        mask = (
            filtered_df['Restaurant Name'].str.lower().str.contains(search, na=False) |
            filtered_df['Cuisines'].str.lower().str.contains(search, na=False) |
            filtered_df['City'].str.lower().str.contains(search, na=False)
        )
        filtered_df = filtered_df[mask]
    
    # Calculate statistics
    total_restaurants = len(filtered_df)
    rated_restaurants = filtered_df[filtered_df['Aggregate rating'] > 0]
    avg_rating = float(rated_restaurants['Aggregate rating'].mean()) if len(rated_restaurants) > 0 else 0
    unique_cities = filtered_df['City'].nunique()
    
    return jsonify({
        'total_restaurants': total_restaurants,
        'avg_rating': round(avg_rating, 1),
        'unique_cities': unique_cities
    })

@app.route('/api/analytics/rating-distribution')
def get_rating_distribution():
    """Get rating distribution data"""
    if not ensure_data_loaded():
        return jsonify({'error': 'Data not loaded'}), 500
    
    # Apply filters
    filtered_df = apply_filters(restaurant_data)
    
    rating_ranges = {
        'Excellent (4.5+)': len(filtered_df[filtered_df['Aggregate rating'] >= 4.5]),
        'Very Good (4.0-4.4)': len(filtered_df[(filtered_df['Aggregate rating'] >= 4.0) & (filtered_df['Aggregate rating'] < 4.5)]),
        'Good (3.5-3.9)': len(filtered_df[(filtered_df['Aggregate rating'] >= 3.5) & (filtered_df['Aggregate rating'] < 4.0)]),
        'Average (3.0-3.4)': len(filtered_df[(filtered_df['Aggregate rating'] >= 3.0) & (filtered_df['Aggregate rating'] < 3.5)]),
        'Poor (<3.0)': len(filtered_df[filtered_df['Aggregate rating'] < 3.0])
    }
    
    return jsonify(rating_ranges)

@app.route('/api/analytics/top-cities')
def get_top_cities():
    """Get top cities by restaurant count"""
    if not ensure_data_loaded():
        return jsonify({'error': 'Data not loaded'}), 500
    
    filtered_df = apply_filters(restaurant_data)
    city_counts = filtered_df['City'].value_counts().head(10)
    
    return jsonify({
        'labels': city_counts.index.tolist(),
        'values': city_counts.values.tolist()
    })

@app.route('/api/analytics/price-distribution')
def get_price_distribution():
    """Get price range distribution"""
    if not ensure_data_loaded():
        return jsonify({'error': 'Data not loaded'}), 500
    
    filtered_df = apply_filters(restaurant_data)
    price_labels = {1: 'Budget', 2: 'Affordable', 3: 'Mid-range', 4: 'Expensive'}
    price_counts = filtered_df['Price range'].value_counts().sort_index()
    
    return jsonify({
        'labels': [price_labels.get(i, f'Range {i}') for i in price_counts.index],
        'values': price_counts.values.tolist()
    })

@app.route('/api/analytics/popular-cuisines')
def get_popular_cuisines():
    """Get popular cuisines data"""
    if not ensure_data_loaded():
        return jsonify({'error': 'Data not loaded'}), 500
    
    filtered_df = apply_filters(restaurant_data)
    
    # Split cuisines and count
    all_cuisines = []
    for cuisines in filtered_df['Cuisines'].dropna():
        all_cuisines.extend([c.strip() for c in str(cuisines).split(',')])
    
    cuisine_counts = pd.Series(all_cuisines).value_counts().head(8)
    
    return jsonify({
        'labels': cuisine_counts.index.tolist(),
        'values': cuisine_counts.values.tolist()
    })

@app.route('/api/analytics/services')
def get_services_data():
    """Get online services availability data"""
    if not ensure_data_loaded():
        return jsonify({'error': 'Data not loaded'}), 500
    
    filtered_df = apply_filters(restaurant_data)
    
    services_data = {
        'Table Booking': int(filtered_df['Has Table booking'].sum()),
        'Online Delivery': int(filtered_df['Has Online delivery'].sum()),
        'Currently Delivering': int(filtered_df['Is delivering now'].sum())
    }
    
    return jsonify(services_data)

@app.route('/api/analytics/cost-by-city')
def get_cost_by_city():
    """Get average cost by city"""
    if not ensure_data_loaded():
        return jsonify({'error': 'Data not loaded'}), 500
    
    filtered_df = apply_filters(restaurant_data)
    cost_by_city = filtered_df[filtered_df['Average Cost for two'] > 0].groupby('City')['Average Cost for two'].mean().sort_values(ascending=False).head(8)
    
    return jsonify({
        'labels': cost_by_city.index.tolist(),
        'values': [round(val, 2) for val in cost_by_city.values.tolist()]
    })

@app.route('/api/filters/cities')
def get_cities():
    """Get list of all cities for filter dropdown"""
    if not ensure_data_loaded():
        return jsonify({'error': 'Data not loaded'}), 500
    
    cities = sorted(restaurant_data['City'].unique().tolist())
    return jsonify(cities)

@app.route('/api/insights')
def get_insights():
    """Get advanced insights and recommendations"""
    if not ensure_data_loaded():
        return jsonify({'error': 'Data not loaded'}), 500
    
    filtered_df = apply_filters(restaurant_data)
    
    insights = []
    
    # Top rated restaurant
    top_rated = filtered_df.loc[filtered_df['Aggregate rating'].idxmax()]
    insights.append({
        'type': 'highlight',
        'title': 'Highest Rated Restaurant',
        'content': f"{top_rated['Restaurant Name']} in {top_rated['City']} with {top_rated['Aggregate rating']} rating"
    })
    
    # Most expensive city
    if len(filtered_df[filtered_df['Average Cost for two'] > 0]) > 0:
        expensive_city = filtered_df[filtered_df['Average Cost for two'] > 0].groupby('City')['Average Cost for two'].mean().idxmax()
        avg_cost = filtered_df[filtered_df['City'] == expensive_city]['Average Cost for two'].mean()
        insights.append({
            'type': 'info',
            'title': 'Most Expensive City',
            'content': f"{expensive_city} with average cost of ₹{avg_cost:.0f} for two"
        })
    
    # Popular cuisine
    all_cuisines = []
    for cuisines in filtered_df['Cuisines'].dropna():
        all_cuisines.extend([c.strip() for c in str(cuisines).split(',')])
    
    if all_cuisines:
        popular_cuisine = pd.Series(all_cuisines).value_counts().index[0]
        cuisine_count = pd.Series(all_cuisines).value_counts().iloc[0]
        insights.append({
            'type': 'trend',
            'title': 'Most Popular Cuisine',
            'content': f"{popular_cuisine} appears in {cuisine_count} restaurants"
        })
    
    return jsonify(insights)

def apply_filters(df):
    """Helper function to apply filters to dataframe"""
    city = request.args.get('city')
    price_range = request.args.get('price_range')
    min_rating = request.args.get('min_rating')
    search = request.args.get('search', '').lower()
    
    filtered_df = df.copy()
    
    if city and city != 'all':
        filtered_df = filtered_df[filtered_df['City'] == city]
    
    if price_range and price_range != 'all':
        filtered_df = filtered_df[filtered_df['Price range'] == int(price_range)]
    
    if min_rating:
        filtered_df = filtered_df[filtered_df['Aggregate rating'] >= float(min_rating)]
    
    if search:
        mask = (
            filtered_df['Restaurant Name'].str.lower().str.contains(search, na=False) |
            filtered_df['Cuisines'].str.lower().str.contains(search, na=False) |
            filtered_df['City'].str.lower().str.contains(search, na=False)
        )
        filtered_df = filtered_df[mask]
    
    return filtered_df

if __name__ == '__main__':
    # Load data on startup
    if not os.path.exists('zomato.csv'):
        print("Error: zomato.csv file not found!")
        exit(1)
    
    if load_and_process_data():
        print("Starting Zomato Analytics Dashboard...")
        print("Dashboard will be available at: http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("Failed to load data. Please check the CSV file.")
